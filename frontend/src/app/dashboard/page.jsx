'use client';

/**
 * MDD Care - Dashboard Page
 * รพ.คลองหาด แผนกจิตเวช
 *
 * Features:
 *  - Light/Dark Mode (Winter Palette: slate/blue/indigo/zinc)
 *  - แถบ Red Flag กะพริบทันทีเมื่อมีอาการวิกฤต (Socket.io)
 *  - รายชื่อคนไข้ที่ลืมทานยา + ปุ่มส่ง SMS ซ้ำ
 *  - นัดหมายวันนี้
 *  - ปุ่มตรวจเช็คยาควบคุมพิเศษ (Refill Check)
 *  - Activity Log แสดง SMS ที่ส่งล่าสุดแบบเรียลไทม์
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

const API_URL    = process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

/* ============ Helpers ============ */
const fmtTime = (d) => new Date(d).toLocaleTimeString('th-TH', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
});
const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok'
});

/* ============ Components ============ */

function StatCard({ icon, label, value, accent }) {
  const colors = {
    blue:   'from-blue-500 to-indigo-600 text-blue-100',
    indigo: 'from-indigo-500 to-purple-600 text-indigo-100',
    red:    'from-red-500 to-rose-600 text-red-100',
    slate:  'from-slate-600 to-slate-800 text-slate-100'
  };
  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[accent]} flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
            {label}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function RedFlagBanner({ alert, onClose }) {
  if (!alert) return null;
  return (
    <div className="red-flag-glow rounded-2xl p-5 mb-6 text-white shadow-2xl animate-critical-flash">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-soft-pulse">🚨</div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
              CRITICAL ALERT - RED FLAG
            </div>
            <div className="text-xl font-bold mt-0.5">
              {alert.patient.fullName} (HN:{alert.patient.hn})
            </div>
            <div className="text-sm opacity-95 mt-0.5">
              อาการ: <span className="font-semibold">{alert.flagLabel || alert.flagType}</span>
              {alert.description && ` — ${alert.description}`}
            </div>
            <div className="text-xs opacity-80 mt-1">
              เวลา: {fmtTime(alert.timestamp)} น. • ส่ง SMS ถึงทีมแพทย์เวรแล้ว
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium backdrop-blur transition"
        >
          รับทราบ
        </button>
      </div>
    </div>
  );
}

function MissedMedRow({ log, onResend }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
          💊
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {log.patient?.fullName || '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {log.medication?.medicationName} · เวลา {fmtTime(log.scheduledTime)}
          </div>
        </div>
      </div>
      <button
        onClick={() => onResend(log)}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5"
      >
        📱 ส่ง SMS ซ้ำ
      </button>
    </div>
  );
}

function AppointmentRow({ apt }) {
  const statusStyle = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    missed:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    cancelled: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  }[apt.status] || 'bg-slate-100 text-slate-700';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-center min-w-[55px]">
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {apt.time}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">น.</div>
        </div>
        <div className="border-l border-slate-300 dark:border-slate-600 pl-3 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {apt.patient?.fullName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            HN:{apt.patient?.hn} · {apt.reason || '—'}
          </div>
        </div>
      </div>
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle}`}>
        {apt.status}
      </span>
    </div>
  );
}

function SmsLogRow({ log }) {
  const typeColor = {
    red_flag:             'bg-red-500',
    medication_miss:      'bg-amber-500',
    appointment_reminder: 'bg-blue-500',
    refill_warning:       'bg-rose-500',
    general:              'bg-slate-500'
  }[log.type] || 'bg-slate-500';

  const typeLabel = {
    red_flag:             'Red Flag',
    medication_miss:      'ลืมยา',
    appointment_reminder: 'นัดหมาย',
    refill_warning:       'เวียนยา',
    general:              'ทั่วไป'
  }[log.type] || log.type;

  return (
    <div className="flex items-start gap-3 p-3 text-sm border-l-2 border-slate-200 dark:border-slate-700 animate-slide-in">
      <div className={`px-2 py-0.5 text-xs font-medium text-white rounded ${typeColor} flex-shrink-0 mt-0.5`}>
        {typeLabel}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ถึง: <span className="font-mono">{log.to || log.recipient}</span>
          {' · '}
          {fmtTime(log.timestamp || log.createdAt)}
        </div>
        <div className="text-slate-700 dark:text-slate-300 line-clamp-2 mt-0.5">
          {log.message}
        </div>
      </div>
    </div>
  );
}

function RefillModal({ open, onClose, patients }) {
  const [patientId, setPatientId] = useState('');
  const [medName, setMedName]     = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  if (!open) return null;

  const check = async () => {
    if (!patientId || !medName) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/check-refill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, medicationName: medName })
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            🔍 ตรวจสอบยาควบคุมพิเศษ
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
          >×</button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          ระบบจะตรวจสอบประวัติการรับยาในรอบ 30 วัน หากพบการเวียนรับซ้ำซ้อนจะแจ้งเตือนญาติทาง SMS อัตโนมัติ
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              คนไข้
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- เลือกคนไข้ --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.fullName} (HN:{p.hn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              ชื่อยา
            </label>
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="เช่น Methylphenidate, Alprazolam"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={check}
            disabled={loading || !patientId || !medName}
            className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition"
          >
            {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ Refill'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg border ${
            result.allowRefill === false
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
          }`}>
            <div className="font-semibold mb-1">
              {result.allowRefill === false ? '⚠️ พบความผิดปกติ' : '✓ ปลอดภัย'}
            </div>
            <div className="text-sm">
              {result.warning || `ตรวจพบประวัติรับยา ${result.recentCount || 0} ครั้งใน 30 วัน - อนุญาตให้จ่ายได้`}
            </div>
            {result.smsSent && (
              <div className="text-xs mt-2 opacity-80">
                ✉️ ส่ง SMS แจ้งเตือนญาติแล้ว
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Main Dashboard ============ */

export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0, activeRedFlags: 0,
    todayAppointments: 0, missedMedications: 0
  });
  const [redFlagAlert, setRedFlagAlert] = useState(null);
  const [missedMeds,   setMissedMeds]   = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [smsLog,       setSmsLog]       = useState([]);
  const [patients,     setPatients]     = useState([]);
  const [refillOpen,   setRefillOpen]   = useState(false);
  const [triggering,   setTriggering]   = useState(false);
  const [connected,    setConnected]    = useState(false);
  const socketRef = useRef(null);

  /* ── Theme ── */
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mdd-theme', next ? 'dark' : 'light');
  };

  /* ── Fetch ── */
  const fetchAll = async () => {
    try {
      const [s, m, a, p, n] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`).then(r => r.json()),
        fetch(`${API_URL}/api/medications/missed`).then(r => r.json()),
        fetch(`${API_URL}/api/appointments/today`).then(r => r.json()),
        fetch(`${API_URL}/api/patients`).then(r => r.json()),
        fetch(`${API_URL}/api/notifications/recent`).then(r => r.json())
      ]);
      setStats(s); setMissedMeds(m); setAppointments(a);
      setPatients(p); setSmsLog(n);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  /* ── Socket.io ── */
  useEffect(() => {
    fetchAll();

    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    const s = socketRef.current;

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('red-flag-alert', (data) => {
      setRedFlagAlert(data);
      // Web Push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 RED FLAG ALERT', {
          body: `${data.patient.fullName} - ${data.flagLabel}`,
          tag: 'red-flag'
        });
      }
    });

    s.on('medication-missed', () => fetchAll());
    s.on('medication-confirmed', () => fetchAll());
    s.on('refill-warning', () => fetchAll());

    s.on('sms-sent', (data) => {
      setSmsLog(prev => [data, ...prev].slice(0, 20));
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => s.disconnect();
  }, []);

  /* ── Actions ── */
  const resendSms = async (log) => {
    await fetch(`${API_URL}/api/trigger/medication-check`, { method: 'POST' });
    alert(`ส่ง SMS แจ้งญาติของ ${log.patient?.fullName} แล้ว`);
  };

  const triggerCronCheck = async () => {
    setTriggering(true);
    try {
      const res  = await fetch(`${API_URL}/api/trigger/medication-check`, { method: 'POST' });
      const data = await res.json();
      alert(`ตรวจสอบเสร็จ - พบ ${data.checked} รายการ ส่ง SMS ${data.smsSent} ราย`);
      await fetchAll();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setTriggering(false);
    }
  };

  const testRedFlag = async () => {
    if (patients.length === 0) return alert('ไม่มีคนไข้ในระบบ - กดปุ่ม Seed Data ก่อน');
    const p = patients[0];
    await fetch(`${API_URL}/api/red-flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: p._id,
        flagType: 'suicidal',
        description: 'ทดสอบระบบ - คนไข้พูดถึงการฆ่าตัวตาย'
      })
    });
  };

  const seedDemo = async () => {
    if (!confirm('ลบข้อมูลเดิมและสร้าง Demo Data ใหม่?')) return;
    const res = await fetch(`${API_URL}/api/seed`, { method: 'POST' });
    const data = await res.json();
    alert(`Seed สำเร็จ: ${JSON.stringify(data.stats)}`);
    await fetchAll();
  };

  /* ============ Render ============ */
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ───── NAVBAR ───── */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-lg shadow-md">
              🏥
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                MDD Care - แผนกจิตเวช
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                รพ.คลองหาด จ.สระแก้ว
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-slate-600 dark:text-slate-400">
                {connected ? 'Real-time' : 'Offline'}
              </span>
            </div>
            <Link
              href="/chat"
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              💬 <span className="hidden sm:inline">แชต</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              aria-label="toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* ───── CONTENT ───── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* RED FLAG BANNER */}
        <RedFlagBanner alert={redFlagAlert} onClose={() => setRedFlagAlert(null)} />

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon="👥" label="คนไข้ทั้งหมด"   value={stats.totalPatients}     accent="blue" />
          <StatCard icon="🚨" label="Red Flag ฉุกเฉิน" value={stats.activeRedFlags}    accent="red" />
          <StatCard icon="📅" label="นัดวันนี้"      value={stats.todayAppointments} accent="indigo" />
          <StatCard icon="💊" label="ลืมทานยา"      value={stats.missedMedications} accent="slate" />
        </div>

        {/* QUICK ACTIONS */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setRefillOpen(true)}
            className="px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-medium shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
          >
            🔍 ตรวจยาควบคุม
          </button>
          <button
            onClick={triggerCronCheck}
            disabled={triggering}
            className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            ⏰ {triggering ? 'กำลังตรวจ...' : 'เช็คลืมยา'}
          </button>
          <button
            onClick={testRedFlag}
            className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2"
          >
            🚨 ทดสอบ Red Flag
          </button>
          <button
            onClick={seedDemo}
            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 font-medium transition flex items-center justify-center gap-2"
          >
            🌱 Seed Demo
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* MISSED MEDICATIONS */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                💊 คนไข้ที่ลืมทานยา
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                  {missedMeds.length}
                </span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ส่ง SMS เตือนญาติอัตโนมัติ
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {missedMeds.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <div className="text-5xl mb-2">✓</div>
                  <div className="text-sm">ไม่มีคนไข้ลืมทานยา</div>
                </div>
              ) : (
                missedMeds.map(log => (
                  <MissedMedRow key={log._id} log={log} onResend={resendSms} />
                ))
              )}
            </div>
          </div>

          {/* TODAY APPOINTMENTS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              📅 นัดหมายวันนี้
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {appointments.length}
              </span>
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <div className="text-5xl mb-2">📭</div>
                  <div className="text-sm">ไม่มีนัดหมาย</div>
                </div>
              ) : (
                appointments.map(apt => (
                  <AppointmentRow key={apt._id} apt={apt} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* SMS ACTIVITY LOG */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              📱 SMS ที่ส่งล่าสุด (Real-time)
            </h2>
            <button
              onClick={fetchAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              รีเฟรช
            </button>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {smsLog.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                ยังไม่มีการส่ง SMS
              </div>
            ) : (
              smsLog.map((log, i) => <SmsLogRow key={log._id || i} log={log} />)
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600 py-4">
          MDD Care © 2026 · รพ.คลองหาด แผนกจิตเวช · Digital 100% Paperless
        </footer>
      </div>

      {/* MODALS */}
      <RefillModal
        open={refillOpen}
        onClose={() => setRefillOpen(false)}
        patients={patients}
      />
    </main>
  );
}
