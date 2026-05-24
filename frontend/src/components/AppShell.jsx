'use client';

/**
 * AppShell - Shared layout with sidebar navigation + topbar
 * ใช้ใน Dashboard, Patients, Queue, Reports, Visits
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard',    label: 'แดชบอร์ด',   icon: '📊' },
  { href: '/patients',     label: 'คนไข้',       icon: '👥' },
  { href: '/queue',        label: 'คิวตรวจ',    icon: '🎫' },
  { href: '/visits/new',   label: 'บันทึกตรวจ', icon: '📝' },
  { href: '/reports',      label: 'รายงาน',     icon: '📈' },
  { href: '/chat',         label: 'แชต',         icon: '💬' }
];

export default function AppShell({ children, title = '' }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mdd-theme', next ? 'dark' : 'light');
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* ───── Mobile Backdrop ───── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
        />
      )}

      {/* ───── SIDEBAR ───── */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex-shrink-0
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-md">
              🏥
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                MDD Care
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                รพ.คลองหาด แผนกจิตเวช
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-2 text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
            หลัก
          </div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.href)
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              ผม
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                พว.มาลี สดใส
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                พยาบาลเวร
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
          </div>
        </div>
      </aside>

      {/* ───── MAIN ───── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ☰
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h1>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-slate-600 dark:text-slate-400">Live</span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
