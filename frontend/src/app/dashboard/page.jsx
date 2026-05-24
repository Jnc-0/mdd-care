'use client';

/**
 * MDD Care - Dashboard (enriched)
 * รพ.คลองหาด แผนกจิตเวช
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import AppShell from '@/components/AppShell';

const API_URL    = process.env.NEXT_PUBLIC_API_URL    ?? '';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? '';

const fmtTime = (d) => new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

/* ============ Main ============ */
export default function DashboardPage() {
  const [stats, setStats] = useState({ totalPatients: 0, activeRedFlags: 0, todayAppointments: 0, missedMedications: 0 });
  const [redFlagAlert, setRedFlagAlert] = useState(null);
  const [missedMeds,   setMissedMeds]   = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [smsLog,       setSmsLog]       = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [phq9Trend,    setPhq9Trend]    = useState([]);
  const [refillOpen,   setRefillOpen]   = useState(false);

  const socketRef = useRef(null);

  const fetchAll = async () => {
    try {
      const [s, m, q, r, p, n, t] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`).then(r => r.json()),
        fetch(`${API_URL}/api/medications/missed`).then(r => r.json()),
        fetch(`${API_URL}/api/queue`).then(r => r.json()),
        fetch(`${API_URL}/api/records/recent`).then(r => r.json()),
        fetch(`${API_URL}/api/patients`).then(r => r.json()),
        fetch(`${API_URL}/api/notifications/recent`).then(r => r.json()),
        fetch(`${API_URL}/api/reports/phq9-trend`).then(r => r.json())
      ]);
      setStats(s); setMissedMeds(m); setQueue(q); setRecentVisits(r);
      setPatients(p); setSmsLog(n); setPhq9Trend(t);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAll();
    socketRef.current = io(SOCKET_URL || undefined, { transports: ['websocket', 'polling'] });
    const s = socketRef.current;
    s.on('red-flag-alert', (data) => {
      setRedFlagAlert(data);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 RED FLAG ALERT', { body: `${data.patient.fullName} - ${data.flagLabel}`, tag: 'red-flag' });
      }
    });
    s.on('medication-missed', fetchAll);
    s.on('medication-confirmed', fetchAll);
    s.on('refill-warning', fetchAll);
    s.on('sms-sent', (data) => setSmsLog(prev => [data, ...prev].slice(0, 20)));

    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    return () => s.disconnect();
  }, []);

  const testRedFlag = async () => {
    if (patients.length === 0) return alert('ไม่มีคนไข้');
    const p = patients[1] || patients[0];
    await fetch(`${API_URL}/api/red-flag`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: p._id, flagType: 'suicidal',
        description: 'ทดสอบระบบ - คนไข้พูดถึงการฆ่าตัวตาย' })
    });
  };

  const triggerCron = async () => {
    const res = await fetch(`${API_URL}/api/trigger/medication-check`, { method: 'POST' });
    const data = await res.json();
    alert(`ตรวจสอบเสร็จ - พบ ${data.checked} รายการ ส่ง SMS ${data.smsSent} ราย`);
    fetchAll();
  };

  return (
    <AppShell title="แดชบอร์ดทีมแพทย์">

      {/* Red Flag Banner */}
      {redFlagAlert && <RedFlagBanner alert={redFlagAlert} onClose={() => setRedFlagAlert(null)} />}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon="👥" label="คนไข้"        value={stats.totalPatients}     accent="indigo" />
        <StatCard icon="🚨" label="Red Flag"     value={stats.activeRedFlags}    accent="red" />
        <StatCard icon="📅" label="นัดวันนี้"    value={stats.todayAppointments} accent="blue" />
        <StatCard icon="⏰" label="รอตรวจ"       value={stats.todayWaiting || 0} accent="amber" />
        <StatCard icon="💊" label="ลืมยา"        value={stats.missedMedications} accent="rose" />
        <StatCard icon="⚠️" label="ยาควบคุม"    value={stats.controlledMeds || 0} accent="slate" />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/visits/new" className="px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 text-white font-medium shadow-sm flex items-center justify-center gap-2 text-sm">
          📝 บันทึกการตรวจ
        </Link>
        <Link href="/queue" className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-700 hover:from-blue-700 text-white font-medium shadow-sm flex items-center justify-center gap-2 text-sm">
          🎫 คิวตรวจวันนี้
        </Link>
        <button onClick={() => setRefillOpen(true)} className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-medium flex items-center justify-center gap-2 text-sm">
          🔍 ตรวจยาควบคุม
        </button>
        <button onClick={testRedFlag} className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center justify-center gap-2 text-sm">
          🚨 ทดสอบ Red Flag
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Today's Queue (priority) */}
        <Card title="🎫 คิวที่ต้องดูแล" badge={queue.filter(q => q.status === 'waiting' || q.status === 'in-progress').length} action={<Link href="/queue" className="text-xs text-indigo-600 hover:underline">ดูทั้งหมด →</Link>}>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {queue.filter(q => q.status !== 'completed').length === 0 ? (
              <Empty icon="✓" text="คิวว่าง" />
            ) : queue.filter(q => q.status !== 'completed').slice(0, 6).map(apt => (
              <Link key={apt._id} href={`/patients/${apt.patient?.hn}`}
                    className={`block p-2.5 rounded-lg border ${
                      apt.patient?.redFlags?.some(f => !f.resolved)
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-300'
                        : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                    } hover:scale-[1.01] transition`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {apt.time} - {apt.patient?.fullName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">HN:{apt.patient?.hn} · {apt.reason}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    apt.status === 'in-progress' ? 'bg-amber-200 text-amber-800' :
                    apt.status === 'waiting'     ? 'bg-blue-200 text-blue-800' :
                                                   'bg-slate-200 text-slate-700'
                  }`}>{apt.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Missed Medications */}
        <Card title="💊 คนไข้ลืมทานยา" badge={missedMeds.length} danger={missedMeds.length > 0}>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {missedMeds.length === 0 ? (
              <Empty icon="✓" text="ไม่มีคนไข้ลืมยา" />
            ) : missedMeds.map(log => (
              <Link key={log._id} href={`/patients/${log.patient?.hn}`}
                    className="block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{log.patient?.fullName}</div>
                    <div className="text-xs text-slate-500">{log.medication?.medicationName} · {fmtTime(log.scheduledTime)}</div>
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">✉️ SMS ส่งแล้ว</span>
                </div>
              </Link>
            ))}
            {missedMeds.length > 0 && (
              <button onClick={triggerCron} className="w-full mt-2 text-xs py-2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100">
                🔄 ตรวจสอบใหม่ + ส่ง SMS อีกครั้ง
              </button>
            )}
          </div>
        </Card>

        {/* Recent Visits */}
        <Card title="📋 ตรวจล่าสุด" badge={recentVisits.length} action={<Link href="/reports" className="text-xs text-indigo-600 hover:underline">รายงาน →</Link>}>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {recentVisits.length === 0 ? (
              <Empty icon="📭" text="ยังไม่มี" />
            ) : recentVisits.slice(0, 8).map(r => (
              <Link key={r._id} href={`/patients/${r.patientHN}`}
                    className="block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.patientName}</div>
                    <div className="text-xs text-slate-500">{fmtDate(r.visitDate)} · {r.doctorName}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${
                      r.PHQ9Score >= 20 ? 'text-red-600' :
                      r.PHQ9Score >= 15 ? 'text-amber-600' :
                      r.PHQ9Score >= 10 ? 'text-indigo-600' : 'text-blue-600'
                    }`}>{r.PHQ9Score}</div>
                    <div className="text-[9px] text-slate-500">PHQ-9</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        {/* Mini PHQ-9 trend */}
        <Card title="📈 PHQ-9 เฉลี่ย (6 เดือน)">
          {phq9Trend.length > 0 && <MiniChart data={phq9Trend} />}
        </Card>

        {/* SMS Log */}
        <Card title="📱 SMS ที่ส่งล่าสุด (Real-time)" badge={smsLog.length}>
          <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
            {smsLog.length === 0 ? (
              <Empty icon="📭" text="ยังไม่มี SMS" />
            ) : smsLog.map((log, i) => (
              <SmsLogRow key={log._id || i} log={log} />
            ))}
          </div>
        </Card>
      </div>

      {refillOpen && <RefillModal patients={patients} onClose={() => setRefillOpen(false)} />}
    </AppShell>
  );
}

/* ============ Sub-components ============ */

function StatCard({ icon, label, value, accent }) {
  const colors = {
    indigo: 'from-indigo-500 to-blue-600',
    blue:   'from-blue-500 to-cyan-600',
    red:    'from-red-500 to-rose-600',
    amber:  'from-amber-500 to-orange-600',
    rose:   'from-rose-500 to-pink-600',
    slate:  'from-slate-600 to-slate-800'
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[accent]} flex items-center justify-center text-white text-base shadow-sm mb-2`}>
        {icon}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium leading-tight">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function Card({ title, children, badge, action, danger }) {
  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${
      danger
        ? 'bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-900'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
          {badge !== undefined && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              danger
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            }`}>{badge}</span>
          )}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="text-center py-8 text-slate-400">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-xs">{text}</div>
    </div>
  );
}

function SmsLogRow({ log }) {
  const typeColor = { red_flag: 'bg-red-500', medication_miss: 'bg-amber-500', appointment_reminder: 'bg-blue-500', refill_warning: 'bg-rose-500' }[log.type] || 'bg-slate-500';
  const typeLabel = { red_flag: 'Red Flag', medication_miss: 'ลืมยา', appointment_reminder: 'นัดหมาย', refill_warning: 'เวียนยา' }[log.type] || log.type;
  return (
    <div className="flex items-start gap-2 p-2 text-xs border-l-2 border-slate-200 dark:border-slate-700 animate-slide-in">
      <div className={`px-1.5 py-0.5 text-[9px] text-white rounded ${typeColor} flex-shrink-0 mt-0.5`}>{typeLabel}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          <span className="font-mono">{log.to || log.recipient}</span> · {fmtTime(log.timestamp || log.createdAt)}
        </div>
        <div className="text-slate-700 dark:text-slate-300 line-clamp-2 mt-0.5">{log.message}</div>
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const w = 400, h = 120, padding = 20;
  const max = Math.max(...data.map(d => d.avgScore), 20);
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: padding + innerH - (d.avgScore / max) * innerH,
    val: d.avgScore, label: d.month
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
          <text x={p.x} y={p.y - 6} fontSize="9" fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-slate-900 dark:text-slate-100">{p.val}</text>
          <text x={p.x} y={h - 4} fontSize="9" textAnchor="middle" fill="currentColor" className="text-slate-500">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function RedFlagBanner({ alert, onClose }) {
  return (
    <div className="red-flag-glow rounded-2xl p-5 mb-6 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-soft-pulse">🚨</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90">CRITICAL ALERT - RED FLAG</div>
            <div className="text-xl font-bold mt-0.5">{alert.patient.fullName} (HN:{alert.patient.hn})</div>
            <div className="text-sm opacity-95 mt-0.5">อาการ: <span className="font-semibold">{alert.flagLabel || alert.flagType}</span>{alert.description && ` — ${alert.description}`}</div>
            <div className="text-xs opacity-80 mt-1">เวลา: {fmtTime(alert.timestamp)} น. • ส่ง SMS ถึงทีมแพทย์เวรแล้ว</div>
          </div>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium">รับทราบ</button>
      </div>
    </div>
  );
}

function RefillModal({ patients, onClose }) {
  const [pid, setPid]   = useState('');
  const [med, setMed]   = useState('');
  const [res, setRes]   = useState(null);
  const [load, setLoad] = useState(false);

  const check = async () => {
    if (!pid || !med) return;
    setLoad(true);
    try {
      const r = await fetch(`${API_URL}/api/check-refill`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: pid, medicationName: med })
      });
      setRes(await r.json());
    } finally { setLoad(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">🔍 ตรวจสอบยาควบคุมพิเศษ</h3>
          <button onClick={onClose} className="text-2xl text-slate-400">×</button>
        </div>
        <div className="space-y-3">
          <select value={pid} onChange={e => setPid(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
            <option value="">-- เลือกคนไข้ --</option>
            {patients.map(p => <option key={p._id} value={p._id}>{p.fullName} (HN:{p.hn})</option>)}
          </select>
          <input type="text" value={med} onChange={e => setMed(e.target.value)} placeholder="เช่น Methylphenidate, Alprazolam"
                 className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
          <button onClick={check} disabled={load || !pid || !med}
                  className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium">
            {load ? 'กำลังตรวจ...' : 'ตรวจสอบ'}
          </button>
        </div>
        {res && (
          <div className={`mt-4 p-4 rounded-lg border ${
            res.allowRefill === false
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-900 dark:text-blue-200'
          }`}>
            <div className="font-semibold mb-1">{res.allowRefill === false ? '⚠️ พบความผิดปกติ' : '✓ ปลอดภัย'}</div>
            <div className="text-sm">{res.warning || `รับยา ${res.recentCount || 0} ครั้งใน 30 วัน - อนุญาตจ่ายได้`}</div>
            {res.smsSent && <div className="text-xs mt-2 opacity-80">✉️ ส่ง SMS แจ้งญาติแล้ว</div>}
          </div>
        )}
      </div>
    </div>
  );
}
