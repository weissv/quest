import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractValidJSON } from '@/lib/json-extractor';

export async function POST(req: Request) {
  try {
    const { resultId } = await req.json();

    if (!resultId) {
      return NextResponse.json({ error: 'resultId is required' }, { status: 400 });
    }

    const resultRecord = await prisma.result.findUnique({
      where: { id: resultId },
    });

    if (!resultRecord) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const answers = resultRecord.answers as Record<string, string>;
    const sjtScore = resultRecord.sjtScore;

    // We only trigger AI if they are in the gray zone (or if forced via admin, we can just do it anyway)
    // To be safe, we just run the AI for whatever open answers they provided.
    
    // ── 1. Get Open Answers ──
    const openAnswers = Object.entries(answers)
      .filter(([key]) => key.startsWith('B') || key.startsWith('C'))
      .map(([key, val]) => `Вопрос ${key}: ${val}`)
      .join('\n');

    let aiAnalysis: any = null;

    if (openAnswers.length > 0) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
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
Взгляни на распределение %. В норме для школьника средних классов ответственность ребенка должна быть существенной (обычно >= 40-50%). Если родитель отдал Школе неадекватно много (например, >50%), это маркер потребительского отношения. Если Семье >60% — гиперопека. Если Ребенку отведено менее 30% — это жесткий триггер инфантилизации. Используй это для корректировки финального вывода.

ОТВЕТЫ ПОЛЬЗОВАТЕЛЯ:
{OPEN_ANSWERS}

КРИТИЧЕСКИ ВАЖНО: Верни ТОЛЬКО валидный JSON без каких-либо пояснений, markdown-разметки, кавычек или текста до/после. Начни ответ с символа { и заверши символом }.
Строго следуй этой схеме JSON:
{"scores":{"B1":0,"B2":0,"B3":0},"total_score":0,"reasoning":"Краткий профессиональный психологический анализ...","status":"approved"}`;

      const promptTemplate = setting?.value || defaultPrompt;
      // Support both ${openAnswers} (template literal style) and {OPEN_ANSWERS} (old style)
      const aiPrompt = promptTemplate
        .replace('${openAnswers}', openAnswers)
        .replace('{OPEN_ANSWERS}', openAnswers);

      try {
        // IMPORTANT: gemma-4-31b-it does NOT support responseMimeType: 'application/json'
        // Using it returns empty/malformed responses. JSON is enforced via the prompt text itself.
        const model = genAI.getGenerativeModel({
          model: 'gemma-4-31b-it',
        });

        const result = await model.generateContent(aiPrompt);
        let responseText = result.response.text();
        
        console.log('[re-evaluate] Raw AI response (first 400):', responseText.substring(0, 400));
        
        aiAnalysis = extractValidJSON(responseText);
        
        console.log('[re-evaluate] AI analysis OK. score=', aiAnalysis?.total_score);
        
      } catch (err: any) {
        console.error('Gemini API Error:', err.message);
        // Graceful fallback — admin sees error but panel keeps working
        aiAnalysis = {
          scores: { B1: 0, B2: 0, B3: 0 },
          total_score: 0,
          reasoning: `Ошибка ИИ-анализа. Требуется ручная модерация. ${err.message?.substring(0, 100) || ''}`,
          status: 'pending',
          error: true,
        };
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
      if (aiAnalysis.status === 'rejected') {
        finalStatus = 'rejected';
      }
    }

    // Update the DB
    const updated = await prisma.result.update({
      where: { id: resultId },
      data: {
        status: finalStatus,
        aiAnalysis: aiAnalysis || {},
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('Re-evaluate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
