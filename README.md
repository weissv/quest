# 🎯 Quest Funnel v2.0 — Диагностика Семьи

[![TypeScript](https://img.shields.io/badge/TypeScript-88.3%25-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?logo=nextdotjs)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Аналитический инструмент оценки учебной рутины и дисциплинарных рамок в семьях.** Гибридная воронка на основе ситуационных тестов (SJT) с AI-верификацией для определения совместимости семьи с образовательной моделью, ориентированной на формирование субъектности.

> **Версия 2.0** — Полностью переработанная архитектура с динамическим ветвлением и встроенной оценкой на основе Google Generative AI.

---

## 📋 Содержание

- [Описание](#описание)
- [Архитектура](#архитектура)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Механика тестирования](#механика-тестирования)
- [API](#api)
- [Компоненты](#компоненты)
- [Типизация](#типизация)
- [Стиль и дизайн](#стиль-и-дизайн)
- [Переменные окружения](#переменные-окружения)
- [Часто задаваемые вопросы](#часто-задаваемые-вопросы)
- [Разработка](#разработка)

---

## Описание

### Что это?

**Quest Funnel** — это интерактивный веб-инструмент для скрининга семей перед поступлением в образовательные программы с моделью, ориентированной на **формирование субъектности** (автономности, ответственности, саморегуляции ребёнка).

### Проблема

Традиционные анкеты либо:
- **Слишком открыты** → родители угадывают правильные ответы, когнитивная усталость
- **Слишком закрыты** → не позволяют выявить реальную позицию семьи

### Решение

**Гибридный подход V2.0**:

| Блок | Тип | Цель | Формат |
|------|-----|------|--------|
| **0** | Идентификация | Определить реальные роли в семье | Радио + текст |
| **A** | SJT (6 сценариев) | Авто-фильтр на основе ситуационного теста | Закрытые варианты с весами (0/1/2) |
| **B** | Глубинная верификация | Только для «серой зоны» (SJT: 5-8) | Открытые вопросы с ручной/AI оценкой |
| **C** | Кросс-валидация | Сравнить позиции обоих родителей | Зеркальные открытые вопросы |
| **D** | Мотивационный фильтр | Проверить ценности | Открытый вопрос |

**Ключевая фишка**: Динамическое ветвление + AI-анализ паттернов поведения, а не ключевых слов.

---

## Архитектура

### Стек технологий

```
┌─────────────────────────────────────────┐
│         Frontend (TypeScript)           │
├─────────────────────────────────────────┤
│ React 18.3 + Next.js 14.2               │
│ Zustand (State Management)              │
│ Tailwind CSS 3.4 + Custom Design System │
│ Glassmorphic UI с анимациями            │
├─────────────────────────────────────────┤
│         Backend (Next.js API)           │
├─────────────────────────────────────────┤
│ POST /api/evaluate                      │
│ • SJT score calculation                 │
│ • AI analysis (Google Generative AI)    │
│ • Result generation                     │
├─────────────────────────────────────────┤
│         External Services               │
├─────────────────────────────────────────┤
│ Google Generative AI (Gemini 1.5 Pro)   │
│ • Behavioral pattern analysis           │
│ • 3-tier scoring (0/1/2)                │
└─────────────────────────────────────────┘
```

### Поток данных

```
1. User fills Wizard (Block 0-D) 
   ↓
2. Frontend calculates SJT score (Block A)
   ↓
3. Conditional routing based on SJT
   • ≥9 → Direct enrollment
   • 5-8 → Show Block B + call AI
   • <5 → Incompatible
   ↓
4. POST /api/evaluate
   • Server validates answers
   • Generates AI prompt
   • Calls Gemini API
   • Parses JSON response
   ↓
5. ResultScreen displays:
   • Status badge
   • SJT score visualization
   • AI analysis (if available)
   • Risk flags & recommendation
```

---

## Установка и запуск

### Требования

- **Node.js** ≥ 18.x
- **npm** или **yarn**
- **Google Cloud API Key** (для AI-верификации)

### Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/weissv/quest.git
cd quest

# 2. Установите зависимости
npm install

# 3. Создайте .env.local
touch .env.local
```

### Переменные окружения

```bash
# .env.local
GEMINI_API_KEY=your_google_api_key_here
```

**Получить ключ:**
1. Перейдите на [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Создайте новый API ключ
3. Скопируйте его в `.env.local`

### Запуск

```bash
# Development
npm run dev
# Откройте http://localhost:3000

# Production build
npm run build
npm start

# Linting
npm run lint
```

---

## Структура проекта

```
quest/
├── app/
│   ├── api/
│   │   └── evaluate/
│   │       └── route.ts          # POST API endpoint для оценки ответов
│   ├── page.tsx                  # Главная страница (hero + wizard)
│   ├── layout.tsx                # Root layout с metadata
│   └── globals.css               # Глобальные стили + компоненты Tailwind
│
├── components/
│   ├── Wizard.tsx                # Главный компонент-контейнер с логикой навигации
│   ├── QuestionCard.tsx          # Контейнер для вопроса (текст + ввод)
│   ├── RadioOption.tsx           # Кастомный radio button с анимацией
│   ├── TextInput.tsx             # Textarea с счётчиком символов
│   ├── ProgressBar.tsx           # Визуализация прогресса по блокам
│   ├── BlockHeader.tsx           # Заголовок блока с иконой
│   └── ResultScreen.tsx          # Финальный экран с результатами
│
├── data/
│   └── questions.ts              # Вся база вопросов + логика фильтрации
│
├── store/
│   └── useFormStore.ts           # Zustand store (состояние формы + действия)
│
├── types/
│   └── index.ts                  # Полная типизация TypeScript
│
├── package.json                  # Зависимости
├── tailwind.config.ts            # Tailwind конфигурация + кастомные цвета
├── tsconfig.json                 # TypeScript конфигурация
├── next.config.js                # Next.js конфигурация
├── postcss.config.js             # PostCSS для Tailwind
└── README.md                     # Этот файл
```

---

## Механика тестирования

### Блок 0: Идентификация (4 вопроса)

**Цель:** Определить реальные роли в семье, не полагаясь на декларативные «оба родителя».

| ID | Вопрос | Тип | Условие |
|----|--------|-----|----------|
| `0.1` | Семейный код | Текст | Кросс-связь мамы/папы (опциональное совпадение) |
| `0.2` | Кто курирует учебную рутину? | Радио | Базовый выбор |
| `0.3` | Кто удерживает дисциплинарную рамку? | Радио | Базовый выбор |
| `0.4` | **Ваша роль в анкете** | Радио | **Запускает ветвление для B1-B4** |

**Ветвление:**
- `0.4` = «Куратор рутины» → показать B1, B3
- `0.4` = «Держатель рамки» → показать B2, B4
- `0.4` = «Равный участник» → показать B1, B2, B3, B4

### Блок A: Ситуационные сценарии (6 вопросов = SJT)

**Логика:** Каждый вариант ответа имеет скрытый вес (0, 1 или 2). Сумма автоматически считается на фронтенде.

| ID | Сценарий | Вес 0 | Вес 1 | Вес 2 |
|----|----------|-------|-------|-------|
| `A1` | Ребёнок не знает решение | Решу сам | Скажу «норм не знать» | Фиксирую попытки, уточню учителю |
| `A2` | Гости + проект | Разрешу гостям | Пусть идёт к гостям | Объясню приоритет, завершим |
| `A3` | Несправедливое наказание | Сразу напишу учителю | Успокою, завтра | Расспрошу факты + вопросы |
| `A4` | Слабый проект, дедлайн завтра | Переделаю до отличного | Скажу сдавать | Помогу структурировать + вопросы |
| `A5` | Системное отставание 2 месяца | Школа адаптирует | Репетитор | Рассмотрю рекомендацию |
| `A6` | Когда требовать замену учителя | Любое расхождение | Низкие оценки | Подтвержденное нарушение |

**Обработка:**
- **SJT ≥ 9** → ✅ Прямое зачисление (пропустить Блок B)
- **SJT 5-8** → 🟡 Показать Блок B + AI анализ
- **SJT < 5** → ❌ Не совместимо (пропустить B, показать C/D, но финальный вердикт)

### Блок B: Глубинная верификация (4 вопроса, зависимые)

**Показывается только если SJT ∈ [5-8].**

| ID | Условие | Вопрос | Фокус |
|----|---------|--------|-------|
| `B1` | `0.4` ∈ {«Держатель рамки», «Равный»} | Граница vs Комфорт | Ищем конкретные действия, готовность к фрустрации |
| `B2` | `0.4` ∈ {«Куратор рутины», «Равный»} | После разговора с ребёнком | Способность к аналитике вместо спасания |
| `B3` | `0.4` ∈ {«Куратор рутины», «Равный»} | Период высокой нагрузки | Маркеры выгорания, локус контроля |
| `B4` | `0.4` ∈ {«Держатель рамки», «Равный»} | Деньги → право требовать | Ищем потребительство vs партнёрство |

**AI-оценка (0-2):**
```
0 = Потребительская/спасательская позиция (локус контроля внешний)
1 = Нейтральная позиция (понимание теории, но нет действий)
2 = Партнёрская/субъектная (конкретные шаги, удержание рамки, принятие цены)
```

### Блок C: Кросс-валидация (3 вопроса, зеркальные)

**Если оба родителя заполняют анкету параллельно, система сравнивает ответы.**

| ID | Мама видит | Папа видит |
|----|-----------|-----------|
| `C1` | Роль отца в учебной поддержке | Роль матери в учебной поддержке |
| `C2` | Кто принимает решение по нагрузке/переводам | (То же) |
| `C3` | Как приходите к единой позиции при расхождениях | (То же) |

**Флаг:** Если ответы расходятся >40% по смыслу → флаг «внутрисемейный конфликт».

### Блок D: Мотивационный фильтр (1 вопрос)

**Финальная проверка ценностей.**

| ID | Вопрос |
|----|--------|
| `D1` | Почему, несмотря на нагрузку, дисциплину, требования, отсутствие сервиса, вы всё ещё хотите учиться здесь? |

**Анализ:** Ищем не «рейтинги/вузы», а ценности: «хочу, чтобы ребёнок научился держать слово», «верю в силу самостоятельности».

---

## API

### POST `/api/evaluate`

**Назначение:** Обработать ответы, рассчитать SJT и вызвать AI для дополнительной верификации.

**Запрос:**
```json
{
  "answers": {
    "0.1": "Семейный код",
    "0.2": "Мама",
    "0.3": "Поровну",
    "0.4": "Куратор рутины",
    "A1": "Остановимся, запишу...",
    "A2": "Объясню ребёнку приоритеты...",
    ...
    "B1": "Вспоминаю ситуацию...",
    "D1": "Верю в субъектность..."
  }
}
```

**Ответ (200 OK):**
```json
{
  "status": "✅ Прямое зачисление",
  "sjtScore": 11,
  "aiAnalysis": null
}
```

Или (если SJT 5-8):
```json
{
  "status": "🟡 Блок B + собеседование (Требуется верификация AI)",
  "sjtScore": 7,
  "aiAnalysis": {
    "scores": {
      "B1": 2,
      "B2": 1,
      "B3": 2,
      "B4": 0
    },
    "riskFlags": false,
    "recommendation": "Условное зачисление + адаптационный трек",
    "comment": "Позиция в целом партнёрская, но есть потребительские элементы..."
  }
}
```

**Обработка ошибок:**
```json
{
  "error": "Invalid request body: missing answers"  // 400
}
```

```json
{
  "error": "Внутренняя ошибка сервера"  // 500
}
```

---

## Компоненты

### `<Wizard />`

**Основной контейнер логики.**

```typescript
// Управляет:
- Фильтрацией вопросов на основе ответов
- Счётом SJT в реальном времени
- Навигацией (prev/next)
- Отправкой данных на сервер
- Отображением результатов

// Props: нет (всё из Zustand store)
```

**Ключевая логика:**
```typescript
const filteredQuestions = getFilteredQuestions(answers);
// Исключает Блок B, если SJT ≥9 или <5
// Исключает B1-B4, если dependsOn не совпадает с 0.4
```

### `<QuestionCard />`

**Контейнер отдельного вопроса.**

```typescript
interface QuestionCardProps {
  question: Question;        // Объект вопроса с ID, текстом, опциями
  currentAnswer: string;      // Текущий ответ из store
  onAnswer: (id, answer) => void;  // Callback для обновления
}

// Рендерит либо:
// - <TextInput /> для type='text'
// - Список <RadioOption /> для type='radio'
```

### `<TextInput />`

**Textarea с подсчётом символов.**

```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;       // Default: "Ваш ответ..."
  maxLength?: number;         // Default: 2000, B1-B4: 2000, 0.1: 50
}

// Функции:
// - Показывает счётчик символов
// - Жёлтый цвет при >85% лимита
// - Запрещает ввод >maxLength
```

### `<RadioOption />`

**Кастомный radio button с анимацией.**

```typescript
interface RadioOptionProps {
  option: Option;         // { label, weight? }
  name: string;           // Group name (question ID)
  isSelected: boolean;
  index: number;          // Для staggered animation
  onSelect: (value) => void;
}

// Стили:
// - Кольцо с точкой внутри (вместо браузерного radio)
// - Цвет: accent при выборе, tertiary при наведении
// - Анимация: scaleIn (0.3s) с задержкой по индексу
```

### `<ProgressBar />`

**Визуализация прогресса по блокам.**

```typescript
interface ProgressBarProps {
  currentBlock: BlockType;    // '0' | 'A' | 'B' | 'C' | 'D'
  progress: number;           // 0-100
  currentStep: number;
  totalSteps: number;
}

// Компоненты:
// 1. Блок-индикаторы (иконка + badge)
//    - Активный: accent с shadow-glow
//    - Завершённый: success с га��очкой
//    - Неактивный: grey
// 2. Полоса прогресса с градиентом + shimmer effect
// 3. Счётчик "X / Y"
```

### `<BlockHeader />`

**Заголовок блока с иконой и описанием.**

```typescript
interface BlockHeaderProps {
  block: BlockType;
  showTransition?: boolean;  // Добавляет fade-in анимацию
}

// Рендерит:
// - Иконка (из BLOCK_META)
// - Название блока
// - Подзаголовок (описание)
```

### `<ResultScreen />`

**Финальный экран с результатами.**

```typescript
interface ResultScreenProps {
  result: EvaluationResult;
  sjtScore: number;
  onReset: () => void;
}

// Отображает:
// 1. Статус-бейдж (✅ / 🟡 / ❌)
// 2. SJT счёт с visualization bar
// 3. AI-анализ (если доступен)
//    - Per-question scores (B1-B4)
//    - Risk flags
//    - Рекомендация
// 4. Кнопка "Пройти заново"
```

---

## Типизация

### `types/index.ts`

```typescript
// Question types
type QuestionType = 'text' | 'radio';
type BlockType = '0' | 'A' | 'B' | 'C' | 'D';

interface Option {
  label: string;
  weight?: number;  // 0 | 1 | 2 для SJT
}

interface Question {
  id: string;           // '0.1', 'A1', 'B1', etc.
  block: BlockType;
  type: QuestionType;
  text: string;
  options?: Option[];   // Для radio
  dependsOn?: {         // Для условного показа
    questionId: string;
    value: string | string[];
  };
  mirrorText?: string;  // Альтернативный текст для Блока C
}

// API types
interface AIVerdict {
  scores?: Record<string, number>;      // { B1: 2, B2: 1, ... }
  riskFlags?: boolean;
  recommendation?: string;
  comment?: string;
  rawText?: string;
  error?: string;
}

interface EvaluationResult {
  status: string;                       // '✅ Прямое зачисление' и т.д.
  sjtScore: number;
  aiAnalysis: AIVerdict | null;
}

// Store types
type ParentRole = 'Куратор рутины' | 'Держатель рамки' | 'Равный участник' | null;

interface FormState {
  answers: Record<string, string>;
  currentStepIndex: number;
  sjtScore: number;
  parentRole: ParentRole;
  isSubmitting: boolean;
  submissionResult: EvaluationResult | null;
  error: string | null;
  
  // Actions
  setAnswer: (questionId: string, answer: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  submitAnswers: () => Promise<void>;
}
```

---

## Стиль и дизайн

### Палитра цветов (Tailwind)

```typescript
// tailwind.config.ts
colors: {
  surface: {
    DEFAULT: 'hsl(230 15% 8%)',      // #0d0d1a (фон)
    raised: 'hsl(230 15% 12%)',      // Карточки
    overlay: 'hsl(230 15% 16%)',     // Модалки
  },
  accent: {
    DEFAULT: 'hsl(250 80% 65%)',     // #9d5eff (основной цвет)
    hover: 'hsl(250 80% 72%)',
    muted: 'hsl(250 40% 25%)',
  },
  success: 'hsl(145 65% 50%)',        // Зелёный
  warning: 'hsl(40 95% 55%)',         // Оранжевый
  danger: 'hsl(0 75% 55%)',           // Красный
  foreground: {
    DEFAULT: 'hsl(0 0% 95%)',         // Белый текст
    secondary: 'hsl(230 10% 65%)',    // Серый текст
    tertiary: 'hsl(230 10% 45%)',     // Очень серый
  },
}
```

### Компоненты Tailwind (в `globals.css`)

```css
/* Glassmorphic cards */
.glass-card { }              /* Базовая стеклянная карточка */
.glass-card-elevated { }     /* Карточка с усиленны�� blur */

/* Buttons */
.btn-ghost { }               /* Прозрачная кнопка */

/* Badges */
.badge { }
.badge-accent { }
.badge-success { }
.badge-warning { }
.badge-danger { }

/* Form elements */
.radio-option { }            /* Кастомный radio с анимацией */
.text-input { }              /* Textarea с улучшенным стилем */

/* Animations */
.animate-fade-in { }         /* 0.4s ease-out opacity */
.animate-slide-up { }        /* 0.5s ease-out transform */
.animate-slide-in-right { }  /* 0.4s ease-out translateX */
.animate-scale-in { }        /* 0.3s ease-out scale */
.animate-pulse-slow { }      /* 3s infinite */
.animate-shimmer { }         /* 2s linear shimmer */
```

### Shadows & Effects

```typescript
boxShadow: {
  'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
  'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4)',
  'glow': '0 0 20px rgba(99, 102, 241, 0.15)',        // Фиолетовый glow
  'glow-lg': '0 0 40px rgba(99, 102, 241, 0.2)',
}
```

---

## Переменные окружения

### `.env.local` (обязательно для AI-верификации)

```bash
# Google Generative AI
GEMINI_API_KEY=your_api_key_here

# Optional: для логирования
DEBUG=true
```

### ��ак получить `GEMINI_API_KEY`

1. Перейдите на [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Нажмите "Create API Key"
3. Выберите проект (или создайте новый)
4. Скопируйте ключ
5. Вставьте в `.env.local`

**Важно:** Не коммитьте `.env.local` в git! Добавьте в `.gitignore`.

---

## Часто задаваемые вопросы

### Q: Можно ли использовать анкету без AI?

**A:** Да. Если `GEMINI_API_KEY` не задан, система:
- Покажет ошибку: "GEMINI_API_KEY не задан на сервере"
- Вернёт результат с `aiAnalysis.error`
- SJT-фильтр всё ещё будет работать

### Q: Как изменить вопросы?

**A:** Редактируйте `data/questions.ts`:
```typescript
// Добавить новый вопрос
{
  id: 'A7',
  block: 'A',
  type: 'radio',
  text: 'Ваш новый сценарий...',
  options: [
    { label: 'Опция 1', weight: 0 },
    { label: 'Опция 2', weight: 1 },
    { label: 'Опция 3', weight: 2 },
  ],
}

// Изменить SJT максимум в ResultScreen
const maxScore = 14;  // Было 12 (6 × 2)
```

### Q: Как работает динамическое ветвление?

**A:** В `getFilteredQuestions()`:
1. Проверяем SJT после Блока A
2. Если SJT ≥9 или <5 → исключаем Блок B
3. Проверяем `dependsOn` для каждого вопроса
4. Если `0.4 !== selected role` → исключаем вопрос

```typescript
// Пример: B1 показывается только для "Держателя рамки" и "Равного участника"
dependsOn: {
  questionId: '0.4',
  value: ['Держатель рамки', 'Равный участник'],
}
```

### Q: Как кастомизировать AI-подсказку?

**A:** Редактируйте `app/api/evaluate/route.ts`:
```typescript
const aiPrompt = `
Ты — школьный психолог...
[ВАШИ ИНСТРУКЦИИ]
...
Выведи в формате JSON...
`;
```

### Q: Можно ли экспортировать результаты?

**A:** Текущая версия показывает результаты в браузере. Для экспорта:
1. Добавьте кнопку "Скачать PDF"
2. Используйте `jspdf` или `html2canvas`
3. Или интегрируйте с Google Sheets API

### Q: Как защитить данные?

**A:** Текущая версия хранит данные только в памяти (очищаются при закрытии). Для сохранения:
1. Добавьте базу данных (PostgreSQL, MongoDB)
2. Шифруйте ответы
3. Реализуйте ролевой доступ (admin dashboard)

---

## Разработка

### Структура команды (рекомендуется)

- **Frontend**: React/TypeScript разработчик
- **Backend**: Next.js API разработчик
- **UX/Design**: Дизайнер для кастомизации Tailwind
- **Психолог**: Для редактирования вопросов и AI-подсказок

### Расширение функционала

**1. Добавить родительский доступ:**
```typescript
// Создать страницу /dashboard
// Показывать результаты всех анкет
// Фильтровать по блокам/результатам
```

**2. Интегрировать CRM:**
```typescript
// После Submit → отправить данные в Salesforce/Airtable
// Синхронизировать с базой школы
```

**3. Многоязычная поддержка:**
```typescript
// i18n с next-intl
// Переводы в data/questions.ts
```

**4. Собеседование:**
```typescript
// Добавить видео-блок
// Интеграция с Zoom/Google Meet
```

### Тестирование

```bash
# Unit tests (рекомендуется добавить)
npm install --save-dev jest @testing-library/react

# E2E tests
npm install --save-dev playwright

# Linting
npm run lint

# Type check
npx tsc --noEmit
```

### Build & Deployment

```bash
# Production build
npm run build

# Локальный preview
npm start

# Deploy на Vercel
vercel deploy

# Deploy на другой хостинг
# 1. npm run build
# 2. Загрузите .next/ и public/ на сервер
# 3. Запустите `npm start`
```

---

## Лицензия

MIT © 2025 [weissv](https://github.com/weissv)

---

## Контакты

- **GitHub**: [weissv/quest](https://github.com/weissv/quest)
- **Issues**: [Report a bug](https://github.com/weissv/quest/issues)
- **Discussions**: [Ask a question](https://github.com/weissv/quest/discussions)

---

## Благодарности

- **React** & **Next.js** — за отличный фреймворк
- **Tailwind CSS** — за гибкую систему стилей
- **Zustand** — за лёгкое state management
- **Google Generative AI** — за AI-верификацию
- **Школьным методистам** — за психологическую валидацию модели

---

**Версия**: 2.0.0  
**Последнее обновление**: 2025-05-26  
**Статус**: Active Development 🚀
