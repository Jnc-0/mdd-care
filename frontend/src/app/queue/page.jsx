'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const STATUS_COLOR = {
  waiting:       'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'in-progress': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  completed:    'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  scheduled:    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  missed:       'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
};

const STATUS_LABEL = {
  waiting: 'รอตรวจ', 'in-progress': 'กำลังตรวจ',
  completed: 'เสร็จแล้ว', scheduled: 'จองคิว', missed: 'ขาดนัด'
};

export default function QueuePage() {
  const [queue, setQueue] = useState([]);

  const fetchQueue = () => {
    fetch(`${API_URL}/api/queue`).then(r => r.json()).then(setQueue);
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 15000);
    return () => clearInterval(t);
  }, []);

  const advance = async (apt, newStatus) => {
    await fetch(`${API_URL}/api/queue/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: apt._id, newStatus })
    });
    fetchQueue();
  };

  const groups = {
    waiting:       queue.filter(q => q.status === 'waiting'),
    inProgress:    queue.filter(q => q.status === 'in-progress'),
    completed:     queue.filter(q => q.status === 'completed'),
    scheduled:     queue.filter(q => q.status === 'scheduled')
  };

  return (
    <AppShell title="คิวการตรวจวันนี้">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatBox icon="⏰" label="รอตรวจ"     value={groups.waiting.length}    color="blue" />
        <StatBox icon="🩺" label="กำลังตรวจ"  value={groups.inProgress.length} color="amber" />
        <StatBox icon="✅" label="เสร็จแล้ว"  value={groups.completed.length}  color="indigo" />
        <StatBox icon="📅" label="จองคิว"    value={groups.scheduled.length}  color="slate" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Active queue (waiting + in-progress) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            🎫 คิวที่ต้องดูแลตอนนี้
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {groups.waiting.length + groups.inProgress.length}
            </span>
          </h2>

          {[...groups.inProgress, ...groups.waiting].length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-5xl mb-2">✓</div>
              <div className="text-sm">คิวว่าง — ไม่มีคนรอตรวจ</div>
            </div>
          ) : (
            <div className="space-y-2">
              {[...groups.inProgress, ...groups.waiting].map(apt => (
                <QueueCard key={apt._id} apt={apt} onAdvance={advance} />
              ))}
            </div>
          )}
        </div>

        {/* Right column: scheduled + completed */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              📅 นัดถัดไป (ยังไม่ check-in)
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {groups.scheduled.length}
              </span>
            </h2>
            {groups.scheduled.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">ไม่มีนัดเพิ่ม</div>
            ) : (
              <div className="space-y-2">
                {groups.scheduled.map(apt => <QueueCard key={apt._id} apt={apt} compact onAdvance={advance} />)}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              ✅ ตรวจเสร็จแล้ว
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {groups.completed.length}
              </span>
            </h2>
            {groups.completed.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">ยังไม่มี</div>
            ) : (
              <div className="space-y-2">
                {groups.completed.map(apt => <QueueCard key={apt._id} apt={apt} compact onAdvance={advance} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatBox({ icon, label, value, color }) {
  const colorMap = {
    blue:   'from-blue-500 to-indigo-600',
    amber:  'from-amber-500 to-orange-600',
    indigo: 'from-indigo-500 to-purple-600',
    slate:  'from-slate-500 to-slate-700'
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-lg shadow-sm`}>
          {icon}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        </div>
      </div>
    </div>
  );
}

function QueueCard({ apt, compact, onAdvance }) {
  const p = apt.patient;
  const hasRedFlag = p?.redFlags?.some(f => !f.resolved);

  return (
    <div className={`relative rounded-xl border p-3 transition ${
      hasRedFlag
        ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-md'
        : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
    }`}>
      {hasRedFlag && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-md animate-soft-pulse">
          🚨 RED FLAG
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="text-center min-w-[50px]">
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{apt.time}</div>
          <div className="text-[10px] text-slate-500 uppercase">น.</div>
        </div>

        <div className="border-l border-slate-300 dark:border-slate-600 pl-3 flex-1 min-w-0">
          <Link href={`/patients/${p?.hn}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 truncate block">
            {p?.fullName}
          </Link>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            HN:{p?.hn} · {apt.reason}
          </div>
          {!compact && (
            <div className="text-xs text-slate-500 mt-0.5">
              {apt.doctor?.fullName || 'รอแพทย์'}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 items-end">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[apt.status]}`}>
            {STATUS_LABEL[apt.status]}
          </span>
          {!compact && (
            <div className="flex gap-1">
              {apt.status === 'waiting' && (
                <button
                  onClick={() => onAdvance(apt, 'in-progress')}
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >เรียกตรวจ</button>
              )}
              {apt.status === 'in-progress' && (
                <Link
                  href={`/visits/new?patient=${p?.hn}`}
                  className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >บันทึก</Link>
              )}
              {apt.status === 'scheduled' && (
                <button
                  onClick={() => onAdvance(apt, 'waiting')}
                  className="text-[10px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >Check-in</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
