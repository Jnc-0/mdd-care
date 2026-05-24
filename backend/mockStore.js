/**
 * Mock Store - in-memory data store ใช้เมื่อไม่มี MongoDB
 * สำหรับ demo เท่านั้น - production ต้องใช้ MongoDB Atlas
 */

const now = Date.now();
const ago = (mins) => new Date(now - mins * 60000);
const id = (prefix, n) => `${prefix}_${String(n).padStart(3, '0')}`;

const patients = [
  { _id: id('p', 1), hn: 'HN001', citizenId: '1234567890123',
    fullName: 'นายสมศักดิ์ ทดสอบ', phone: '0812345678',
    caregiverName: 'นางพิมพ์ ทดสอบ', caregiverRelation: 'ภรรยา',
    caregiverPhone: '0823456789', diagnosis: 'MDD', severity: 'moderate',
    redFlags: [], status: 'active', createdAt: ago(60*24*30) },
  { _id: id('p', 2), hn: 'HN002', citizenId: '1234567890124',
    fullName: 'นางสาวรัตนา ใจดี', phone: '0834567890',
    caregiverName: 'นางสายใจ ใจดี', caregiverRelation: 'แม่',
    caregiverPhone: '0845678901', diagnosis: 'BPD', severity: 'severe',
    redFlags: [], status: 'active', createdAt: ago(60*24*20) },
  { _id: id('p', 3), hn: 'HN003', citizenId: '1234567890125',
    fullName: 'นายอภิชาติ มั่นคง', phone: '0856789012',
    caregiverName: 'นางพรทิพย์ มั่นคง', caregiverRelation: 'พี่สาว',
    caregiverPhone: '0867890123', diagnosis: 'PDD', severity: 'mild',
    redFlags: [], status: 'active', createdAt: ago(60*24*10) },
  { _id: id('p', 4), hn: 'HN004', citizenId: '1234567890126',
    fullName: 'นางสมหญิง ดวงดี', phone: '0867891234',
    caregiverName: 'นายอนันต์ ดวงดี', caregiverRelation: 'สามี',
    caregiverPhone: '0878901234', diagnosis: 'SAD', severity: 'moderate',
    redFlags: [], status: 'active', createdAt: ago(60*24*5) }
];

const today = new Date(); today.setHours(0, 0, 0, 0);
const at = (h, m) => { const d = new Date(today); d.setHours(h, m, 0, 0); return d; };

const todayAppointments = [
  { _id: id('a', 1), patient: patients[0], time: '09:00',
    date: at(9, 0), reason: 'ติดตามอาการ', status: 'completed' },
  { _id: id('a', 2), patient: patients[1], time: '10:30',
    date: at(10, 30), reason: 'ปรับยา Methylphenidate', status: 'scheduled' },
  { _id: id('a', 3), patient: patients[3], time: '13:00',
    date: at(13, 0), reason: 'ประเมิน PHQ-9', status: 'scheduled' },
  { _id: id('a', 4), patient: patients[2], time: '15:30',
    date: at(15, 30), reason: 'ตรวจสุขภาพจิตประจำเดือน', status: 'scheduled' }
];

const missedMeds = [
  { _id: id('ml', 1), patient: patients[0],
    medication: { medicationName: 'Fluoxetine', dosage: '20 mg' },
    scheduledTime: ago(120), status: 'missed', smsAlertSent: true },
  { _id: id('ml', 2), patient: patients[1],
    medication: { medicationName: 'Methylphenidate', dosage: '10 mg', isControlled: true },
    scheduledTime: ago(90), status: 'missed', smsAlertSent: true },
  { _id: id('ml', 3), patient: patients[3],
    medication: { medicationName: 'Sertraline', dosage: '50 mg' },
    scheduledTime: ago(75), status: 'missed', smsAlertSent: true }
];

const notifications = [
  { _id: id('n', 1), recipient: '0823456789', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นายสมศักดิ์ ทดสอบ ยังไม่ได้ทานยา "Fluoxetine" ตามเวลา 08:00 น. กรุณาช่วยเตือนและกำกับการทานยาอย่างใกล้ชิด',
    status: 'sent', patient: { fullName: patients[0].fullName, hn: patients[0].hn },
    createdAt: ago(118) },
  { _id: id('n', 2), recipient: '0845678901', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นางสาวรัตนา ใจดี ยังไม่ได้ทานยา "Methylphenidate" ตามเวลา 08:00 น. กรุณาช่วยเตือนและกำกับการทานยาอย่างใกล้ชิด',
    status: 'sent', patient: { fullName: patients[1].fullName, hn: patients[1].hn },
    createdAt: ago(88) },
  { _id: id('n', 3), recipient: '0878901234', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นางสมหญิง ดวงดี ยังไม่ได้ทานยา "Sertraline" ตามเวลา 12:00 น.',
    status: 'sent', patient: { fullName: patients[3].fullName, hn: patients[3].hn },
    createdAt: ago(73) },
  { _id: id('n', 4), recipient: '0867890123', type: 'appointment_reminder',
    message: '📅 รพ.คลองหาด: เตือนนัดหมาย คนไข้นายอภิชาติ มั่นคง มีนัดพรุ่งนี้ เวลา 14:00 น. โปรดมาตามนัด',
    status: 'sent', patient: { fullName: patients[2].fullName, hn: patients[2].hn },
    createdAt: ago(60) }
];

const chatRooms = [
  { _id: patients[0].hn, lastMessage: 'คนไข้ทานข้าวเช้าได้ปกติแล้วค่ะ',
    lastSender: 'นางพิมพ์', lastTime: ago(15), unreadCount: 0 },
  { _id: patients[1].hn, lastMessage: 'ขอบคุณค่ะ จะดูแลใกล้ชิด',
    lastSender: 'นางสายใจ', lastTime: ago(45), unreadCount: 2 },
  { _id: patients[3].hn, lastMessage: '[รูปภาพ ซองยา]',
    lastSender: 'นายอนันต์', lastTime: ago(90), unreadCount: 0 }
];

const chatMessages = {
  [patients[0].hn]: [
    { _id: id('m', 1), room: patients[0].hn, sender: 'พว.มาลี', senderRole: 'nurse',
      message: 'สวัสดีค่ะ วันนี้คุณสมศักดิ์ทานยาเช้าหรือยังคะ?',
      createdAt: ago(60) },
    { _id: id('m', 2), room: patients[0].hn, sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'สวัสดีค่ะพยาบาล ลืมทานยาเช้าค่ะ ตอนนี้พึ่งให้ทานเสร็จ',
      createdAt: ago(45) },
    { _id: id('m', 3), room: patients[0].hn, sender: 'พว.มาลี', senderRole: 'nurse',
      message: 'รับทราบค่ะ คราวหน้าตั้งนาฬิกาปลุก 8 โมงเช้านะคะ\nถ้าลืมเกิน 1 ชั่วโมงจะมีระบบ SMS เตือนค่ะ',
      createdAt: ago(40) },
    { _id: id('m', 4), room: patients[0].hn, sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'ค่ะ จะดูแลใกล้ชิดมากขึ้น',
      createdAt: ago(20) },
    { _id: id('m', 5), room: patients[0].hn, sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'คนไข้ทานข้าวเช้าได้ปกติแล้วค่ะ',
      createdAt: ago(15) }
  ]
};

/* ────────── handlers ────────── */
const handlers = {
  'GET /': () => ({ name: 'MDD Care API (Mock Mode)', status: 'running' }),

  'GET /api/patients': () => patients,
  'GET /api/dashboard/stats': () => ({
    totalPatients: patients.length,
    activeRedFlags: 0,
    todayAppointments: todayAppointments.length,
    missedAppointments: 2,
    missedMedications: missedMeds.length
  }),
  'GET /api/appointments/today': () => todayAppointments,
  'GET /api/appointments':       () => todayAppointments,
  'GET /api/medications/missed': () => missedMeds,
  'GET /api/notifications/recent': () => notifications,
  'GET /api/chat/rooms': () => chatRooms,

  'POST /api/red-flag': (req) => {
    const { patientId, flagType, description } = req.body || {};
    const p = patients.find(x => x._id === patientId) || patients[0];
    const flagLabel = {
      suicidal: 'เสี่ยงฆ่าตัวตาย', hallucination: 'หูแว่ว/หลอน',
      aggressive: 'ก้าวร้าว', 'self-harm': 'ทำร้ายตนเอง'
    }[flagType] || flagType;
    const msg = `🚨 ด่วน! คนไข้ ${p.fullName} (HN:${p.hn}) มีอาการ Red Flag: ${flagLabel} กรุณาเข้าตรวจสอบทันที [รพ.คลองหาด]`;
    notifications.unshift({
      _id: id('n', notifications.length + 1),
      recipient: '0891234567', type: 'red_flag', message: msg, status: 'sent',
      patient: { fullName: p.fullName, hn: p.hn }, createdAt: new Date()
    });
    return {
      body: { success: true, message: 'แจ้งเตือน Red Flag สำเร็จ', smsCount: 2 },
      broadcast: {
        event: 'red-flag-alert',
        data: {
          patient: { id: p._id, hn: p.hn, fullName: p.fullName },
          flagType, flagLabel, description, timestamp: new Date(),
          priority: 'CRITICAL'
        }
      }
    };
  },

  'POST /api/check-refill': (req) => {
    const { patientId, medicationName } = req.body || {};
    const p = patients.find(x => x._id === patientId) || patients[0];
    const isControlled = /methylphenidate|alprazolam|diazepam/i.test(medicationName || '');
    if (isControlled) {
      return {
        body: {
          allowRefill: false, smsSent: true, recentCount: 3,
          warning: `⚠️ ตรวจพบการรับยา "${medicationName}" จำนวน 3 ครั้ง ในช่วง 30 วันที่ผ่านมา อาจเป็นการเวียนรับยาซ้ำซ้อน - เสี่ยง Overdose`,
          patient: { hn: p.hn, fullName: p.fullName }
        }
      };
    }
    return {
      body: {
        allowRefill: true, smsSent: false, recentCount: 1,
        warning: null,
        patient: { hn: p.hn, fullName: p.fullName }
      }
    };
  },

  'POST /api/trigger/medication-check': () => ({
    body: { checked: 3, smsSent: 3 }
  }),

  'POST /api/seed': () => ({
    body: { success: true, message: 'Mock data ใช้งานอยู่แล้ว',
            stats: { users: 2, patients: patients.length, meds: 4 } }
  })
};

const matchDynamic = (req) => {
  const m = req.path.match(/^\/api\/chat\/([^/]+)$/);
  if (m && req.method === 'GET' && m[1] !== 'rooms') {
    return () => chatMessages[m[1]] || [];
  }
  const p = req.path.match(/^\/api\/patients\/([^/]+)$/);
  if (p && req.method === 'GET') {
    return () => patients.find(x => x._id === p[1]) || patients[0];
  }
  return null;
};

module.exports = { handlers, matchDynamic, patients, chatMessages };
