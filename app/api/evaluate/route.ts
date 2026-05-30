import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractValidJSON } from '@/lib/json-extractor';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use standard model based on user settings earlier (e.g., gemini-1.5-pro or standard text model)
const AI_MODEL = 'gemma-4-31b-it';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { familyCode, parentRole, cohort, answers } = body;

    // 1. Извлекаем все вопросы данной когорты из БД для валидации весов
    const dbQuestions = await prisma.question.findMany({
      where: {
        OR: [
          { cohort: cohort },
          { cohort: null }
        ]
      }
    });

    // 2. Рассчитываем SJT Score
    let sjtScore = 0;
    const sjtQuestions = dbQuestions.filter((q: any) => q.type === 'SJT');
    
    for (const question of sjtQuestions) {
      const selectedIndex = answers[question.code || ''];
      if (selectedIndex !== undefined && question.options) {
        const options = question.options as Array<{ weight: number }>;
        sjtScore += options[selectedIndex]?.weight || 0;
      }
    }

    // 3. Быстрая маршрутизация (Edge Cases)
    if (sjtScore >= 12) {
      const result = await prisma.result.create({
        data: {
          familyCode, 
          parentRole, 
          cohort, 
          answers, 
          sjtScore,
          totalScore: sjtScore, 
          status: 'PENDING', 
          aiReasoning: 'Рекомендация системы: APPROVED. Автоматический проход по результатам SJT-ядра (высокая субъектность/комплаенс).'
        }
      });
      return NextResponse.json({ status: 'PENDING', result });
    }

    if (sjtScore <= 6) { // Auto-reject threshold adjusted to <= 6 as per blueprint
      const result = await prisma.result.create({
        data: {
          familyCode, 
          parentRole, 
          cohort, 
          answers, 
          sjtScore,
          totalScore: sjtScore, 
          status: 'PENDING', 
          aiReasoning: 'Рекомендация системы: REJECTED. Автоматический отказ. Критически низкий уровень базового комплаенса и партнерства.'
        }
      });
      return NextResponse.json({ status: 'PENDING', result });
    }

    // 4. СЕРАЯ ЗОНА: Вызов ИИ Оценщика (Блок B + C)
    const aiEvaluation = await runAIEvaluator(dbQuestions, answers, sjtScore);
    
    // 5. Кросс-анализ диады
    const finalDyadMetrics = await analyzeFamilyDyad(familyCode, parentRole, answers, sjtScore);

    const totalScore = sjtScore + (aiEvaluation.total_score || 0);
    // Decision logic based on total score (13.5) or if matrix anomaly flag is true
    let recommendedStatus = totalScore >= 13.5 ? 'APPROVED' : 'REJECTED';
    
    // If dyad analysis finds conflict, we route to INTERVIEW/REVIEW instead of auto-approve/reject
    if (finalDyadMetrics.roleConflict && recommendedStatus === 'APPROVED') {
      recommendedStatus = 'INTERVIEW';
    } else if (recommendedStatus === 'REJECTED' && totalScore >= 12) {
      recommendedStatus = 'REVIEW';
    }

    const result = await prisma.result.create({
      data: {
        familyCode,
        parentRole,
        cohort,
        answers,
        sjtScore,
        aiScore: aiEvaluation.total_score,
        totalScore: totalScore,
        status: 'PENDING',
        aiAnalysis: aiEvaluation,
        aiReasoning: `Рекомендация ИИ: ${recommendedStatus}. ` + (aiEvaluation.reasoning || ''),
        behavioralFlags: aiEvaluation.behavioral_flags || [],
        dyadMetrics: finalDyadMetrics
      }
    });

    return NextResponse.json({ status: 'PENDING', result });

  } catch (error: any) {
    console.error('Evaluate API Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

async function analyzeFamilyDyad(familyCode: string, currentRole: string, currentAnswers: any, currentSjt: number) {
  if (!familyCode) return { status: "No family code provided", roleConflict: false, mismatchDelta: 0 };

  const partnerRole = currentRole === 'MAMA' ? 'PAPA' : 'MAMA';
  const partnerResult = await prisma.result.findFirst({
    where: { familyCode, parentRole: partnerRole as any },
    orderBy: { createdAt: 'desc' }
  });

  if (!partnerResult) {
    return { status: "Awaiting partner submission", roleConflict: false, mismatchDelta: 0 };
  }

  // Считаем дельту базовых SJT баллов
  const delta = Math.abs(currentSjt - partnerResult.sjtScore);
  
  // Проверяем жесткий конфликт матрицы ответственности (Блок C)
  const c1Current = currentAnswers['C1'] || [0,0,0];
  const c1Partner = typeof partnerResult.answers === 'object' && partnerResult.answers !== null ? (partnerResult.answers as any)['C1'] : null;
  const partnerMatrix = c1Partner || [0,0,0];
  
  // Assuming matrix answers are arrays of [School, Family, Child]
  const currentFamily = parseInt(c1Current[1] || '0', 10);
  const currentChild = parseInt(c1Current[2] || '0', 10);
  
  const partnerFamily = parseInt(partnerMatrix[1] || '0', 10);
  const partnerChild = parseInt(partnerMatrix[2] || '0', 10);

  const familyDelta = Math.abs(currentFamily - partnerFamily);
  const childDelta = Math.abs(currentChild - partnerChild);
  
  const hasRoleConflict = delta > 4 || familyDelta > 25 || childDelta > 25;

  return {
    status: "Dyad Fully Analyzed",
    mismatchDelta: delta,
    roleConflict: hasRoleConflict,
    metrics: { familyDelta, childDelta }
  };
}

async function runAIEvaluator(questions: any[], answers: any, sjtScore: number) {
  const openQuestionsData = questions
    .filter((q: any) => q.type === 'OPEN' || q.type === 'MATRIX')
    .map((q: any) => `КОД: ${q.code}\nВОПРОС: ${q.text}\nОТВЕТ РОДИТЕЛЯ: ${JSON.stringify(answers[q.code || ''])}`)
    .join('\n\n');

  const systemInstruction = `Ты — безжалостный, критически мыслящий профайлер и эксперт по поведенческой психологии для Mezon Inspiring School. Твой метод близок к деконструкции: ты не веришь словам, ты ищешь паттерны поведения.

Контекст оценки базируется на трех столпах:
1. "The Mom Test": Игнорируй любые гипотетические обещания родителя ("я бы сделал", "мы считаем важным"). Оценивай ТОЛЬКО описание реальных поступков из прошлого. Если родитель уворачивается от описания прошлого опыта и льет воду — это красный флаг (0 баллов).
2. "Границы" (Boundaries): Родитель обязан быть отдельной личностью, а не придатком ребенка. Ищи семантические маркеры слияния (использование "Мы" вместо "Он/Она"). Оценивай способность родителя выдерживать конфликт и детскую истерику без чувства вины.
3. "Дар провала" (The Gift of Failure): Ошибка ребенка — это его тренажер. Если родитель в ответах спасает ребенка от последствий (делает за него, ругается с учителями, оправдывает) — это токсичное "спасательство".

МЕТРИКИ ОЦЕНКИ (0-2 балла за ответ):
[0] - Спасатель/Потребитель. В ответе есть попытка подстелить соломку, перенос вины на "систему/учителя", или уход от конкретного примера из прошлого в абстрактные рассуждения.
[1] - Декларативная норма. Описан реальный случай, но реакция родителя была непоследовательной (сначала наказал, потом пожалел и сделал за него).
[2] - Холодное партнерство. Родитель четко описал, как позволил ребенку провалиться, столкнуться с болью последствий, и выступил в роли поддерживающего наблюдателя, а не решалы.

Ответ СТРОГО в JSON:
{
  "scores": { "B1": 0, "B2": 0, "B3": 0 },
  "behavioral_flags": ["список выявленных когнитивных искажений или токсичных паттернов"],
  "total_score": <int>,
  "reasoning": "<Холодный, саркастичный и сугубо профессиональный анализ поведенческого профиля (до 400 символов). Бей в суть.>"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await model.generateContent(openQuestionsData);
    const text = response.response.text();
    let aiAnalysis = extractValidJSON(text);

    if (Array.isArray(aiAnalysis) && aiAnalysis.length > 0) {
      aiAnalysis = aiAnalysis[0];
    }
    if (!aiAnalysis || typeof aiAnalysis !== 'object') {
      aiAnalysis = {};
    }

    aiAnalysis.total_score = aiAnalysis.total_score ?? aiAnalysis.totalScore ?? 0;
    aiAnalysis.behavioral_flags = aiAnalysis.behavioral_flags ?? aiAnalysis.behavioralFlags ?? [];
    aiAnalysis.scores = aiAnalysis.scores ?? {};
    aiAnalysis.reasoning = aiAnalysis.reasoning ?? aiAnalysis.comment ?? 'Анализ завершен, но ИИ не предоставил текстового вывода.';

    return aiAnalysis;
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return {
      scores: {},
      total_score: 0,
      behavioral_flags: ['Error parsing AI response'],
      reasoning: 'Ошибка ИИ-оценки. Требуется ручная модерация.'
    };
  }
}
