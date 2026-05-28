import React from 'react';
import Sidebar from './components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-surface text-foreground">
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-30 pointer-events-none" />
        <div className="p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
