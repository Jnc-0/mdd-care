'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const DIAG_LABELS = {
  MDD: 'ซึมเศร้า', BPD: 'ไบโพลาร์', PDD: 'ซึมเศร้าเรื้อรัง',
  SAD: 'วิตกกังวล', OCD: 'OCD', PTSD: 'PTSD', OTHER: 'อื่น ๆ'
};

const SEVERITY_STYLE = {
  mild:     'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  moderate: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  severe:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
};

const SEVERITY_LABEL = {
  mild: 'น้อย', moderate: 'ปานกลาง', severe: 'รุนแรง', critical: 'วิกฤต'
};

export default function PatientsListPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDiag, setFilterDiag] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/patients`).then(r => r.json()).then(d => {
      setPatients(d); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const matchSearch = !search ||
        p.fullName?.includes(search) || p.hn?.toLowerCase().includes(search.toLowerCase()) ||
        p.citizenId?.includes(search);
      const matchDiag = filterDiag === 'all' || p.diagnosis === filterDiag;
      const matchSev  = filterSeverity === 'all' || p.severity === filterSeverity;
      return matchSearch && matchDiag && matchSev;
    });
  }, [patients, search, filterDiag, filterSeverity]);

  return (
    <AppShell title="รายชื่อคนไข้ทั้งหมด">
      {/* ───── Controls ───── */}
      <div className="mb-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-1 gap-2 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา ชื่อ / HN / เลขบัตรประชาชน..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterDiag}
            onChange={e => setFilterDiag(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          >
            <option value="all">ทุกการวินิจฉัย</option>
            {Object.entries(DIAG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          >
            <option value="all">ทุกระดับ</option>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 text-white font-medium text-sm whitespace-nowrap"
          >
            + เพิ่มคนไข้ใหม่
          </button>
        </div>
      </div>

      {/* ───── Stats Strip ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <MiniStat label="ทั้งหมด" value={patients.length} accent="indigo" />
        <MiniStat label="MDD ซึมเศร้า" value={patients.filter(p => p.diagnosis === 'MDD').length} accent="blue" />
        <MiniStat label="วิกฤต/Red Flag" value={patients.filter(p => p.severity === 'critical' || p.redFlags?.some(f => !f.resolved)).length} accent="red" />
        <MiniStat label="รุนแรง" value={patients.filter(p => p.severity === 'severe').length} accent="amber" />
      </div>

      {/* ───── Table ───── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">HN</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อ-สกุล</th>
                <th className="px-4 py-3 text-left font-semibold">อายุ/เพศ</th>
                <th className="px-4 py-3 text-left font-semibold">วินิจฉัย</th>
                <th className="px-4 py-3 text-left font-semibold">ระดับ</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้ดูแล</th>
                <th className="px-4 py-3 text-left font-semibold">เบอร์ติดต่อ</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">ไม่พบคนไข้ที่ค้นหา</td></tr>
              ) : filtered.map(p => {
                const hasRedFlag = p.redFlags?.some(f => !f.resolved);
                return (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{p.hn}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {p.fullName}
                        {hasRedFlag && <span title="Red Flag active" className="text-red-500">🚨</span>}
                      </div>
                      <div className="text-xs text-slate-500">{p.occupation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {p.age}/{p.gender === 'male' ? 'ช' : p.gender === 'female' ? 'ญ' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {DIAG_LABELS[p.diagnosis] || p.diagnosis}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLE[p.severity]}`}>
                        {SEVERITY_LABEL[p.severity]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 dark:text-slate-300">{p.caregiverName}</div>
                      <div className="text-xs text-slate-500">{p.caregiverRelation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      📞 {p.caregiverPhone || p.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {p.status === 'active' ? 'รักษาอยู่' : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/patients/${p.hn}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-medium"
                      >
                        ดูข้อมูล →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
          แสดง {filtered.length} จาก {patients.length} คนไข้
        </div>
      </div>

      {/* ───── Add Modal ───── */}
      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onAdded={(p) => { setPatients(prev => [p, ...prev]); setShowAdd(false); }} />}
    </AppShell>
  );
}

function MiniStat({ label, value, accent }) {
  const colors = {
    indigo: 'border-indigo-200 dark:border-indigo-800',
    blue:   'border-blue-200 dark:border-blue-800',
    red:    'border-red-200 dark:border-red-800',
    amber:  'border-amber-200 dark:border-amber-800'
  };
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 ${colors[accent]} px-4 py-3 shadow-sm`}>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</div>
    </div>
  );
}

function AddPatientModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    hn: '', citizenId: '', fullName: '', gender: 'male', dob: '', age: '',
    phone: '', caregiverName: '', caregiverRelation: '', caregiverPhone: '',
    diagnosis: 'MDD', severity: 'mild', occupation: '', address: ''
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data._id || data.success) {
        onAdded(data._id ? data : data.body || data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">เพิ่มคนไข้ใหม่</h3>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="HN *">
              <input required value={form.hn} onChange={e => setForm({...form, hn: e.target.value})} className="input-style" placeholder="HN007" />
            </Field>
            <Field label="เลขบัตรประชาชน *">
              <input required value={form.citizenId} onChange={e => setForm({...form, citizenId: e.target.value})} className="input-style" placeholder="13 หลัก" />
            </Field>
            <Field label="ชื่อ-สกุล *" full>
              <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="input-style" placeholder="นายสมชาย ใจดี" />
            </Field>
            <Field label="เพศ">
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="input-style">
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่น ๆ</option>
              </select>
            </Field>
            <Field label="อายุ">
              <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="input-style" placeholder="35" />
            </Field>
            <Field label="อาชีพ">
              <input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} className="input-style" />
            </Field>
            <Field label="เบอร์โทรคนไข้">
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-style" placeholder="08x-xxx-xxxx" />
            </Field>
            <Field label="ที่อยู่" full>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-style" />
            </Field>

            <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">ผู้ดูแล (สำหรับ SMS)</div>
            </div>
            <Field label="ชื่อผู้ดูแล *">
              <input required value={form.caregiverName} onChange={e => setForm({...form, caregiverName: e.target.value})} className="input-style" />
            </Field>
            <Field label="ความสัมพันธ์">
              <input value={form.caregiverRelation} onChange={e => setForm({...form, caregiverRelation: e.target.value})} className="input-style" placeholder="ภรรยา/สามี/ลูก" />
            </Field>
            <Field label="เบอร์ผู้ดูแล *" full>
              <input required value={form.caregiverPhone} onChange={e => setForm({...form, caregiverPhone: e.target.value})} className="input-style" placeholder="08x-xxx-xxxx" />
            </Field>

            <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">การวินิจฉัย</div>
            </div>
            <Field label="โรค">
              <select value={form.diagnosis} onChange={e => setForm({...form, diagnosis: e.target.value})} className="input-style">
                {Object.entries(DIAG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="ระดับความรุนแรง">
              <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} className="input-style">
                {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className="flex-[2] px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .input-style {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            background-color: rgb(248 250 252);
            border: 1px solid rgb(203 213 225);
            color: rgb(15 23 42);
            font-size: 0.875rem;
          }
          :global(.dark) .input-style {
            background-color: rgb(15 23 42);
            border-color: rgb(71 85 105);
            color: rgb(241 245 249);
          }
          .input-style:focus {
            outline: none;
            border-color: rgb(99 102 241);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
