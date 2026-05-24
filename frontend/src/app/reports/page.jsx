'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [phq9,    setPhq9]    = useState([]);
  const [adhere,  setAdhere]  = useState([]);
  const [flags,   setFlags]   = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/reports/summary`).then(r => r.json()),
      fetch(`${API_URL}/api/reports/phq9-trend`).then(r => r.json()),
      fetch(`${API_URL}/api/reports/adherence`).then(r => r.json()),
      fetch(`${API_URL}/api/reports/redflags`).then(r => r.json())
    ]).then(([s, p, a, f]) => {
      setSummary(s); setPhq9(p); setAdhere(a); setFlags(f);
    });
  }, []);

  return (
    <AppShell title="รายงานและสถิติ">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon="📊"
          label="PHQ-9 เฉลี่ย"
          value={summary?.avgPHQ9?.toFixed(1) || '-'}
          suffix="/27"
          color="indigo"
          desc="ทั้งหมดในระบบ"
        />
        <KpiCard
          icon="💊"
          label="อัตราการทานยา"
          value={summary?.adherenceRate || '-'}
          suffix="%"
          color="blue"
          desc="7 วันล่าสุด"
        />
        <KpiCard
          icon="🚨"
          label="Red Flag เดือนนี้"
          value={summary?.redFlagThisMonth || 0}
          color="red"
          desc="เหตุการณ์วิกฤต"
        />
        <KpiCard
          icon="🩺"
          label="ตรวจเดือนนี้"
          value={summary?.completedVisitsThisMonth || 0}
          color="slate"
          desc="ครั้ง"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">

        {/* PHQ-9 Trend Line Chart */}
        <ChartCard title="📈 แนวโน้ม PHQ-9 เฉลี่ย (6 เดือน)">
          {phq9.length > 0 && <LineChart data={phq9} />}
        </ChartCard>

        {/* Adherence Bar Chart */}
        <ChartCard title="💊 อัตราการทานยา 7 วันล่าสุด">
          {adhere.length > 0 && <BarChart data={adhere} />}
        </ChartCard>

        {/* Red Flag Trend */}
        <ChartCard title="🚨 Red Flag Incidents ราย 6 เดือน">
          {flags.length > 0 && <ColumnChart data={flags} />}
        </ChartCard>

        {/* Diagnosis Distribution */}
        <ChartCard title="🔬 การกระจายของโรค">
          {summary?.diagnosisDistribution && <PieList data={summary.diagnosisDistribution} />}
        </ChartCard>
      </div>
    </AppShell>
  );
}

/* ─── Components ─── */

function KpiCard({ icon, label, value, suffix, color, desc }) {
  const colorMap = {
    indigo: 'from-indigo-500 to-blue-600',
    blue:   'from-blue-500 to-sky-600',
    red:    'from-red-500 to-rose-600',
    slate:  'from-slate-600 to-slate-800'
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white text-xl shadow-sm`}>
          {icon}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        {value}<span className="text-base text-slate-400">{suffix}</span>
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{desc}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LineChart({ data }) {
  const w = 480, h = 200, padding = 36;
  const max = Math.max(...data.map(d => d.avgScore), 20);
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padding + i * xStep,
    y: padding + innerH - (d.avgScore / max) * innerH,
    val: d.avgScore,
    label: d.month
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {/* Y-axis */}
      {[0, 5, 10, 15, 20].map(v => (
        <g key={v}>
          <line x1={padding} y1={padding + innerH - (v / max) * innerH} x2={padding + innerW} y2={padding + innerH - (v / max) * innerH} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
          <text x={padding - 6} y={padding + innerH - (v / max) * innerH + 3} fontSize="9" textAnchor="end" fill="currentColor" className="text-slate-500">{v}</text>
        </g>
      ))}

      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" />
          <text x={p.x} y={p.y - 8} fontSize="10" fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-slate-900 dark:text-slate-100">{p.val}</text>
          <text x={p.x} y={h - 8} fontSize="10" textAnchor="middle" fill="currentColor" className="text-slate-500">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  const w = 480, h = 200, padding = 36;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;
  const barW = innerW / data.length * 0.6;
  const gap = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={padding} y1={padding + innerH - (v / 100) * innerH} x2={padding + innerW} y2={padding + innerH - (v / 100) * innerH} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
          <text x={padding - 6} y={padding + innerH - (v / 100) * innerH + 3} fontSize="9" textAnchor="end" fill="currentColor" className="text-slate-500">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padding + i * gap + (gap - barW) / 2;
        const takenH = (d.taken / 100) * innerH;
        const missedH = (d.missed / 100) * innerH;
        return (
          <g key={i}>
            <rect x={x} y={padding + innerH - takenH} width={barW} height={takenH} fill="#6366f1" rx="3" />
            <rect x={x} y={padding + innerH - takenH - missedH} width={barW} height={missedH} fill="#fca5a5" rx="3" opacity="0.7" />
            <text x={x + barW / 2} y={padding + innerH - takenH - missedH - 4} fontSize="10" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-slate-900 dark:text-slate-100">{d.taken}%</text>
            <text x={x + barW / 2} y={h - 8} fontSize="10" textAnchor="middle" fill="currentColor" className="text-slate-500">{d.day}</text>
          </g>
        );
      })}
      {/* Legend */}
      <g transform={`translate(${padding}, 12)`}>
        <rect width="10" height="10" fill="#6366f1" rx="2" />
        <text x="14" y="9" fontSize="9" fill="currentColor" className="text-slate-600 dark:text-slate-400">ทานยา</text>
        <rect x="60" width="10" height="10" fill="#fca5a5" opacity="0.7" rx="2" />
        <text x="74" y="9" fontSize="9" fill="currentColor" className="text-slate-600 dark:text-slate-400">ลืมทาน</text>
      </g>
    </svg>
  );
}

function ColumnChart({ data }) {
  const w = 480, h = 200, padding = 36;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;
  const max = Math.max(...data.map(d => d.count), 5);
  const barW = innerW / data.length * 0.55;
  const gap = innerW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {[0, Math.ceil(max / 2), max].map(v => (
        <g key={v}>
          <line x1={padding} y1={padding + innerH - (v / max) * innerH} x2={padding + innerW} y2={padding + innerH - (v / max) * innerH} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
          <text x={padding - 6} y={padding + innerH - (v / max) * innerH + 3} fontSize="9" textAnchor="end" fill="currentColor" className="text-slate-500">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padding + i * gap + (gap - barW) / 2;
        const barH = (d.count / max) * innerH;
        return (
          <g key={i}>
            <rect x={x} y={padding + innerH - barH} width={barW} height={barH}
                  fill={`url(#redGrad)`} rx="4" />
            <text x={x + barW / 2} y={padding + innerH - barH - 4} fontSize="11" textAnchor="middle" fontWeight="bold" fill="currentColor" className="text-slate-900 dark:text-slate-100">{d.count}</text>
            <text x={x + barW / 2} y={h - 8} fontSize="10" textAnchor="middle" fill="currentColor" className="text-slate-500">{d.month}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="redGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PieList({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <div className="text-center py-8 text-slate-400">ไม่มีข้อมูล</div>;

  const colors = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4', '#0ea5e9', '#475569'];

  // Render as horizontal bars instead of pie (cleaner)
  return (
    <div className="space-y-3 mt-2">
      {data.map((d, i) => {
        const pct = total ? (d.count / total) * 100 : 0;
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-700 dark:text-slate-300">{d.label}</span>
              <span className="text-slate-500 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">{d.count}</span> ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-center">
        คนไข้ในระบบทั้งหมด {total} ราย
      </div>
    </div>
  );
}
