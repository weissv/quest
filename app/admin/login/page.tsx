'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-surface text-foreground overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-50 pointer-events-none -z-10" />
      
      <div className="w-full max-w-md p-8 glass-card-elevated relative z-10 animate-slide-up">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-plum/20 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal/20 rounded-full blur-[60px] -z-10 pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-raised border border-foreground-tertiary/20 shadow-inner mb-4">
            <Lock className="w-8 h-8 text-plum" />
          </div>
          <h1 className="text-3xl font-black tracking-tight sp-title">
            <span>Вход для куратора</span>
          </h1>
          <p className="text-foreground-secondary mt-3">Введите пароль для доступа к системе</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input py-4 text-center tracking-[0.2em] text-lg"
              autoFocus
            />
            {error && <p className="text-danger text-sm mt-2 text-center animate-fade-in">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full mx-0"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
