import Wizard from '@/components/Wizard';

export default function Home() {
  return (
    <main className="min-h-screen relative text-foreground">
      <div className="fixed top-0 left-0 w-full h-full gradient-mesh opacity-30 pointer-events-none -z-10" />
      <div className="max-w-3xl mx-auto pt-8 md:pt-16 pb-20 p-4 md:p-8 relative z-10">
        {/* Hero header */}
        <header className="mb-8 md:mb-14 animate-fade-in-up glass-card-elevated p-6 md:p-12 relative overflow-hidden group">
          {/* Subtle glow accents */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-plum/20 rounded-full blur-[100px] -z-10 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal/15 rounded-full blur-[90px] -z-10 pointer-events-none animate-pulse-slow"></div>
          
          {/* Version badge */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="badge badge-accent shadow-glow-lg animate-fade-in">V2.0</span>
            <span className="text-xs text-plum-light font-bold uppercase tracking-widest opacity-90">
              Анкета для семьи
            </span>
          </div>

          {/* Title */}
          <h1 className="sp-title text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-4 md:mb-6 drop-shadow-md">
            Знакомство <br className="hidden md:block" />
            <span className="mt-1 md:mt-2 inline-block shadow-glass">с семьёй</span>
          </h1>

          {/* Subtitle — warm, approachable language for parents */}
          <p className="text-base md:text-lg text-foreground-secondary leading-relaxed max-w-xl">
            Эта анкета поможет нам лучше понять вашу семью, ваши ценности
            и ожидания от обучения. Ответы займут 15–20 минут.
          </p>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 md:mt-8">
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
