'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Users, Network, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const links = [
    { href: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
    { href: '/admin/questions', icon: FileText, label: 'Вопросы (Список)' },
    { href: '/admin/blueprint', icon: Network, label: 'Граф логики (Blueprint)' },
    { href: '/admin/results', icon: Users, label: 'Результаты' },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-foreground-tertiary/10 flex flex-col glass-card rounded-none border-t-0 border-l-0 border-b-0 h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-50 pointer-events-none" />

      <div className="p-6 border-b border-foreground-tertiary/10 relative z-10">
        <h2 className="text-xl font-bold tracking-tight text-plum flex items-center gap-2">
          <Database className="w-6 h-6" />
          Admin Panel
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-plum/20 text-plum border border-plum/30 shadow-glow'
                  : 'hover:bg-plum/10 hover:text-plum border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-foreground-tertiary/10 relative z-10 bg-background-main/30 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-plum to-teal flex items-center justify-center text-white font-bold shadow-glow">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Admin User</p>
            <p className="text-xs text-foreground-tertiary truncate">Куратор</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-bold text-danger border border-danger/30 bg-danger/10 hover:bg-danger hover:text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Выход...' : 'Выйти'}
        </button>
      </div>
    </aside>
  );
}
