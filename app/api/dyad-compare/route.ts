import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractValidJSON } from '@/lib/json-extractor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { resultIds } = await req.json();
    if (!Array.isArray(resultIds) || resultIds.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 resultIds' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    // Fetch results and all questions
    const [results, questions] = await Promise.all([
      prisma.result.findMany({ where: { id: { in: resultIds } } }),
      prisma.question.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

    if (results.length < 2) {
      return NextResponse.json({ error: 'Could not find 2 results' }, { status: 404 });
    }

    // Helper to get role label
    const getRoleLabel = (r: any) => {
      const role = r.parentRole || (r.answers as any)?.['0.3'];
      if (role === 'MAMA') return 'Мама';
      if (role === 'PAPA') return 'Папа';
      return 'Родитель';
    };

    // Build open questions context (B and C blocks)
    const openQuestions = questions.filter(q => q.block === 'B' || q.block === 'C');

    const answersText = openQuestions.map(q => {
      const lines = results.map(r => {
        const answers = r.answers as Record<string, any>;
        const raw = answers[q.code || ''];
        let val = '(нет ответа)';
        if (raw !== undefined && raw !== null && raw !== '') {
          if (typeof raw === 'object') {
            // Parse MATRIX answer like {school:X, family:Y, child:Z} or array
            if (Array.isArray(raw)) {
              const opts = q.options as string[] | null;
              val = raw.map((v: any, i: number) => `${opts?.[i] || `поле ${i}`}: ${v}%`).join(', ');
            } else if (raw.school !== undefined) {
              val = `Школа: ${raw.school}%, Семья: ${raw.family}%, Ребёнок: ${raw.child}%`;
            } else {
              val = JSON.stringify(raw);
            }
          } else {
            val = String(raw);
          }
        }
        return `${getRoleLabel(r)}: ${val}`;
      }).join('\n');

      return `ВОПРОС [${q.code}]: ${q.text}\n${lines}`;
    }).join('\n\n---\n\n');

    const systemPrompt = `Ты — аналитик семейных паттернов для школы Mezon Inspiring School. Тебе дают ответы ОБОИХ родителей на одинаковые открытые вопросы (Блоки B и C). Твоя задача — сравнить их и выявить:
1. Точки согласия (оба демонстрируют партнёрскую позицию)
2. Точки расхождения (один готов к партнёрству, другой — нет)
3. Красные флаги одного или обоих родителей
4. Итоговый вывод о совместимости семьи со школой

ОТВЕЧАЙ СТРОГО В JSON без маркдауна:
{
  "agreements": ["согласие 1", "согласие 2"],
  "conflicts": ["расхождение 1", "расхождение 2"],
  "redFlags": ["флаг 1", "флаг 2"],
  "summary": "Общий вывод о семейной диаде (до 400 символов). Конкретно, без лишних слов.",
  "dyadScore": <число от 0 до 10, где 10 — идеальная совместимость>
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

    const aiResult = await model.generateContent(`${systemPrompt}\n\n${answersText}`);
    let text = aiResult.response.text();

    let analysis: any;
    try {
      analysis = extractValidJSON(text);
    } catch (err: any) {
      throw new Error('Cannot parse AI response: ' + text.substring(0, 200) + ' | ' + err.message);
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Dyad compare error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
