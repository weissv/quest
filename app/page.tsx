import Wizard from '@/components/Wizard';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto pt-8 md:pt-16 pb-20">
        {/* Hero header */}
        <header className="mb-10 md:mb-14 animate-fade-in">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="badge badge-accent">V2.0</span>
            <span className="text-xs text-foreground-tertiary font-medium uppercase tracking-wider">
              Фильтр субъектности
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-5">
            Диагностика{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, hsl(250 80% 65%), hsl(280 70% 60%), hsl(310 65% 55%))',
              }}
            >
              Семьи
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-foreground-secondary leading-relaxed max-w-xl">
            Аналитический инструмент оценки учебной рутины и дисциплинарных
            рамок. Гибридная воронка SJT с AI-верификацией.
          </p>

          {/* Accent line */}
          <div
            className="mt-6 h-1 w-20 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, hsl(250 80% 65%), hsl(280 70% 55%))',
            }}
          />
        </header>

        {/* Wizard */}
        <Wizard />

        {/* Footer note */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-foreground-tertiary">
            Конфиденциальность гарантирована. Данные обрабатываются в
            соответствии с политикой школы.
          </p>
        </footer>
      </div>
    </main>
  );
}
