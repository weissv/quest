import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const questions = await prisma.question.findMany();

    // ── 1. Calculate SJT Score (Block A) ──
    let sjtScore = 0;
    const sjtQuestions = questions.filter((q) => q.block === 'A');
    for (const q of sjtQuestions) {
      const selectedOptionText = answers[q.id];
      if (selectedOptionText && q.options) {
        // Cast JSON to array safely
        const optionsArr = q.options as any[];
        if (Array.isArray(optionsArr)) {
          const option = optionsArr.find((o: any) => o.label === selectedOptionText);
          if (option && typeof option.weight === 'number') {
            sjtScore += option.weight;
          }
        }
      }
    }

    // ── 2. Format Open Answers ──
    const openAnswers = questions
      .filter((q) => q.block === 'B' || q.block === 'C' || q.block === 'D')
      .map((q) => {
        const ans = answers[q.id] || 'Нет ответа';
        return `Вопрос (${q.id}): ${q.text}\nОтвет: ${ans}`;
      })
      .join('\n\n');

    // ── 3. Prepare AI Prompt ──
    const setting = await prisma.setting.findUnique({ where: { key: 'gemini_prompt' } });
    
    const defaultPrompt = `Ты — опытный клинический психолог, эксперт по семейной системной терапии и профайлер частной прогрессивной школы "Mezon". 
Школа базируется на жестком партнерстве «учитель — родитель — ребенок», развитии субъектности и ответственности. 

Твоя задача — глубоко проанализировать текстовые ответы родителя (Блок B) и распределение ответственности (Блок C), чтобы выявить скрытые психологические паттерны. Мы ищем маркеры "Спасательства" (гиперопека), "Потребительства" (школа нам должна) и внешнего локуса контроля. Нам нужны только осознанные родители-партнеры.

ПРАВИЛА ОЦЕНКИ КАЖДОГО ОТВЕТА (от 0 до 2 баллов):

[0 БАЛЛОВ] — КРАСНЫЙ ФЛАГ (Токсичный паттерн)
- Слияние: Использование местоимения "Мы" вместо "Он/Она" ("мы делаем уроки", "мы перешли в 5 класс").
- Спасательство / Низкая толерантность к фрустрации: Родитель не выдерживает негативных эмоций ребенка, уступает, делает работу за него, спасает от последствий (двойки, выговора).
- Внешний локус: Перекладывание вины на учителей, "систему", других детей. 
- Потребительская позиция: Ожидание, что школа должна развлекать, обеспечивать 100% комфорт без усилий со стороны семьи.

[1 БАЛЛ] — ЖЕЛТЫЙ ФЛАГ (Декларация без действий / Неопределенность)
- Правильные, социально-одобряемые слова ("нужно быть самостоятельным"), но в тексте нет описания КОНКРЕТНЫХ действий родителя. 
- Общие фразы, уход от прямого ответа.

[2 БАЛЛА] — ЗЕЛЕНЫЙ ФЛАГ (Субъектность)
- Разделение ответственности: Родитель использует "Я" для своих действий и "Он" для действий ребенка.
- Выдерживание фрустрации: Родитель спокойно перенес конфликт, истерику или слезы, не сломав оговоренные правила (границы).
- Естественные последствия: Родитель позволил ребенку ошибиться, получить низкий балл или столкнуться с отказом, чтобы тот получил опыт.

АНАЛИЗ БЛОКА C (Ответственность):
Взгляни на распределение %. В норме для школьника средних классов ответственность ребенка должна быть существенной (обычно ≥ 40-50%). Если родитель отдал Школе неадекватно много (например, >50%), это маркер потребительского отношения. Если Семье >60% — гиперопека. Если Ребенку отведено менее 30% — это жесткий триггер инфантилизации. Используй это для корректировки финального вывода.

ОТВЕТЫ ПОЛЬЗОВАТЕЛЯ:
{OPEN_ANSWERS}

ФОРМАТ ОТВЕТА:
Ты обязан вернуть результат СТРОГО в формате валидного JSON (без markdown-разметки, без комментариев). 
Схема JSON:
{
  "scores": {
    "B1": 0,
    "B2": 0,
    "B3": 0
  },
  "total_score": 0,
  "reasoning": "Здесь напиши краткий, безжалостный и профессиональный психологический анализ...",
  "status": "approved или rejected"
}`;

    const promptTemplate = setting?.value || defaultPrompt;
    const aiPrompt = promptTemplate.replace('{OPEN_ANSWERS}', openAnswers);

    // ── 4. Call Gemini API ──
    let aiAnalysis = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemma-4-31b-it',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const result = await model.generateContent(aiPrompt);
        let responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response: ' + responseText);
        }
      } catch (err: any) {
        console.error('Gemini API Error:', err);
      }
    }

    // ── 5. Determine Overall Status ──
    let finalStatus = 'pending';
    if (sjtScore <= 4) {
      finalStatus = 'rejected';
    } else if (sjtScore >= 10) {
      finalStatus = 'approved';
    } else if (aiAnalysis) {
      const totalScore = sjtScore + (aiAnalysis.total_score || 0);
      if (totalScore >= 11) {
        finalStatus = 'approved';
      } else {
        finalStatus = 'rejected';
      }
      
      // Explicit override from AI reasoning if it flagged severe issues
      if (aiAnalysis.status === 'rejected') {
        finalStatus = 'rejected';
      }
    }

    // ── 6. Save Result to DB ──
    const newResult = await prisma.result.create({
      data: {
        answers,
        sjtScore,
        status: finalStatus,
        aiAnalysis: aiAnalysis || {},
      },
    });

    return NextResponse.json({
      success: true,
      resultId: newResult.id,
      aiAnalysis,
      sjtScore,
      status: finalStatus,
    });
  } catch (error: any) {
    console.error('Evaluate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
