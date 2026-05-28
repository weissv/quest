import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

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
    
    const defaultPrompt = `Ты — жесткий и проницательный клинический психолог и образовательный методист. Твоя задача — провести поведенческий анализ ответов родителей (блоки B, C, D) для выявления их реальной позиции в отношении субъектности ребенка.
Родители склонны давать социально одобряемые ответы. Твоя цель — пробиться сквозь декларации и найти факты прошлого поведения.

ПРАВИЛА ОЦЕНКИ (ОЧЕНЬ СТРОГО):
Ищи следующие маркеры в текстах ответов:
1. "МЫ-синдром" (Слияние): Использование местоимения "Мы" в отношении учебы ("мы делали проект", "мы перешли в 5 класс", "мы получили двойку"). Это красный флаг. Оценка = 0.
2. Спасательство (Низкая толерантность к фрустрации): Родитель сам звонит учителю, делает уроки за ребенка, жалеет его в ущерб правилам, не может выдержать слезы/обиду ребенка. Оценка = 0.
3. Внешний локус контроля: Перекладывание вины на "слабого педагога", "сложную программу", "плохую компанию". Оценка = 0.
4. Субъектная позиция (Партнерство): Родитель использует "Я" для своих действий и "Он/Она" для действий ребенка. Родитель описывает, как позволил ребенку столкнуться с последствиями (двойка, несдача). Родитель выдержал конфликт/фрустрацию, не сломав оговоренную рамку. Оценка = 2.
5. Декларация без действий: Правильные слова ("нужно быть самостоятельным"), но в описании ситуации нет конкретных действий родителя. Оценка = 1.

АНАЛИЗ БЛОКА C (Ответственность):
Если на Школу или Семью выделено больше процентов, чем на Ребенка — это риск. В субъектной модели Ребенок должен нести >50% ответственности.

ОТВЕТЫ ПОЛЬЗОВАТЕЛЯ:
{OPEN_ANSWERS}

Выведи результат СТРОГО в формате валидного JSON (без маркдауна, только сырой JSON):
{
  "scores": { "B1": 0, "B2": 0, "C1": 0, "D1": 0 },
  "riskFlags": true,
  "recommendation": "Один из вариантов: Отказать / Жесткое собеседование / Зачислить с испытательным сроком / Зачислить",
  "comment": "Твой детальный, циничный и честный анализ паттернов поведения родителя. Укажи, где они врут себе, где сливаются с ребенком, а где реально готовы к партнерству."
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
        // Clean markdown wrapper from LLM response if present
        responseText = responseText.replace(/```json\n?|```\n?/g, '').trim();
        aiAnalysis = JSON.parse(responseText);
      } catch (err: any) {
        console.error('Gemini API Error:', err);
      }
    }

    // ── 5. Determine Overall Status ──
    let finalStatus = 'pending';
    if (sjtScore < 5 || aiAnalysis?.riskFlags) {
      finalStatus = 'rejected';
    } else if (sjtScore >= 9) {
      finalStatus = 'approved';
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
