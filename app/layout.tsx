import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Диагностика Семьи — Фильтр Субъектности V2.0',
  description:
    'Аналитический инструмент оценки учебной рутины и дисциплинарных рамок. Гибридная воронка SJT с AI-верификацией.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="gradient-mesh bg-noise min-h-screen">{children}</body>
    </html>
  );
}
