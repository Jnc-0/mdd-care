'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const DIAG_LABELS = {
  MDD: 'Major Depressive Disorder (ซึมเศร้า)',
  BPD: 'Bipolar Disorder (ไบโพลาร์)',
  PDD: 'Persistent Depressive Disorder',
  SAD: 'Social Anxiety Disorder',
  OCD: 'OCD',
  PTSD: 'PTSD'
};

const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', {
  day: 'numeric', month: 'short', year: '2-digit'
});

export default function PatientDetailPage() {
  const { hn } = useParams();
  const [patient,     setPatient]     = useState(null);
  const [meds,        setMeds]        = useState([]);
  const [records,     setRecords]     = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tab,         setTab]         = useState('overview');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/patients/${hn}`).then(r => r.json()),
      fetch(`${API_URL}/api/patients/${hn}/medications`).then(r => r.json()),
      fetch(`${API_URL}/api/patients/${hn}/records`).then(r => r.json()),
      fetch(`${API_URL}/api/patients/${hn}/appointments`).then(r => r.json())
    ]).then(([p, m, r, a]) => {
      setPatient(p); setMeds(m); setRecords(r); setAppointments(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [hn]);

  if (loading) {
    return (
      <AppShell title="กำลังโหลด...">
        <div className="text-center py-20 text-slate-400">⏳ กำลังโหลดข้อมูลคนไข้</div>
      </AppShell>
    );
  }
  if (!patient) {
    return (
      <AppShell title="ไม่พบคนไข้">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-lg text-slate-500">ไม่พบคนไข้ HN: {hn}</div>
          <Link href="/patients" className="mt-4 inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white">
            ← กลับรายการคนไข้
          </Link>
        </div>
      </AppShell>
    );
  }

  const latestRecord = records[0];
  const hasRedFlag = patient.redFlags?.some(f => !f.resolved);

  return (
    <AppShell title={`${patient.fullName} (HN:${patient.hn})`}>
      {/* ───── Hero Card ───── */}
      <div className={`mb-5 rounded-2xl p-5 border ${
        hasRedFlag
          ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 border-red-300 dark:border-red-800'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      } shadow-sm`}>
        <div className="flex items-start gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md flex-shrink-0 ${
            patient.gender === 'male'
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          }`}>
            {patient.gender === 'male' ? '👨' : '👩'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {patient.fullName}
                  {hasRedFlag && <span className="text-2xl animate-soft-pulse">🚨</span>}
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  HN: <span className="font-mono font-semibold">{patient.hn}</span> ·
                  เลขบัตร: <span className="font-mono">{patient.citizenId}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/visits/new" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">
                  📝 บันทึกการตรวจ
                </Link>
                <Link href="/chat" className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
                  💬 แชต
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <InfoCell label="อายุ" value={`${patient.age} ปี`} />
              <InfoCell label="เพศ" value={patient.gender === 'male' ? 'ชาย' : patient.gender === 'female' ? 'หญิง' : 'อื่น ๆ'} />
              <InfoCell label="กรุ๊ปเลือด" value={patient.bloodType || '-'} />
              <InfoCell label="แพ้ยา" value={patient.allergies || 'NKDA'} alert={patient.allergies && patient.allergies !== 'NKDA'} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {DIAG_LABELS[patient.diagnosis]}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                patient.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                patient.severity === 'severe'   ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                patient.severity === 'moderate' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
                                                  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              }`}>
                ระดับ: {patient.severity}
              </span>
              {latestRecord && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  PHQ-9 ล่าสุด: {latestRecord.PHQ9Score}/27
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Tabs ───── */}
      <div className="flex gap-1 mb-5 overflow-x-auto bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
        {[
          { id: 'overview',  label: '📋 ภาพรวม' },
          { id: 'history',   label: '📜 ประวัติการรักษา', count: records.length },
          { id: 'meds',      label: '💊 ยาที่ใช้',         count: meds.length },
          { id: 'appts',     label: '📅 นัดหมาย',         count: appointments.length },
          { id: 'phq9',      label: '📈 กราฟ PHQ-9' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                tab === t.id ? 'bg-white/30' : 'bg-slate-200 dark:bg-slate-700'
              }`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ───── Content ───── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {tab === 'overview'  && <TabOverview patient={patient} latestRecord={latestRecord} />}
          {tab === 'history'   && <TabHistory records={records} />}
          {tab === 'meds'      && <TabMeds meds={meds} />}
          {tab === 'appts'     && <TabAppointments appointments={appointments} />}
          {tab === 'phq9'      && <TabPHQ9 records={records} />}
        </div>

        {/* Sidebar - always show contact info */}
        <div className="space-y-5">
          <Card title="ผู้ดูแล (Caregiver)">
            <InfoLine label="ชื่อ" value={patient.caregiverName} />
            <InfoLine label="ความสัมพันธ์" value={patient.caregiverRelation} />
            <InfoLine label="เบอร์มือถือ" value={patient.caregiverPhone} mono />
            <a href={`tel:${patient.caregiverPhone}`} className="mt-2 block text-center px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium hover:bg-indigo-100">
              📞 โทรเลย
            </a>
          </Card>

          <Card title="ที่อยู่และอาชีพ">
            <InfoLine label="ที่อยู่" value={patient.address} />
            <InfoLine label="อาชีพ" value={patient.occupation} />
            <InfoLine label="เบอร์ส่วนตัว" value={patient.phone} mono />
          </Card>

          {hasRedFlag && (
            <Card title="🚨 Red Flag Active" danger>
              {patient.redFlags.filter(f => !f.resolved).map((f, i) => (
                <div key={i} className="text-sm text-red-700 dark:text-red-300">
                  <div className="font-semibold">{f.flagType}</div>
                  {f.description && <div className="text-xs mt-1">{f.description}</div>}
                  <div className="text-[10px] mt-1 opacity-75">บันทึก {fmtDate(f.notedAt)}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Sub-components ─── */

function InfoCell({ label, value, alert }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`font-medium ${alert ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}

function InfoLine({ label, value, mono }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-slate-900 dark:text-slate-100 text-right ${mono ? 'font-mono' : ''}`}>{value || '-'}</span>
    </div>
  );
}

function Card({ title, children, danger }) {
  return (
    <div className={`rounded-2xl p-4 border shadow-sm ${
      danger
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    }`}>
      <h3 className={`text-sm font-bold mb-3 ${danger ? 'text-red-900 dark:text-red-200' : 'text-slate-900 dark:text-slate-100'}`}>
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function TabOverview({ patient, latestRecord }) {
  return (
    <>
      <Card title="ข้อมูลทั่วไป">
        <InfoLine label="ชื่อ-สกุล" value={patient.fullName} />
        <InfoLine label="วันเกิด" value={patient.dob ? fmtDate(patient.dob) : '-'} />
        <InfoLine label="กรุ๊ปเลือด" value={patient.bloodType} />
        <InfoLine label="เลขบัตรประชาชน" value={patient.citizenId} mono />
        <InfoLine label="วินิจฉัย" value={DIAG_LABELS[patient.diagnosis]} />
        <InfoLine label="หมายเหตุ" value={patient.diagnosisNote} />
        <InfoLine label="ลงทะเบียนเมื่อ" value={patient.registeredAt ? fmtDate(patient.registeredAt) : '-'} />
      </Card>

      {latestRecord && (
        <Card title="ผลการตรวจล่าสุด">
          <InfoLine label="วันที่ตรวจ" value={fmtDate(latestRecord.visitDate)} />
          <InfoLine label="แพทย์ผู้ตรวจ" value={latestRecord.doctorName} />
          <InfoLine label="คะแนน PHQ-9" value={`${latestRecord.PHQ9Score}/27`} />
          <InfoLine label="ระดับความเสี่ยง" value={latestRecord.riskAssessment} />
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">อาการที่บันทึก</div>
            <div className="text-sm text-slate-700 dark:text-slate-300">{latestRecord.symptoms}</div>
          </div>
          <div className="pt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">แผนการรักษา</div>
            <div className="text-sm text-slate-700 dark:text-slate-300">{latestRecord.treatment}</div>
          </div>
        </Card>
      )}
    </>
  );
}

function TabHistory({ records }) {
  if (!records.length) return <Card title="ประวัติการรักษา"><div className="text-center py-8 text-slate-400">ยังไม่มีประวัติ</div></Card>;
  return (
    <Card title={`ประวัติการรักษาทั้งหมด (${records.length} ครั้ง)`}>
      <div className="space-y-2 mt-2">
        {records.map(r => (
          <div key={r._id} className="border-l-2 border-indigo-400 dark:border-indigo-600 pl-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-r-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {fmtDate(r.visitDate)} · {r.doctorName}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{r.symptoms}</div>
                <div className="text-xs text-slate-500 mt-1">การรักษา: {r.treatment}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-lg font-bold ${
                  r.PHQ9Score >= 20 ? 'text-red-600' :
                  r.PHQ9Score >= 15 ? 'text-amber-600' :
                  r.PHQ9Score >= 10 ? 'text-indigo-600' : 'text-blue-600'
                }`}>{r.PHQ9Score}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">PHQ-9</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TabMeds({ meds }) {
  if (!meds.length) return <Card title="ยาที่ใช้"><div className="text-center py-8 text-slate-400">ยังไม่มีรายการยา</div></Card>;
  return (
    <Card title={`ยาที่ใช้ปัจจุบัน (${meds.length} รายการ)`}>
      <div className="space-y-3 mt-2">
        {meds.map(m => {
          const stockPct = m.totalPills ? (m.remainingPills / m.totalPills) * 100 : 0;
          const stockColor = stockPct < 20 ? 'bg-red-500' : stockPct < 50 ? 'bg-amber-500' : 'bg-blue-500';
          return (
            <div key={m._id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {m.medicationName}
                    {m.isControlled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
                        ยาควบคุม
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {m.dosage} · {m.frequency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {m.remainingPills}/{m.totalPills}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">เม็ดคงเหลือ</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${stockColor}`} style={{ width: `${stockPct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{Math.round(stockPct)}%</span>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                เวลาทาน: {m.scheduledTimes?.join(', ') || '-'} ·
                เริ่ม: {fmtDate(m.startDate)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TabAppointments({ appointments }) {
  if (!appointments.length) return <Card title="นัดหมาย"><div className="text-center py-8 text-slate-400">ยังไม่มีนัดหมาย</div></Card>;
  return (
    <Card title={`นัดหมายทั้งหมด (${appointments.length})`}>
      <div className="space-y-2 mt-2">
        {appointments.map(a => (
          <div key={a._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
            <div className="text-center min-w-[55px]">
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{a.time}</div>
              <div className="text-[10px] text-slate-500 uppercase">น.</div>
            </div>
            <div className="border-l border-slate-300 dark:border-slate-600 pl-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {fmtDate(a.date)} · {a.reason || 'ไม่ระบุ'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{a.doctor?.fullName || 'แพทย์'}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              a.status === 'completed'   ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
              a.status === 'scheduled'   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
              a.status === 'in-progress' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                                           'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TabPHQ9({ records }) {
  const sorted = [...records].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
  if (!sorted.length) return <Card title="กราฟ PHQ-9"><div className="text-center py-8 text-slate-400">ยังไม่มีข้อมูล</div></Card>;

  const maxScore = 27;
  const w = 720;
  const h = 240;
  const padding = 40;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const xStep = sorted.length > 1 ? innerW / (sorted.length - 1) : 0;
  const points = sorted.map((r, i) => ({
    x: padding + i * xStep,
    y: padding + innerH - (r.PHQ9Score / maxScore) * innerH,
    score: r.PHQ9Score,
    date: r.visitDate
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + innerH} L ${points[0].x} ${padding + innerH} Z`;

  // Severity zones
  const zoneY = (score) => padding + innerH - (score / maxScore) * innerH;

  return (
    <Card title="กราฟแนวโน้ม PHQ-9">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        คะแนน 0-4 = ปกติ · 5-9 = ซึมเศร้าน้อย · 10-14 = ปานกลาง · 15-19 = ปานกลางถึงรุนแรง · 20-27 = รุนแรง
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" style={{ minWidth: '600px' }}>
          {/* Severity zones */}
          <rect x={padding} y={zoneY(27)} width={innerW} height={zoneY(20) - zoneY(27)} fill="#fee2e2" opacity="0.4" className="dark:fill-red-900/20" />
          <rect x={padding} y={zoneY(20)} width={innerW} height={zoneY(15) - zoneY(20)} fill="#fef3c7" opacity="0.4" className="dark:fill-amber-900/20" />
          <rect x={padding} y={zoneY(15)} width={innerW} height={zoneY(10) - zoneY(15)} fill="#e0e7ff" opacity="0.4" className="dark:fill-indigo-900/20" />
          <rect x={padding} y={zoneY(10)} width={innerW} height={zoneY(5) - zoneY(10)} fill="#dbeafe" opacity="0.4" className="dark:fill-blue-900/20" />
          <rect x={padding} y={zoneY(5)} width={innerW} height={zoneY(0) - zoneY(5)} fill="#f1f5f9" opacity="0.4" className="dark:fill-slate-800" />

          {/* Y axis labels */}
          {[0, 5, 10, 15, 20, 27].map(v => (
            <g key={v}>
              <text x={padding - 8} y={zoneY(v) + 4} fontSize="10" fill="currentColor" className="text-slate-500" textAnchor="end">{v}</text>
              <line x1={padding} y1={zoneY(v)} x2={padding + innerW} y2={zoneY(v)} stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
            </g>
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#phq9Grad)" opacity="0.3" />
          <defs>
            <linearGradient id="phq9Grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Points + labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#6366f1" strokeWidth="2.5" />
              <text x={p.x} y={p.y - 12} fontSize="11" fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-slate-900 dark:text-slate-100">
                {p.score}
              </text>
              <text x={p.x} y={h - 8} fontSize="9" textAnchor="middle" fill="currentColor" className="text-slate-500">
                {fmtDate(p.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40">
          <div className="text-slate-500">คะแนนล่าสุด</div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{sorted[sorted.length - 1].PHQ9Score}/27</div>
        </div>
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40">
          <div className="text-slate-500">เฉลี่ย</div>
          <div className="font-bold text-slate-900 dark:text-slate-100">
            {(sorted.reduce((s, r) => s + r.PHQ9Score, 0) / sorted.length).toFixed(1)}
          </div>
        </div>
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40">
          <div className="text-slate-500">สูงสุด</div>
          <div className="font-bold text-red-600">{Math.max(...sorted.map(r => r.PHQ9Score))}</div>
        </div>
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40">
          <div className="text-slate-500">เทรนด์</div>
          <div className="font-bold">
            {sorted[sorted.length - 1].PHQ9Score < sorted[0].PHQ9Score
              ? <span className="text-blue-600">📉 ดีขึ้น</span>
              : sorted[sorted.length - 1].PHQ9Score > sorted[0].PHQ9Score
                ? <span className="text-red-600">📈 แย่ลง</span>
                : <span className="text-slate-600">➡️ คงที่</span>
            }
          </div>
        </div>
      </div>
    </Card>
  );
}
