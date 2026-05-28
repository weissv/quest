# 🎯 Quest Funnel — Система Диагностики Семьи (v2.0+)

[![TypeScript](https://img.shields.io/badge/TypeScript-88.3%25-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

**Аналитический инструмент оценки учебной рутины и дисциплинарных рамок в семьях.** 
Комплексная Full-Stack платформа с гибридной воронкой на основе ситуационных тестов (SJT), встроенной AI-верификацией поведения, динамическим деревом сценариев и полноценной CRM-подобной панелью администратора (с Kanban-досками, визуальным редактором логики и анализом семейных диад).

---

## 📋 Содержание

- [Описание](#описание)
- [Архитектура и Стек технологий](#архитектура-и-стек-технологий)
- [База Данных (Prisma)](#база-данных-prisma)
- [Механика тестирования](#механика-тестирования)
- [Панель Администратора (Admin Dashboard)](#панель-администратора-admin-dashboard)
- [API Маршруты](#api-маршруты)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Разработка и Скрипты](#разработка-и-скрипты)

---

## 📖 Описание

**Quest Funnel** — это интерактивная платформа для скрининга семей перед поступлением в образовательные программы. Она ориентирована на выявление совместимости ценностей семьи с моделью школы (формирование субъектности, автономности, ответственности).

**Ключевые особенности новой версии:**
- 🧠 **Умное ветвление (Blueprint):** Вопросы показываются динамически в зависимости от ролей и предыдущих ответов. Управление логикой происходит через визуальный node-редактор.
- 🤖 **Google Generative AI:** Автоматический анализ "серых зон" (SJT 5-8 баллов) с использованием `Gemini 1.5 Pro` для выявления потребительских маркеров.
- 👨‍👩‍👦 **Кросс-валидация семей (Dyad Analytics):** Система автоматически связывает анкеты мамы и папы (через `familyCode`), анализируя расхождения в их позициях.
- 🛡 **Admin CRM:** Полноценное управление процессом поступления — Kanban-доска статусов, просмотр анкет, конфигурация AI-промптов.

---

## 🏗 Архитектура и Стек технологий

```mermaid
graph TD
    Client[Frontend: React, Tailwind, Zustand] -->|API Requests| NextAPI[Next.js API Routes]
    NextAPI -->|CRUD & Analytics| Prisma[(Prisma ORM)]
    Prisma --> DB[(PostgreSQL)]
    NextAPI -->|Prompt Evaluation| Gemini[Google Generative AI API]
    Admin[Admin Panel: xyflow, Kanban] -->|Auth & Config| NextAPI
```

- **Frontend:** React 18.3, Next.js 14.2 (App Router), Zustand (глобальный стейт формы), TailwindCSS (Glassmorphism), Lucide React (Иконки), @xyflow/react (Dagre) для визуализации графов.
- **Backend:** Next.js Serverless API, JWT-based Auth для админки.
- **База Данных:** PostgreSQL (разворачивается локально или в облаке), Prisma ORM (v5.22.0) для управления схемой и миграциями.
- **AI интеграция:** `@google/generative-ai` для динамической оценки свободных ответов.

---

## 🗄 База Данных (Prisma)

Система построена на гибкой реляционной модели (см. `prisma/schema.prisma`):

| Модель | Описание |
|--------|----------|
| **`Question`** | Хранит конфигурацию вопросов (Текст, Блок, Тип, Опции с весами, Логика зависимостей `dependsOn`, Координаты для визуального редактора `position`). |
| **`Result`** | Хранит результаты прохождения анкеты пользователем. Включает JSON ответов, SJT Score, AI Score, массив поведенческих флагов (`behavioralFlags`) и статус. |
| **`Setting`** | Хранилище key-value (например, для сохранения динамического AI-промпта из админки). |

**Ключевые Enums:**
- `CohortType`: GRADE_1_4, GRADE_5_8.
- `ParentRole`: MAMA, PAPA, OTHER.
- `EvaluationStatus`: APPROVED, REJECTED, GREY_ZONE, PENDING, REVIEW, INTERVIEW (используется для Kanban-доски).

---

## ⚙️ Механика тестирования

Воронка разделена на логические блоки, которые динамически фильтруются на клиенте (`Wizard.tsx`) и сервере:

1. **Блок 0 (Идентификация):** Определение ролей (Кто куратор рутины? Кто держит рамку?). Это влияет на показ последующих вопросов. Ввод `Семейного кода` для синхронизации родителей.
2. **Блок A (SJT - Situational Judgment Test):** 6 закрытых сценариев с неявными весами (0, 1, 2). Автоматический расчет SJT Score.
    - **≥ 9 баллов** → Авто-пропуск, прямое зачисление (APPROVED).
    - **5–8 баллов** → Серая зона (GREY_ZONE). Открывается Блок B.
    - **< 5 баллов** → Отказ (REJECTED).
3. **Блок B (Глубинная верификация):** Открытые вопросы, которые активируются только в случае попадания в серую зону. Анализируются искусственным интеллектом для поиска "спасательских" или "потребительских" паттернов.
4. **Блок C (Кросс-валидация):** Зеркальные вопросы для проверки согласованности подходов матери и отца.
5. **Блок D (Мотивационный фильтр):** Проверка финальных ценностей школы.

---

## 🛡 Панель Администратора (Admin Dashboard)

Доступна по пути `/admin` (требует авторизации).

- **Kanban Board (`/admin`):** Удобная визуализация кандидатов по статусам (`PENDING` -> `REVIEW` -> `INTERVIEW` -> `APPROVED`/`REJECTED`). Поддержка Drag & Drop.
- **Family Analytics (`FamilyDrawer.tsx` / `FamilyCard.tsx`):** При совпадении `familyCode` админ видит консолидированную карточку семьи, сравнивая ответы мамы и папы (Dyad Metrics).
- **Вопросы (`/admin/questions`):** CRUD интерфейс для управления базой вопросов.
- **Визуальный редактор (Blueprint) (`/admin/blueprint`):** Интерактивная карта дерева вопросов на базе `@xyflow/react`. Позволяет визуально отслеживать логические связи (`dependsOn`) между блоками.
- **Промпт Инжиниринг (`/admin/prompt`):** Страница для настройки и сохранения системного промпта для Gemini API напрямую в базу данных.
- **Таблица результатов (`/admin/results`):** Детализированная таблица всех прохождений с возможностью фильтрации и ручной переоценки.

---

## 📡 API Маршруты

Все API находятся в `/app/api/...`:

- **`/api/evaluate` (POST):** Принимает ответы формы. Считает SJT Score. Если нужна AI верификация (SJT 5-8), динамически собирает контекст, подтягивает промпт из БД (`Setting`), вызывает Gemini и сохраняет результат в БД.
- **`/api/re-evaluate` (POST):** Утилита для массового пересчета старых результатов новым AI-промптом.
- **`/api/results` (GET, POST):** Получение списка результатов, фильтрация по статусам, создание новых записей.
- **`/api/results/[id]` (GET, PATCH, DELETE):** Управление конкретной анкетой. Перемещение по Kanban-доске (обновление `evalStatus`).
- **`/api/questions` (GET, POST, PUT, DELETE):** Управление графом вопросов.
- **`/api/settings` (GET, POST):** Сохранение и загрузка настроек приложения (AI Prompts).
- **`/api/auth/login` & `/logout`:** Авторизация администраторов.

---

## 🚀 Установка и запуск

### Требования
- **Node.js** ≥ 22.12.0
- **PostgreSQL** (Локально или облако, например Supabase/Neon)
- **Google Cloud API Key** (для Gemini)

### 1. Клонирование и зависимости
```bash
git clone https://github.com/weissv/quest.git
cd quest
npm install
```

### 2. Переменные окружения
Создайте файл `.env` в корне проекта:
```env
# База данных PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/quest?schema=public"

# Google Generative AI
GEMINI_API_KEY="your_google_gemini_api_key"

# Секрет для JWT авторизации админки
ADMIN_PASSWORD="your_secure_password"
JWT_SECRET="your_jwt_secret"
```

### 3. Настройка Базы Данных
Сгенерируйте клиент Prisma и примените миграции:
```bash
npx prisma generate
npx prisma db push
# Для загрузки базового набора вопросов выполните сид-скрипт (если требуется):
npx ts-node scripts/seed_v4.ts
```

### 4. Запуск приложения
```bash
# Разработка
npm run dev
# Откройте http://localhost:3000 (Клиентская часть)
# Откройте http://localhost:3000/admin (Админка)

# Production build
npm run build
npm start
```

---

## 📂 Структура проекта

```text
quest/
├── app/
│   ├── admin/                # Админ-панель (Dashboard, Blueprint, Kanban, Prompt, Results)
│   ├── api/                  # Backend API Routes (Auth, Evaluate, DB CRUD)
│   ├── layout.tsx            # Глобальный Layout (Шрифты, Метаданные)
│   ├── page.tsx              # Главная страница (Форма-Визард)
│   └── globals.css           # Tailwind и кастомные стили (Glassmorphism)
├── components/               # Клиентские компоненты формы
│   ├── Wizard.tsx            # Главный контроллер формы
│   ├── QuestionCard.tsx      # Рендер вопроса (Text / Radio)
│   ├── ProgressBar.tsx       # Индикатор блоков
│   └── ResultScreen.tsx      # Вывод результатов (SJT + AI Analysis)
├── lib/                      # Утилиты
│   ├── db.ts                 # Prisma Client Singleton
│   └── constants.ts          # Константы блоков, веса
├── prisma/                   # База данных
│   └── schema.prisma         # Схема данных PostgreSQL
├── scripts/                  # Скрипты миграций и сидирования
│   └── seed_v4.ts            # Скрипт наполнения базы вопросами
├── store/                    # State Management (Zustand)
│   └── useFormStore.ts       # Управление состоянием прохождения анкеты
└── types/                    # TypeScript типы (index.ts)
```

---

## 🎨 Дизайн и UI
Приложение использует философию **Glassmorphism**:
- Цветовая палитра `hsl` в `tailwind.config.ts`.
- Анимации `scaleIn`, `fadeIn`, `slideUp` для плавных переходов между вопросами.
- Глубокий темный фон (`hsl(230 15% 8%)`) с акцентами (`hsl(250 80% 65%)`).
- Компоненты используют UI-паттерны, снижающие когнитивную нагрузку при заполнении длинных анкет.

---

## 👨‍💻 Разработка и Скрипты

- `npm run dev` — Запуск локального сервера.
- `npm run lint` — Проверка кода (ESLint).
- `npx prisma studio` — Удобный web-интерфейс для просмотра данных в PostgreSQL.
- `npx ts-node scripts/re_eval_000.ts` — Скрипт для массового пересчета старых ответов в БД новым промптом.

### Развитие:
1. Подключение Webhooks (например, для нотификаций в Telegram/Slack при попадании в серую зону).
2. Расширение `Dyad Metrics` в админке для выявления более сложных паттернов расхождений между родителями.
3. Интеграция с внешней CRM (через `/api/results` webhooks).

---
*MIT License © 2024-2025.*
