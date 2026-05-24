'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Landing() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mdd-theme', next ? 'dark' : 'light');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 hover:scale-105 transition shadow-sm"
        aria-label="toggle theme"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Digital 100% Paperless
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-slate-900 to-indigo-700 dark:from-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
          MDD Care
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-2">
          ระบบบริหารจัดการคนไข้โรคซึมเศร้า
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mb-12">
          แผนกจิตเวช โรงพยาบาลคลองหาด จ.สระแก้ว
        </p>

        <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link
            href="/dashboard"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition shadow-sm hover:shadow-lg"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              แดชบอร์ดทีมแพทย์
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ติดตามคนไข้, Red Flag, การทานยา
            </div>
          </Link>

          <Link
            href="/chat"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition shadow-sm hover:shadow-lg"
          >
            <div className="text-3xl mb-2">💬</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              ห้องแชตคนไข้-ญาติ
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              สื่อสารเรียลไทม์ + ส่งรูป
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
