import { Question, BlockMeta, BlockType } from '@/types';

/* ──────────────────────────────────────────────
 *  Block metadata — titles, subtitles, icons
 * ────────────────────────────────────────────── */

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  '0': {
    id: '0',
    title: 'Идентификация',
    subtitle: 'Определение вашей реальной роли в семье',
    icon: '📥',
  },
  A: {
    id: 'A',
    title: 'Ситуационные сценарии',
    subtitle: 'Оценка реакций в стрессовых учебных ситуациях (SJT)',
    icon: '🎯',
  },
  B: {
    id: 'B',
    title: 'Глубинная верификация',
    subtitle: 'Открытые вопросы для уточнения позиции',
    icon: '🔍',
  },
  C: {
    id: 'C',
    title: 'Кросс-валидация',
    subtitle: 'Согласованность взглядов внутри семьи',
    icon: '🔁',
  },
  D: {
    id: 'D',
    title: 'Мотивационный фильтр',
    subtitle: 'Финальная проверка ценностей',
    icon: '🏁',
  },
};

/* ──────────────────────────────────────────────
 *  SJT score calculation (front-end real-time)
 * ────────────────────────────────────────────── */

export const calculateCurrentSJT = (answers: Record<string, string>): number => {
  let score = 0;
  questions.forEach((q) => {
    if (q.block === 'A' && q.options) {
      const selected = q.options.find((opt) => opt.label === answers[q.id]);
      if (selected && typeof selected.weight === 'number') {
        score += selected.weight;
      }
    }
  });
  return score;
};

/* ──────────────────────────────────────────────
 *  Question bank (aligned with Source.md V2.0)
 * ────────────────────────────────────────────── */

export const questions: Question[] = [
  // ── БЛОК 0: ИДЕНТИФИКАЦИЯ + РОЛЕВАЯ ГИБКОСТЬ ──
  {
    id: '0.1',
    block: '0',
    type: 'text',
    text: 'Семейный код',
  },
  {
    id: '0.2',
    block: '0',
    type: 'radio',
    text: 'Кто в вашей семье фактически курирует учебную рутину (проверка ДЗ, сбор проектов, связь с учителем)?',
    options: [
      { label: 'Мама' },
      { label: 'Папа' },
      { label: 'Поровну' },
      { label: 'Няня/Репетитор' },
    ],
  },
  {
    id: '0.3',
    block: '0',
    type: 'radio',
    text: 'Кто в вашей семье удерживает дисциплинарную рамку (требования, границы, последствия)?',
    options: [{ label: 'Мама' }, { label: 'Папа' }, { label: 'Поровну' }],
  },
  {
    id: '0.4',
    block: '0',
    type: 'radio',
    text: 'Ваша роль в анкете',
    options: [
      { label: 'Куратор рутины' },
      { label: 'Держатель рамки' },
      { label: 'Равный участник' },
    ],
  },

  // ── БЛОК A: СИТУАЦИОННЫЕ СЦЕНАРИИ (SJT) ──
  {
    id: 'A1',
    block: 'A',
    type: 'radio',
    text: 'Ребёнок плачет из-за сложной задачи, говорит «я глупый». Вы тоже не знаете решения.',
    options: [
      { label: 'Решу сам, чтобы снять стресс', weight: 0 },
      { label: 'Позвоню учителю, что задача не по возрасту', weight: 0 },
      {
        label:
          'Остановимся, запишу все попытки, отправлю черновики учителю с вопросом',
        weight: 2,
      },
      { label: 'Скажу «это нормально не знать», завтра разберёмся', weight: 1 },
    ],
  },
  {
    id: 'A2',
    block: 'A',
    type: 'radio',
    text: 'Воскресенье, 15:00. Приехали гости. Проект требует ещё 3 часа. Ребёнок измотан, просит отложить.',
    options: [
      {
        label: 'Разрешу остаться с гостями, проект сделаю с ним ночью/утром',
        weight: 0,
      },
      { label: 'Позвоню учителю, попрошу перенести срок', weight: 0 },
      {
        label:
          'Объясню ребёнку приоритеты, гости подождут 2 часа, проект завершим',
        weight: 2,
      },
      { label: 'Пусть идёт к гостям, учитель поймёт', weight: 1 },
    ],
  },
  {
    id: 'A3',
    block: 'A',
    type: 'radio',
    text: 'Ребёнок возвращается: «Учитель наказал несправедливо!». Истерика.',
    options: [
      { label: 'Сразу напишу учителю, потребую разъяснений', weight: 0 },
      {
        label:
          'Спрошу: «Что ты делал перед замечанием? Какое правило нарушил? Что понял из ситуации?»',
        weight: 2,
      },
      { label: 'Успокою, скажу «разберёмся завтра»', weight: 1 },
      { label: 'Запрошу видеозапись/свидетелей', weight: 0 },
    ],
  },
  {
    id: 'A4',
    block: 'A',
    type: 'radio',
    text: 'Дедлайн проекта завтра. Работа сделана слабо. Ребёнок отказывается сдавать и плачет.',
    options: [
      { label: 'Переделаю с ним до «отличного» уровня', weight: 0 },
      {
        label:
          'Помогу структурировать, но сдадим как есть + подготовлю вопросы учителю',
        weight: 2,
      },
      {
        label:
          'Позвоню учителю, объясню ситуацию, попрошу не ставить низкий балл',
        weight: 0,
      },
      { label: 'Скажу ребёнку: «Сдавай. Оценка — часть обучения»', weight: 1 },
    ],
  },
  {
    id: 'A5',
    block: 'A',
    type: 'radio',
    text: 'Ребёнок системно не справляется 2 месяца. Школа рекомендует рассмотреть другой трек.',
    options: [
      { label: 'Школа должна адаптировать программу под него', weight: 0 },
      { label: 'Попробуем усилиться репетитором, но останемся', weight: 1 },
      {
        label:
          'Рассмотрю рекомендацию, если это в интересах развития субъектности ребёнка',
        weight: 2,
      },
    ],
  },
  {
    id: 'A6',
    block: 'A',
    type: 'radio',
    text: 'В каких ситуациях вы считаете допустимым требовать замену учителя?',
    options: [
      {
        label: 'При любом методическом расхождении с моими взглядами',
        weight: 0,
      },
      {
        label: 'Если ребёнок не получает «высоких оценок» после месяца занятий',
        weight: 0,
      },
      {
        label:
          'Только при подтверждённом нарушении педагогической этики или безопасности',
        weight: 2,
      },
    ],
  },

  // ── БЛОК B: ГЛУБИННАЯ ВЕРИФИКАЦИЯ (SJT 5-8) ──
  {
    id: 'B1',
    block: 'B',
    type: 'text',
    text: 'Граница vs Комфорт: Вспомните реальную ситуацию за год, когда вам пришлось требовать от ребёнка выполнения обязанности вопреки его слезам/протесту. Напишите точную фразу, которую вы сказали. Что бы вы сделали, если бы сопротивление продолжалось 30 минут?',
    dependsOn: {
      questionId: '0.4',
      value: ['Держатель рамки', 'Равный участник'],
    },
  },
  {
    id: 'B2',
    block: 'B',
    type: 'text',
    text: 'После разговора с ребёнком (по сценарию из блока А) вы поняли, что он, скорее всего, говорит правду. Ваши следующие шаги?',
    dependsOn: {
      questionId: '0.4',
      value: ['Куратор рутины', 'Равный участник'],
    },
  },
  {
    id: 'B3',
    block: 'B',
    type: 'text',
    text: 'Опишите самый длительный период (от 3 месяцев), когда вы находились в состоянии высокой нагрузки. Как вы себя вели? Что помогло не «сдаться»?',
    dependsOn: {
      questionId: '0.4',
      value: ['Куратор рутины', 'Равный участник'],
    },
  },
  {
    id: 'B4',
    block: 'B',
    type: 'text',
    text: '«Тот факт, что мы оплачиваем обучение, даёт нам право требовать от школы…» → «…даёт школе право требовать от нас…»',
    dependsOn: {
      questionId: '0.4',
      value: ['Держатель рамки', 'Равный участник'],
    },
  },

  // ── БЛОК C: СКРЫТАЯ ЗЕРКАЛЬНОСТЬ + КРОСС-ВАЛИДАЦИЯ ──
  {
    id: 'C1',
    block: 'C',
    type: 'text',
    text: 'Какую роль в учебной поддержке ребёнка играет второй родитель? (конкретно)',
    mirrorText:
      'Какую роль в учебной поддержке ребёнка играет второй родитель? (конкретно)',
  },
  {
    id: 'C2',
    block: 'C',
    type: 'text',
    text: 'Кто в вашей семье принимает финальное решение по вопросам нагрузки/переводов?',
  },
  {
    id: 'C3',
    block: 'C',
    type: 'text',
    text: 'Если педагогические взгляды родителей расходятся, как вы приходите к единой позиции? Приведите пример.',
  },

  // ── БЛОК D: ФИНАЛЬНЫЙ МОТИВАЦИОННЫЙ ФИЛЬТР ──
  {
    id: 'D1',
    block: 'D',
    type: 'text',
    text: 'Почему, несмотря на всё вышесказанное (нагрузка, дисциплина, требования, отсутствие «сервиса»), вы всё равно хотите именно в эту школу? (3-4 предложения)',
  },
];

/* ──────────────────────────────────────────────
 *  Dynamic question filtering
 *
 *  Rules:
 *  1. Block B is SKIPPED when SJT ≥9 (excellent)
 *     or SJT <5 (incompatible)
 *  2. dependsOn filters by selected role
 * ────────────────────────────────────────────── */

export const getFilteredQuestions = (
  answers: Record<string, string>
): Question[] => {
  // Check if Block A is fully completed
  const blockAQuestions = questions.filter((q) => q.block === 'A');
  const isBlockAComplete = blockAQuestions.every((q) => answers[q.id]);

  let skipBlockB = false;
  if (isBlockAComplete) {
    const sjtScore = calculateCurrentSJT(answers);
    // ≥9 → excellent, skip deep verification
    // <5 → incompatible, skip to final blocks
    if (sjtScore >= 9 || sjtScore < 5) {
      skipBlockB = true;
    }
  }

  return questions.filter((q) => {
    // Rule 1: Skip Block B for extreme SJT values
    if (q.block === 'B' && skipBlockB) return false;

    // Rule 2: Role-based dependency check
    if (q.dependsOn) {
      const parentValue = answers[q.dependsOn.questionId];
      if (Array.isArray(q.dependsOn.value)) {
        return q.dependsOn.value.includes(parentValue);
      }
      return parentValue === q.dependsOn.value;
    }

    return true;
  });
};
