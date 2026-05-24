'use client';

/**
 * Visit/Encounter Form - บันทึกการตรวจ (SOAP + PHQ-9 + Rx)
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function NewVisitPageWrapper() {
  return (
    <Suspense fallback={<AppShell title="กำลังโหลด..."><div className="text-center py-20 text-slate-400">⏳</div></AppShell>}>
      <NewVisitPage />
    </Suspense>
  );
}

const PHQ9_QUESTIONS = [
  'รู้สึกหดหู่ ซึมเศร้า หรือสิ้นหวัง',
  'เบื่อหน่าย ไม่สนใจในสิ่งที่ชอบ',
  'นอนไม่หลับ หรือนอนมากเกินไป',
  'รู้สึกเหนื่อย ไม่มีแรง',
  'เบื่ออาหาร หรือกินมากเกินไป',
  'รู้สึกแย่กับตัวเอง รู้สึกผิดหวัง หรือล้มเหลว',
  'ไม่มีสมาธิ ทำอะไรไม่ค่อยได้ดี',
  'พูด/เคลื่อนไหวช้า หรือกระวนกระวายมากผิดปกติ',
  'คิดอยากตาย หรือคิดทำร้ายตัวเอง'
];

function NewVisitPage() {
  const router = useRouter();
  const search = useSearchParams();
  const preselectedHN = search?.get('patient');

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState(null);

  // PHQ-9 scores (0-3 per question, 9 questions, max 27)
  const [phq, setPhq] = useState(Array(9).fill(0));

  const [symptoms,  setSymptoms]  = useState('');
  const [objective, setObjective] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes,     setNotes]     = useState('');
  const [nextDate,  setNextDate]  = useState('');
  const [rxList,    setRxList]    = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/patients`).then(r => r.json()).then(d => {
      setPatients(d);
      if (preselectedHN) {
        const p = d.find(x => x.hn === preselectedHN);
        if (p) { setPatientId(p._id); setPatient(p); }
      }
    });
  }, [preselectedHN]);

  useEffect(() => {
    const p = patients.find(x => x._id === patientId);
    setPatient(p || null);
    if (p) setDiagnosis(p.diagnosis);
  }, [patientId, patients]);

  const totalPHQ = phq.reduce((s, v) => s + v, 0);
  const riskLevel = totalPHQ >= 20 ? 'critical' : totalPHQ >= 15 ? 'high' : totalPHQ >= 10 ? 'moderate' : 'low';
  const riskColor = totalPHQ >= 20 ? 'red' : totalPHQ >= 15 ? 'amber' : totalPHQ >= 10 ? 'indigo' : 'blue';
  const riskLabel = totalPHQ >= 20 ? 'รุนแรง' : totalPHQ >= 15 ? 'ปานกลางถึงรุนแรง' : totalPHQ >= 10 ? 'ปานกลาง' : totalPHQ >= 5 ? 'น้อย' : 'ปกติ';

  const setPhqAt = (i, v) => {
    const next = [...phq]; next[i] = v; setPhq(next);
  };

  const addRx = () => {
    setRxList([...rxList, { name: '', dosage: '', frequency: '', duration: '' }]);
  };
  const updateRx = (i, field, val) => {
    const next = [...rxList]; next[i][field] = val; setRxList(next);
  };
  const removeRx = (i) => setRxList(rxList.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!patientId) return alert('กรุณาเลือกคนไข้');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          symptoms,
          diagnosis,
          treatment: treatment + (rxList.length ? '\n\nใบสั่งยา:\n' + rxList.map(r => `${r.name} ${r.dosage} ${r.frequency} ${r.duration}`).join('\n') : ''),
          PHQ9Score: totalPHQ,
          notes,
          nextAppointment: nextDate
        })
      });
      const data = await res.json();
      if (data.success || data.body?.success) {
        setSaved(true);
        setTimeout(() => router.push(`/patients/${patient.hn}`), 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="บันทึกการตรวจรักษา (Visit Record)">
      {saved && (
        <div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-center font-medium">
          ✅ บันทึกสำเร็จ — กำลังพากลับหน้าคนไข้...
        </div>
      )}

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Patient Selection */}
          <Section title="🔍 เลือกคนไข้">
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="input-style"
              required
            >
              <option value="">-- เลือกคนไข้ --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.hn} - {p.fullName} ({p.age} ปี, {p.diagnosis})
                </option>
              ))}
            </select>
          </Section>

          {/* SOAP - Subjective */}
          <Section title="📝 S — Subjective (อาการที่คนไข้บอก)">
            <textarea
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              rows={3}
              placeholder="คนไข้บอกว่า... รู้สึก... ตั้งแต่..."
              className="input-style"
            />
          </Section>

          {/* SOAP - Objective */}
          <Section title="👁️ O — Objective (สิ่งที่ตรวจพบ)">
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              rows={3}
              placeholder="Vital signs, mental status exam, behavior observations..."
              className="input-style"
            />
          </Section>

          {/* PHQ-9 */}
          <Section title="📊 PHQ-9 — แบบประเมินภาวะซึมเศร้า">
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                ในช่วง 2 สัปดาห์ที่ผ่านมา รวมทั้งวันนี้ คนไข้มีอาการเหล่านี้บ่อยแค่ไหน?
              </div>
              {PHQ9_QUESTIONS.map((q, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-900 dark:text-slate-100 mb-2">
                    {i + 1}. {q}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { v: 0, label: 'ไม่เลย' },
                      { v: 1, label: 'หลายวัน' },
                      { v: 2, label: 'เกือบทุกวัน' },
                      { v: 3, label: 'ทุกวัน' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setPhqAt(i, opt.v)}
                        className={`flex-1 text-xs px-2 py-1.5 rounded border transition ${
                          phq[i] === opt.v
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {opt.v} - {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* SOAP - Assessment */}
          <Section title="🩺 A — Assessment (วินิจฉัย)">
            <input
              type="text"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="เช่น MDD recurrent moderate"
              className="input-style"
            />
          </Section>

          {/* SOAP - Plan */}
          <Section title="📋 P — Plan (แผนการรักษา)">
            <textarea
              value={treatment}
              onChange={e => setTreatment(e.target.value)}
              rows={3}
              placeholder="แผนการรักษา CBT, การปรับยา, แนะนำผู้ป่วย..."
              className="input-style"
            />
          </Section>

          {/* Rx */}
          <Section title="💊 ใบสั่งยา (Rx)">
            <div className="space-y-2">
              {rxList.length === 0 && (
                <div className="text-center py-4 text-sm text-slate-400">ยังไม่มีรายการยา</div>
              )}
              {rxList.map((rx, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="ชื่อยา"
                    value={rx.name}
                    onChange={e => updateRx(i, 'name', e.target.value)}
                    className="input-style col-span-4"
                  />
                  <input
                    placeholder="ขนาด เช่น 20mg"
                    value={rx.dosage}
                    onChange={e => updateRx(i, 'dosage', e.target.value)}
                    className="input-style col-span-2"
                  />
                  <input
                    placeholder="วิธีทาน"
                    value={rx.frequency}
                    onChange={e => updateRx(i, 'frequency', e.target.value)}
                    className="input-style col-span-3"
                  />
                  <input
                    placeholder="ระยะเวลา"
                    value={rx.duration}
                    onChange={e => updateRx(i, 'duration', e.target.value)}
                    className="input-style col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeRx(i)}
                    className="col-span-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded p-1"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRx}
                className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >+ เพิ่มรายการยา</button>
            </div>
          </Section>

          {/* Notes + Next */}
          <Section title="📌 หมายเหตุเพิ่มเติม">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="ข้อสังเกตเพิ่มเติม..."
              className="input-style mb-3"
            />
            <div className="flex gap-3 items-center">
              <label className="text-sm text-slate-600 dark:text-slate-400">นัดครั้งหน้า:</label>
              <input
                type="date"
                value={nextDate}
                onChange={e => setNextDate(e.target.value)}
                className="input-style flex-1"
              />
            </div>
          </Section>
        </div>

        {/* Sticky Summary */}
        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          {patient && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">คนไข้</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{patient.fullName}</div>
              <div className="text-xs text-slate-500 mt-1">
                HN: {patient.hn} · {patient.age} ปี · {patient.diagnosis}
              </div>
              {patient.allergies && patient.allergies !== 'NKDA' && (
                <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ แพ้: {patient.allergies}
                </div>
              )}
            </div>
          )}

          <div className={`rounded-2xl p-5 border shadow-sm bg-${riskColor}-50 dark:bg-${riskColor}-950/40 border-${riskColor}-200 dark:border-${riskColor}-800`}
               style={{
                 background: totalPHQ >= 20 ? '#fef2f2' : totalPHQ >= 15 ? '#fffbeb' : totalPHQ >= 10 ? '#eef2ff' : '#eff6ff'
               }}>
            <div className="text-xs uppercase tracking-wider mb-1 text-slate-700">PHQ-9 รวม</div>
            <div className={`text-5xl font-bold ${
              totalPHQ >= 20 ? 'text-red-600' :
              totalPHQ >= 15 ? 'text-amber-600' :
              totalPHQ >= 10 ? 'text-indigo-600' :
                               'text-blue-600'
            }`}>
              {totalPHQ}<span className="text-xl text-slate-400">/27</span>
            </div>
            <div className="text-sm font-medium mt-1 text-slate-700">
              ระดับ: {riskLabel}
            </div>
            {totalPHQ >= 15 && (
              <div className="mt-3 text-xs text-red-700 bg-red-100 p-2 rounded">
                ⚠️ ควรพิจารณาให้ความช่วยเหลือทันที โดยเฉพาะข้อ 9 (ความคิดอยากตาย)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !patientId}
            className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium shadow-sm"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตรวจ'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            ยกเลิก
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.input-style) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background-color: rgb(248 250 252);
          border: 1px solid rgb(203 213 225);
          color: rgb(15 23 42);
          font-size: 0.875rem;
        }
        :global(.dark .input-style) {
          background-color: rgb(15 23 42);
          border-color: rgb(71 85 105);
          color: rgb(241 245 249);
        }
        :global(.input-style:focus) {
          outline: none;
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
      {children}
    </div>
  );
}
