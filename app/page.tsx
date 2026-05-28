import Wizard from '@/components/Wizard';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 gradient-mesh">
      <div className="max-w-3xl mx-auto pt-8 md:pt-16 pb-20">
        {/* Hero header */}
        <header className="mb-10 md:mb-14 animate-fade-in glass-card p-8 md:p-10 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-plum/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
          
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="badge badge-accent shadow-glow">V2.0</span>
            <span className="text-xs text-plum-light font-bold uppercase tracking-widest">
              Анкета для семьи
            </span>
          </div>

          {/* Title */}
          <h1 className="sp-title text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.2] mb-5">
            Знакомство <br className="hidden md:block" />
            <span>с семьёй</span>
          </h1>

          {/* Subtitle — warm, approachable language for parents */}
          <p className="text-base md:text-lg text-foreground-secondary leading-relaxed max-w-xl">
            Эта анкета поможет нам лучше понять вашу семью, ваши ценности
            и ожидания от обучения. Ответы займут 15–20 минут.
          </p>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
            <div className="service-box-ref">
              <span className="text-2xl">🔒</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Конфиденциально</span>
                <span className="text-xs text-foreground-tertiary">Только для куратора</span>
              </div>
            </div>
            <div className="service-box-ref">
              <span className="text-2xl">⏱️</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">15–20 минут</span>
                <span className="text-xs text-foreground-tertiary">На все вопросы</span>
              </div>
            </div>
            <div className="service-box-ref">
              <span className="text-2xl">👨‍👩‍👧</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Для всех</span>
                <span className="text-xs text-foreground-tertiary">Каждому родителю</span>
              </div>
            </div>
          </div>

          {/* Accent line */}
          <div className="mt-8 h-2 w-24 bg-plum" />
        </header>

        {/* Wizard */}
        <Wizard />

        {/* Footer note */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-foreground-tertiary leading-relaxed max-w-md mx-auto">
            Ваши ответы обрабатываются конфиденциально и используются
            исключительно для знакомства с вашей семьёй. Нет «правильных»
            или «неправильных» ответов — нам важна ваша искренность.
          </p>
        </footer>
      </div>
    </main>
  );
}
