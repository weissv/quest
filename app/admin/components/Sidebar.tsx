'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Users, Network, LogOut, BrainCircuit } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { href: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
    { href: '/admin/questions', icon: FileText, label: 'Вопросы (Список)' },
    { href: '/admin/blueprint', icon: Network, label: 'Граф логики (Blueprint)' },
    { href: '/admin/results', icon: Users, label: 'Результаты' },
    { href: '/admin/prompt', icon: BrainCircuit, label: 'Настройки ИИ' },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="w-20 flex-shrink-0 z-50">
      <aside className="group w-20 hover:w-64 transition-[width] duration-300 ease-in-out border-r border-foreground-tertiary/10 flex flex-col glass-card bg-[#0a0a0a]/95 backdrop-blur-xl rounded-none border-t-0 border-l-0 border-b-0 h-full fixed top-0 left-0 overflow-hidden shadow-2xl">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-50 pointer-events-none" />

        <div className="p-6 border-b border-foreground-tertiary/10 relative z-10 flex items-center h-[85px]">
          <Database className="w-8 h-8 text-plum flex-shrink-0" />
          <h2 className="text-xl font-bold tracking-tight text-plum ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Admin Panel
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-2 relative z-10 overflow-x-hidden">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-plum/20 text-plum border border-plum/30 shadow-glow'
                    : 'hover:bg-plum/10 hover:text-plum border border-transparent'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-foreground-tertiary/10 relative z-10 bg-background-main/30 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center px-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-plum to-teal flex items-center justify-center text-white font-bold shadow-glow flex-shrink-0">
              A
            </div>
            <div className="ml-4 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <p className="text-sm font-bold truncate">Admin User</p>
              <p className="text-xs text-foreground-tertiary truncate">Куратор</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center h-10 w-full text-sm font-bold text-danger border border-danger/30 bg-danger/10 hover:bg-danger hover:text-white rounded-xl transition-colors disabled:opacity-50 overflow-hidden"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 w-0 group-hover:w-auto group-hover:ml-2 overflow-hidden">
              {loggingOut ? 'Выход...' : 'Выйти'}
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
