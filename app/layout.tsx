import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Знакомство с семьёй — Анкета V2.0',
  description:
    'Анкета для знакомства с семьёй. Помогает школе понять ваши ценности, ожидания и подход к обучению.',
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
