import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use standard model based on user settings earlier (e.g., gemini-1.5-pro or standard text model)
const AI_MODEL = 'gemini-1.5-pro-latest';

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
          status: 'APPROVED', 
          aiReasoning: 'Автоматический проход по результатам SJT-ядра (высокая субъектность/комплаенс).'
        }
      });
      return NextResponse.json({ status: 'APPROVED', result });
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
          status: 'REJECTED', 
          aiReasoning: 'Автоматический отказ. Критически низкий уровень базового комплаенса и партнерства.'
        }
      });
      return NextResponse.json({ status: 'REJECTED', result });
    }

    // 4. СЕРАЯ ЗОНА: Вызов ИИ Оценщика (Блок B + C)
    const aiEvaluation = await runAIEvaluator(dbQuestions, answers, sjtScore);
    
    // 5. Кросс-анализ диады
    const finalDyadMetrics = await analyzeFamilyDyad(familyCode, parentRole, answers, sjtScore);

    const totalScore = sjtScore + (aiEvaluation.total_score || 0);
    // Decision logic based on total score (13.5) or if matrix anomaly flag is true
    let finalStatus = totalScore >= 13.5 ? 'APPROVED' : 'REJECTED';
    
    // If dyad analysis finds conflict, we route to INTERVIEW/REVIEW instead of auto-approve/reject
    if (finalDyadMetrics.roleConflict && finalStatus === 'APPROVED') {
      finalStatus = 'INTERVIEW';
    } else if (finalStatus === 'REJECTED' && totalScore >= 12) {
      finalStatus = 'REVIEW';
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
        status: finalStatus,
        aiAnalysis: aiEvaluation,
        aiReasoning: aiEvaluation.reasoning,
        dyadMetrics: finalDyadMetrics
      }
    });

    return NextResponse.json({ status: finalStatus, result });

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

  const systemInstruction = `
Ты — ведущий системный семейный психолог, эксперт по трансактному анализу и профайлер элитной STEAM-школы "Mezon Inspiring School" (Ташкент). Наша школа строит жесткое развивающее партнерство. Нам не нужны клиенты-потребители, ожидающие образовательных услуг "под ключ", и нам не нужны родители-спасатели, инвалидизирующие детей гиперопекой. Нам нужны союзники, способные выдерживать фрустрацию ребенка и соблюдать границы института.

Твоя задача — провести глубокий лингвистический, психологический и культурологический анализ ответов родителя из "серой зоны" (его базовый SJT балл: ${sjtScore} из 16).

КРИТЕРИИ КРАСНЫХ ФЛАГОВ (Оценка 0 за вопрос):
1. Психологическое слияние: Упорное использование местоимения "Мы" при описании учебных действий подростка ("мы пишем проекты", "мы получили тройку", "мы переходим"). Это маркер удушающей гиперопеки.
2. Непереносимость фрустрации: Родитель при малейшем плаче или протесте ребенка сдается, отменяет правила, бежит спасать, делает за него, покупает подарки, чтобы "загладить вину".
3. Токсичное потребительство: Позиция "я плачу деньги — школа обязана подстраиваться под мой комфорт/настроение/пробки". Обесценивание школьных стандартов оформления и дедлайнов.
4. Внешний локус контроля: Виновата программа, репетитор, учитель, погода, "подростковый возраст", но не семейная система и не сам ребенок.

КРИТЕРИИ ЗЕЛЕНЫХ ФЛАГОВ (Оценка 2 за вопрос):
1. Субъектность: Четкое разделение ответственности. Родитель пишет "Я принял решение", "Ребенок столкнулся с последствиями", "Ему было тяжело, но он справился сам".
2. Выдерживание границ: Способность родителя спокойно выдержать детский саботаж, слезы, крики, не ломая оговоренное правило или школьный регламент.
3. Доверие системе (Лояльность): Осознанное делегирование школе экспертной роли без попыток учить учителей, как вести уроки.

АНАЛИЗ МАТРИЦЫ ОТВЕТСТВЕННОСТИ (Код C1):
Изучи распределение процентов. Если на долю ребенка выделено менее 35% ответственности — это триггер будущей инфантилизации. Если на долю Школы выделено > 50% — это скрытое потребительство.

Ты обязан вернуть ответ СТРОГО в формате JSON. Никакого markdown-оформления, никаких трипл-бэктиков. Только чистый сериализуемый объект:
{
  "scores": {
    "B1": <0, 1, или 2>,
    "B2": <0, 1, или 2>
  },
  "matrix_anomaly": <boolean: true если проценты в C1 инфантильные или потребительские>,
  "total_score": <сумма баллов за открытые вопросы>,
  "reasoning": "<Краткий, хирургически точный психологический портрет родителя. Максимум 350 символов. Без общих фраз. Укажи конкретные маркеры: слияние, потребительство или, наоборот, высокий уровень партнерства.>"
}
`;

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
    // Use regex to strip out any potential markdown wrapping just in case
    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return {
      scores: {},
      total_score: 0,
      matrix_anomaly: false,
      reasoning: 'Ошибка ИИ-оценки. Требуется ручная модерация.'
    };
  }
}
