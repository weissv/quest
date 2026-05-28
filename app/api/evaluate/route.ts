import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getQuestions, saveResult } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { answers } = await req.json();

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body: missing answers' },
        { status: 400 }
      );
    }

    const questions = await getQuestions();

    // ── 1. Calculate SJT Score ──
    let sjtScore = 0;
    questions.forEach((q: any) => {
      if (q.block === 'A' && q.options) {
        const selectedOption = q.options.find(
          (opt: any) => opt.label === answers[q.id]
        );
        if (selectedOption && typeof selectedOption.weight === 'number') {
          sjtScore += selectedOption.weight;
        }
      }
    });

    // ── 2. Determine status ──
    let status = '';
    let aiVerdict = null;

    if (sjtScore >= 9) {
      status = '✅ Прямое зачисление';
    } else if (sjtScore < 5) {
      status = '❌ Не совместимо';
    } else {
      status = '🟡 Блок B + собеседование (Требуется верификация AI)';

      // ── 3. Collect open-ended answers for AI analysis ──
      const openAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith('B') || key.startsWith('D'))
        .map(([key, val]) => `Вопрос ${key}: ${val}`)
        .join('\n');

      const aiPrompt = `
Ты — школьный психолог и методист, работающий в модели формирования субъектности. Проанализируй ответы родителей на открытые вопросы анкеты. 
Не ищи ключевые слова. Ищи поведенческие паттерны.

Для каждого ответа оцени по шкале 0-2:
0 = Потребительская/спасательская позиция. Локус контроля внешний. Готовность ломать рамку при дискомфорте.
1 = Нейтральная/декларативная позиция. Понимание теории, но нет конкретики действий. Избегание цены выбора.
2 = Партнёрская/субъектная позиция. Конкретные шаги. Готовность удерживать рамку без насилия. Принятие фрустрации как части роста. Ясный локус ответственности.

Ответы:
${openAnswers}

Выведи строго в формате JSON:
{
  "scores": { "B1": 0, "B2": 0, "B3": 0, "B4": 0 },
  "riskFlags": true,
  "recommendation": "Зачислить",
  "comment": "Краткое обоснование"
}
`.trim();

      // ── 4. Call Gemini API ──
      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });

          const result = await model.generateContent(aiPrompt);
          const response = result.response;
          const text = response.text();

          try {
            // Parse JSON from response (handle potential markdown wrapping)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiVerdict = JSON.parse(jsonMatch[0]);
            } else {
              aiVerdict = { rawText: text };
            }
          } catch {
            aiVerdict = {
              error: 'Не удалось распарсить JSON от AI',
              rawText: text,
            };
          }
        } catch (aiError) {
          console.error('Gemini API Error:', aiError);
          aiVerdict = {
            error: `Ошибка Gemini API: ${aiError instanceof Error ? aiError.message : 'Unknown'}`,
          };
        }
      } else {
        aiVerdict = { error: 'GEMINI_API_KEY не задан на сервере' };
      }
    }

    // ── 5. Save Result ──
    const finalResult = {
      id: Date.now().toString(),
      answers,
      sjtScore,
      status,
      aiAnalysis: aiVerdict,
    };
    
    await saveResult(finalResult);

    return NextResponse.json({
      status,
      sjtScore,
      aiAnalysis: aiVerdict,
    });
  } catch (error) {
    console.error('Evaluation Error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
