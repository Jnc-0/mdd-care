'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const FEATURES = [
  { href: '/dashboard',  icon: '📊', title: 'แดชบอร์ดทีมแพทย์', desc: 'ติดตามคนไข้, Red Flag, การทานยา, SMS Real-time' },
  { href: '/patients',   icon: '👥', title: 'จัดการคนไข้',      desc: 'ค้นหา, เพิ่ม, ดูประวัติ + กราฟ PHQ-9 ทีละราย' },
  { href: '/queue',      icon: '🎫', title: 'คิวการตรวจ',       desc: 'รอตรวจ / กำลังตรวจ / เสร็จ - Red Flag ขึ้นก่อน' },
  { href: '/visits/new', icon: '📝', title: 'บันทึกการตรวจ',    desc: 'SOAP + PHQ-9 + ใบสั่งยาในฟอร์มเดียว' },
  { href: '/reports',    icon: '📈', title: 'รายงานและสถิติ',  desc: 'กราฟแนวโน้ม PHQ-9, อัตราทานยา, Red Flag' },
  { href: '/chat',       icon: '💬', title: 'แชตคนไข้-ญาติ',   desc: 'สื่อสารเรียลไทม์ + ส่งรูปอาการ/ซองยา' }
];

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
    <main className="min-h-screen px-6 py-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Digital 100% Paperless
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-3 bg-gradient-to-br from-slate-900 to-indigo-700 dark:from-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
            MDD Care
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            ระบบบริหารจัดการคนไข้โรคซึมเศร้า — OPD จิตเวช
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            แผนกจิตเวช โรงพยาบาลคลองหาด จ.สระแก้ว
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Link
              key={f.href}
              href={f.href}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition shadow-sm hover:shadow-lg"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {f.title}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {f.desc}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-slate-500 dark:text-slate-500">
          MDD Care © 2026 · รพ.คลองหาด แผนกจิตเวช
        </div>
      </div>
    </main>
  );
}
