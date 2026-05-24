/**
 * Mock Store - in-memory data store ใช้เมื่อไม่มี MongoDB
 * ขยายให้รองรับ OPD workflow เต็มรูปแบบ
 */

const now = Date.now();
const ago = (mins) => new Date(now - mins * 60000);
const daysAgo = (d) => new Date(now - d * 86400000);
const id = (prefix, n) => `${prefix}_${String(n).padStart(3, '0')}`;

/* ────────── PATIENTS (เพิ่มข้อมูลละเอียด) ────────── */
const patients = [
  { _id: id('p', 1), hn: 'HN001', citizenId: '1234567890123',
    fullName: 'นายสมศักดิ์ ทดสอบ', gender: 'male',
    dob: '1985-05-12', age: 41, bloodType: 'O+',
    occupation: 'พนักงานบริษัท', address: '123 ม.4 ต.คลองหาด อ.คลองหาด จ.สระแก้ว',
    phone: '0812345678',
    caregiverName: 'นางพิมพ์ ทดสอบ', caregiverRelation: 'ภรรยา', caregiverPhone: '0823456789',
    diagnosis: 'MDD', diagnosisNote: 'Major Depressive Disorder, recurrent moderate',
    allergies: 'NKDA',
    severity: 'moderate', status: 'active',
    redFlags: [],
    registeredAt: daysAgo(180), createdAt: daysAgo(180) },

  { _id: id('p', 2), hn: 'HN002', citizenId: '1234567890124',
    fullName: 'นางสาวรัตนา ใจดี', gender: 'female',
    dob: '1992-08-20', age: 33, bloodType: 'A+',
    occupation: 'ครู', address: '45 ม.2 ต.เบญจขร อ.คลองหาด จ.สระแก้ว',
    phone: '0834567890',
    caregiverName: 'นางสายใจ ใจดี', caregiverRelation: 'แม่', caregiverPhone: '0845678901',
    diagnosis: 'BPD', diagnosisNote: 'Bipolar I, currently manic episode',
    allergies: 'Lithium - mild tremor',
    severity: 'severe', status: 'active',
    redFlags: [{ flagType: 'aggressive', description: 'พฤติกรรมก้าวร้าวเมื่อหยุดยา', notedAt: daysAgo(7), resolved: false }],
    registeredAt: daysAgo(365), createdAt: daysAgo(365) },

  { _id: id('p', 3), hn: 'HN003', citizenId: '1234567890125',
    fullName: 'นายอภิชาติ มั่นคง', gender: 'male',
    dob: '1978-11-03', age: 47, bloodType: 'B+',
    occupation: 'เกษตรกร', address: '78 ม.7 ต.ไทรเดี่ยว อ.คลองหาด จ.สระแก้ว',
    phone: '0856789012',
    caregiverName: 'นางพรทิพย์ มั่นคง', caregiverRelation: 'พี่สาว', caregiverPhone: '0867890123',
    diagnosis: 'PDD', diagnosisNote: 'Persistent Depressive Disorder',
    allergies: 'Penicillin',
    severity: 'mild', status: 'active',
    redFlags: [],
    registeredAt: daysAgo(720), createdAt: daysAgo(720) },

  { _id: id('p', 4), hn: 'HN004', citizenId: '1234567890126',
    fullName: 'นางสมหญิง ดวงดี', gender: 'female',
    dob: '1968-03-15', age: 57, bloodType: 'AB+',
    occupation: 'แม่บ้าน', address: '12 ม.1 ต.คลองไก่เถื่อน อ.คลองหาด',
    phone: '0867891234',
    caregiverName: 'นายอนันต์ ดวงดี', caregiverRelation: 'สามี', caregiverPhone: '0878901234',
    diagnosis: 'SAD', diagnosisNote: 'Social Anxiety Disorder + Mild depression',
    allergies: 'NKDA',
    severity: 'moderate', status: 'active',
    redFlags: [],
    registeredAt: daysAgo(120), createdAt: daysAgo(120) },

  { _id: id('p', 5), hn: 'HN005', citizenId: '1234567890127',
    fullName: 'นายวิชัย เข้มแข็ง', gender: 'male',
    dob: '1995-12-28', age: 30, bloodType: 'O-',
    occupation: 'พนักงานโรงงาน', address: '99 ม.3 ต.คลองหาด',
    phone: '0891234567',
    caregiverName: 'นางสุนี เข้มแข็ง', caregiverRelation: 'แม่', caregiverPhone: '0892345678',
    diagnosis: 'PTSD', diagnosisNote: 'PTSD จากอุบัติเหตุทางรถยนต์',
    allergies: 'NKDA',
    severity: 'severe', status: 'active',
    redFlags: [],
    registeredAt: daysAgo(60), createdAt: daysAgo(60) },

  { _id: id('p', 6), hn: 'HN006', citizenId: '1234567890128',
    fullName: 'นางสาวมาลี ศรีสุข', gender: 'female',
    dob: '1990-06-08', age: 35, bloodType: 'A-',
    occupation: 'พยาบาล', address: '5 ถ.สุขุมวิท อ.คลองหาด',
    phone: '0801234567',
    caregiverName: 'นายสมพร ศรีสุข', caregiverRelation: 'พ่อ', caregiverPhone: '0802345678',
    diagnosis: 'OCD', diagnosisNote: 'OCD - checking compulsion',
    allergies: 'NKDA',
    severity: 'mild', status: 'active',
    redFlags: [],
    registeredAt: daysAgo(90), createdAt: daysAgo(90) }
];

/* ────────── DOCTORS ────────── */
const doctors = [
  { _id: 'd_001', fullName: 'นพ.สมชาย ใจดี', role: 'doctor', phone: '0891234567', onDuty: true },
  { _id: 'd_002', fullName: 'พญ.พิมพ์ใจ รักษ์ดี', role: 'doctor', phone: '0892345678', onDuty: true },
  { _id: 'd_003', fullName: 'พว.มาลี สดใส', role: 'nurse', phone: '0817654321', onDuty: true }
];

/* ────────── APPOINTMENTS (วันนี้ + อดีต + อนาคต) ────────── */
const today = new Date(); today.setHours(0, 0, 0, 0);
const at = (h, m, dayOffset = 0) => { const d = new Date(today); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d; };

const appointments = [
  // วันนี้
  { _id: id('a', 1), patient: patients[0], doctor: doctors[0], time: '09:00', date: at(9, 0),
    reason: 'ติดตามอาการ', status: 'completed', queuePosition: 1 },
  { _id: id('a', 2), patient: patients[1], doctor: doctors[0], time: '09:30', date: at(9, 30),
    reason: 'ปรับยา Methylphenidate + ประเมิน Red Flag', status: 'in-progress', queuePosition: 2 },
  { _id: id('a', 3), patient: patients[4], doctor: doctors[1], time: '10:00', date: at(10, 0),
    reason: 'PTSD session + ปรับยา', status: 'waiting', queuePosition: 3 },
  { _id: id('a', 4), patient: patients[3], doctor: doctors[0], time: '10:30', date: at(10, 30),
    reason: 'ประเมิน PHQ-9', status: 'waiting', queuePosition: 4 },
  { _id: id('a', 5), patient: patients[2], doctor: doctors[1], time: '13:00', date: at(13, 0),
    reason: 'ตรวจสุขภาพจิตประจำเดือน', status: 'scheduled', queuePosition: 5 },
  { _id: id('a', 6), patient: patients[5], doctor: doctors[0], time: '14:00', date: at(14, 0),
    reason: 'OCD counselling', status: 'scheduled', queuePosition: 6 },

  // พรุ่งนี้
  { _id: id('a', 7), patient: patients[0], doctor: doctors[0], time: '10:00', date: at(10, 0, 1),
    reason: 'ติดตาม 1 สัปดาห์', status: 'scheduled' },
  { _id: id('a', 8), patient: patients[1], doctor: doctors[0], time: '11:00', date: at(11, 0, 1),
    reason: 'นัดติดตามด่วน หลัง Red Flag', status: 'scheduled' },

  // อดีต (สำหรับประวัติ)
  ...patients.flatMap((p, i) => [
    { _id: id('a', 100 + i*3), patient: p, doctor: doctors[0], time: '09:00', date: daysAgo(7 + i),
      reason: 'ติดตามอาการ', status: 'completed' },
    { _id: id('a', 101 + i*3), patient: p, doctor: doctors[0], time: '10:30', date: daysAgo(14 + i),
      reason: 'ตรวจครั้งก่อน', status: 'completed' },
    { _id: id('a', 102 + i*3), patient: p, doctor: doctors[1], time: '14:00', date: daysAgo(30 + i*2),
      reason: 'ตรวจประจำเดือน', status: 'completed' }
  ])
];

/* ────────── MEDICATIONS ────────── */
const medications = [
  { _id: id('m', 1), patient: patients[0]._id, patientName: patients[0].fullName,
    medicationName: 'Fluoxetine', dosage: '20 mg', isControlled: false,
    frequency: 'วันละ 1 ครั้ง เช้า', timesPerDay: 1, scheduledTimes: ['08:00'],
    startDate: daysAgo(120), totalPills: 30, remainingPills: 12,
    prescribedBy: doctors[0]._id, active: true },

  { _id: id('m', 2), patient: patients[1]._id, patientName: patients[1].fullName,
    medicationName: 'Methylphenidate', dosage: '10 mg', isControlled: true,
    frequency: 'วันละ 2 ครั้ง', timesPerDay: 2, scheduledTimes: ['08:00', '13:00'],
    startDate: daysAgo(90), totalPills: 60, remainingPills: 18,
    prescribedBy: doctors[0]._id, active: true },

  { _id: id('m', 3), patient: patients[1]._id, patientName: patients[1].fullName,
    medicationName: 'Lithium Carbonate', dosage: '300 mg', isControlled: false,
    frequency: 'วันละ 2 ครั้ง', timesPerDay: 2, scheduledTimes: ['08:00', '20:00'],
    startDate: daysAgo(60), totalPills: 60, remainingPills: 30,
    prescribedBy: doctors[0]._id, active: true },

  { _id: id('m', 4), patient: patients[2]._id, patientName: patients[2].fullName,
    medicationName: 'Sertraline', dosage: '50 mg', isControlled: false,
    frequency: 'วันละ 1 ครั้ง เย็น', timesPerDay: 1, scheduledTimes: ['18:00'],
    startDate: daysAgo(200), totalPills: 30, remainingPills: 5,
    prescribedBy: doctors[1]._id, active: true },

  { _id: id('m', 5), patient: patients[3]._id, patientName: patients[3].fullName,
    medicationName: 'Escitalopram', dosage: '10 mg', isControlled: false,
    frequency: 'วันละ 1 ครั้ง', timesPerDay: 1, scheduledTimes: ['08:00'],
    startDate: daysAgo(60), totalPills: 30, remainingPills: 22,
    prescribedBy: doctors[0]._id, active: true },

  { _id: id('m', 6), patient: patients[4]._id, patientName: patients[4].fullName,
    medicationName: 'Prazosin', dosage: '2 mg', isControlled: false,
    frequency: 'ก่อนนอน', timesPerDay: 1, scheduledTimes: ['22:00'],
    startDate: daysAgo(30), totalPills: 30, remainingPills: 18,
    prescribedBy: doctors[1]._id, active: true },

  { _id: id('m', 7), patient: patients[4]._id, patientName: patients[4].fullName,
    medicationName: 'Alprazolam', dosage: '0.5 mg', isControlled: true,
    frequency: 'เมื่อมีอาการ', timesPerDay: 1, scheduledTimes: ['PRN'],
    startDate: daysAgo(30), totalPills: 14, remainingPills: 9,
    prescribedBy: doctors[1]._id, active: true },

  { _id: id('m', 8), patient: patients[5]._id, patientName: patients[5].fullName,
    medicationName: 'Fluvoxamine', dosage: '100 mg', isControlled: false,
    frequency: 'วันละ 1 ครั้ง', timesPerDay: 1, scheduledTimes: ['08:00'],
    startDate: daysAgo(45), totalPills: 30, remainingPills: 12,
    prescribedBy: doctors[0]._id, active: true }
];

/* ────────── MISSED MEDICATIONS LOG (วันนี้) ────────── */
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

/* ────────── VISIT RECORDS (ประวัติการรักษา + PHQ-9 trend) ────────── */
// สร้าง record ของ visit ในอดีต พร้อมคะแนน PHQ-9 ที่เปลี่ยนแปลง (แสดง trend)
const records = [];
patients.forEach((p, pIdx) => {
  // 6 visits ในอดีต - แสดง trend คะแนน
  const trends = {
    'p_001': [18, 16, 14, 13, 12, 10], // ดีขึ้น
    'p_002': [12, 14, 16, 18, 20, 22], // แย่ลง (Bipolar manic)
    'p_003': [8, 9, 8, 7, 8, 9],       // คงที่
    'p_004': [15, 14, 13, 12, 11, 10], // ดีขึ้น
    'p_005': [22, 20, 19, 17, 16, 15], // ดีขึ้นช้า ๆ
    'p_006': [10, 9, 8, 7, 7, 6]       // ดีขึ้น
  };
  const scores = trends[p._id] || [12, 11, 10, 9, 8, 7];

  scores.forEach((score, i) => {
    const visitDate = daysAgo(180 - i * 30);
    records.push({
      _id: id('r', records.length + 1),
      patient: p._id, patientName: p.fullName, patientHN: p.hn,
      doctor: doctors[i % 2]._id, doctorName: doctors[i % 2].fullName,
      visitDate,
      symptoms: i < scores.length - 1
        ? 'นอนไม่หลับ, เบื่ออาหาร, ขาดสมาธิ'
        : 'อาการดีขึ้น, นอนหลับเต็มอิ่ม',
      diagnosis: p.diagnosis,
      treatment: `ต่อเนื่องการรักษา + ปรับขนาดยา`,
      PHQ9Score: score,
      riskAssessment: score >= 20 ? 'critical' : score >= 15 ? 'high' : score >= 10 ? 'moderate' : 'low',
      notes: i === 0 ? 'เริ่มการรักษา - ประเมินครั้งแรก' : `ตามนัด ครั้งที่ ${i + 1}`,
      nextAppointment: daysAgo(180 - (i + 1) * 30)
    });
  });
});

/* ────────── NOTIFICATIONS / SMS LOG ────────── */
const notifications = [
  { _id: id('n', 1), recipient: '0823456789', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นายสมศักดิ์ ทดสอบ ยังไม่ได้ทานยา "Fluoxetine" ตามเวลา 08:00 น.',
    status: 'sent', patient: { fullName: patients[0].fullName, hn: patients[0].hn }, createdAt: ago(118) },
  { _id: id('n', 2), recipient: '0845678901', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นางสาวรัตนา ใจดี ยังไม่ได้ทานยา "Methylphenidate" ตามเวลา 08:00 น.',
    status: 'sent', patient: { fullName: patients[1].fullName, hn: patients[1].hn }, createdAt: ago(88) },
  { _id: id('n', 3), recipient: '0878901234', type: 'medication_miss',
    message: '🔔 รพ.คลองหาด: คนไข้นางสมหญิง ดวงดี ยังไม่ได้ทานยา "Sertraline"',
    status: 'sent', patient: { fullName: patients[3].fullName, hn: patients[3].hn }, createdAt: ago(73) },
  { _id: id('n', 4), recipient: '0867890123', type: 'appointment_reminder',
    message: '📅 รพ.คลองหาด: เตือนนัดหมาย คนไข้นายอภิชาติ มั่นคง มีนัดพรุ่งนี้ เวลา 13:00 น.',
    status: 'sent', patient: { fullName: patients[2].fullName, hn: patients[2].hn }, createdAt: ago(60) },
  { _id: id('n', 5), recipient: '0892345678', type: 'red_flag',
    message: '🚨 ด่วน! คนไข้นางสาวรัตนา ใจดี (HN:HN002) มีอาการ Red Flag: ก้าวร้าว',
    status: 'sent', patient: { fullName: patients[1].fullName, hn: patients[1].hn }, createdAt: ago(45) }
];

/* ────────── CHAT ────────── */
const chatRooms = [
  { _id: 'HN001', lastMessage: 'คนไข้ทานข้าวเช้าได้ปกติแล้วค่ะ',
    lastSender: 'นางพิมพ์', lastTime: ago(15), unreadCount: 0 },
  { _id: 'HN002', lastMessage: 'ขอบคุณค่ะ จะดูแลใกล้ชิด',
    lastSender: 'นางสายใจ', lastTime: ago(45), unreadCount: 2 },
  { _id: 'HN004', lastMessage: '[รูปภาพ ซองยา]',
    lastSender: 'นายอนันต์', lastTime: ago(90), unreadCount: 0 }
];

const chatMessages = {
  'HN001': [
    { _id: id('m', 1), room: 'HN001', sender: 'พว.มาลี', senderRole: 'nurse',
      message: 'สวัสดีค่ะ วันนี้คุณสมศักดิ์ทานยาเช้าหรือยังคะ?', createdAt: ago(60) },
    { _id: id('m', 2), room: 'HN001', sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'สวัสดีค่ะพยาบาล ลืมทานยาเช้าค่ะ ตอนนี้พึ่งให้ทานเสร็จ', createdAt: ago(45) },
    { _id: id('m', 3), room: 'HN001', sender: 'พว.มาลี', senderRole: 'nurse',
      message: 'รับทราบค่ะ คราวหน้าตั้งนาฬิกาปลุก 8 โมงเช้านะคะ', createdAt: ago(40) },
    { _id: id('m', 4), room: 'HN001', sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'ค่ะ จะดูแลใกล้ชิดมากขึ้น', createdAt: ago(20) },
    { _id: id('m', 5), room: 'HN001', sender: 'นางพิมพ์', senderRole: 'caregiver',
      message: 'คนไข้ทานข้าวเช้าได้ปกติแล้วค่ะ', createdAt: ago(15) }
  ]
};

/* ────────── HANDLERS ────────── */
const todayApptList = appointments.filter(a => {
  const d = new Date(a.date); d.setHours(0, 0, 0, 0);
  return d.getTime() === today.getTime();
});

const handlers = {
  'GET /': () => ({ name: 'MDD Care API (Mock Mode)', status: 'running', mode: 'mock' }),

  'GET /api/patients': () => patients,
  'GET /api/doctors':  () => doctors,
  'GET /api/dashboard/stats': () => ({
    totalPatients: patients.length,
    activeRedFlags: patients.filter(p => p.redFlags.some(f => !f.resolved)).length,
    todayAppointments: todayApptList.length,
    todayWaiting: todayApptList.filter(a => a.status === 'waiting').length,
    todayInProgress: todayApptList.filter(a => a.status === 'in-progress').length,
    todayCompleted: todayApptList.filter(a => a.status === 'completed').length,
    missedAppointments: 2,
    missedMedications: missedMeds.length,
    controlledMeds: medications.filter(m => m.isControlled).length,
    lowStockMeds: medications.filter(m => m.remainingPills <= 10).length
  }),

  'GET /api/appointments': () => appointments,
  'GET /api/appointments/today': () => todayApptList,
  'GET /api/queue': () => {
    const queue = todayApptList.map(a => {
      const hasRedFlag = a.patient.redFlags?.some(f => !f.resolved);
      return { ...a, priority: hasRedFlag ? 0 : 1 };
    }).sort((a, b) => a.priority - b.priority || (a.queuePosition || 99) - (b.queuePosition || 99));
    return queue;
  },

  'GET /api/medications': () => medications,
  'GET /api/medications/missed': () => missedMeds,
  'GET /api/medications/low-stock': () => medications.filter(m => m.remainingPills <= 10),

  'GET /api/records': () => records.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)),
  'GET /api/records/recent': () =>
    records.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)).slice(0, 10),

  'GET /api/notifications/recent': () => notifications,
  'GET /api/chat/rooms': () => chatRooms,

  /* Reports */
  'GET /api/reports/phq9-trend': () => {
    // คะแนน PHQ-9 เฉลี่ยรายเดือน
    const months = [5, 4, 3, 2, 1, 0];
    return months.map(m => {
      const monthRecords = records.filter(r => {
        const recDate = new Date(r.visitDate);
        const daysOld = (now - recDate) / 86400000;
        return daysOld >= m * 30 && daysOld < (m + 1) * 30;
      });
      const avg = monthRecords.length
        ? monthRecords.reduce((s, r) => s + r.PHQ9Score, 0) / monthRecords.length
        : 0;
      const monthName = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][new Date(now - m * 30 * 86400000).getMonth()];
      return { month: monthName, avgScore: Math.round(avg * 10) / 10, visits: monthRecords.length };
    });
  },

  'GET /api/reports/adherence': () => {
    // อัตราการทานยา 7 วันล่าสุด
    return [
      { day: 'จ.', taken: 92, missed: 8 },
      { day: 'อ.', taken: 88, missed: 12 },
      { day: 'พ.', taken: 95, missed: 5 },
      { day: 'พฤ.', taken: 90, missed: 10 },
      { day: 'ศ.', taken: 85, missed: 15 },
      { day: 'ส.', taken: 78, missed: 22 },
      { day: 'อา.', taken: 82, missed: 18 }
    ];
  },

  'GET /api/reports/redflags': () => {
    // Red Flag incidents รายเดือน
    return [
      { month: 'ม.ค.', count: 2 },
      { month: 'ก.พ.', count: 3 },
      { month: 'มี.ค.', count: 1 },
      { month: 'เม.ย.', count: 4 },
      { month: 'พ.ค.', count: 2 },
      { month: 'ปัจจุบัน', count: 1 }
    ];
  },

  'GET /api/reports/summary': () => ({
    avgPHQ9: 11.2,
    adherenceRate: 87,
    redFlagThisMonth: 1,
    activePatients: patients.filter(p => p.status === 'active').length,
    completedVisitsThisMonth: records.filter(r => {
      const daysOld = (now - new Date(r.visitDate)) / 86400000;
      return daysOld < 30;
    }).length,
    diagnosisDistribution: [
      { diagnosis: 'MDD', count: patients.filter(p => p.diagnosis === 'MDD').length, label: 'ซึมเศร้า' },
      { diagnosis: 'BPD', count: patients.filter(p => p.diagnosis === 'BPD').length, label: 'ไบโพลาร์' },
      { diagnosis: 'PDD', count: patients.filter(p => p.diagnosis === 'PDD').length, label: 'ซึมเศร้าเรื้อรัง' },
      { diagnosis: 'SAD', count: patients.filter(p => p.diagnosis === 'SAD').length, label: 'วิตกกังวล' },
      { diagnosis: 'OCD', count: patients.filter(p => p.diagnosis === 'OCD').length, label: 'OCD' },
      { diagnosis: 'PTSD', count: patients.filter(p => p.diagnosis === 'PTSD').length, label: 'PTSD' }
    ]
  }),

  /* Actions */
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
          flagType, flagLabel, description, timestamp: new Date(), priority: 'CRITICAL'
        }
      }
    };
  },

  'POST /api/check-refill': (req) => {
    const { patientId, medicationName } = req.body || {};
    const p = patients.find(x => x._id === patientId) || patients[0];
    const isControlled = /methylphenidate|alprazolam|diazepam|lorazepam/i.test(medicationName || '');
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
      body: { allowRefill: true, smsSent: false, recentCount: 1, warning: null,
              patient: { hn: p.hn, fullName: p.fullName } }
    };
  },

  'POST /api/trigger/medication-check': () => ({ body: { checked: 3, smsSent: 3 } }),
  'POST /api/seed': () => ({
    body: { success: true, message: 'Mock data ใช้งานอยู่แล้ว',
            stats: { patients: patients.length, meds: medications.length, records: records.length } }
  }),

  'POST /api/patients': (req) => {
    const newPatient = {
      _id: id('p', patients.length + 1),
      hn: req.body?.hn || `HN${String(patients.length + 1).padStart(3, '0')}`,
      ...req.body,
      redFlags: [],
      status: 'active',
      createdAt: new Date()
    };
    patients.push(newPatient);
    return { body: newPatient };
  },

  'POST /api/visits': (req) => {
    const v = req.body || {};
    const newRecord = {
      _id: id('r', records.length + 1),
      patient: v.patientId,
      patientName: patients.find(p => p._id === v.patientId)?.fullName || '',
      doctor: v.doctorId || doctors[0]._id,
      visitDate: new Date(),
      symptoms: v.symptoms,
      diagnosis: v.diagnosis,
      treatment: v.treatment,
      PHQ9Score: v.PHQ9Score,
      riskAssessment: v.PHQ9Score >= 20 ? 'critical' : v.PHQ9Score >= 15 ? 'high' : v.PHQ9Score >= 10 ? 'moderate' : 'low',
      notes: v.notes
    };
    records.unshift(newRecord);
    return { body: { success: true, record: newRecord } };
  },

  'POST /api/queue/advance': (req) => {
    const { appointmentId, newStatus } = req.body || {};
    const apt = appointments.find(a => a._id === appointmentId);
    if (apt) apt.status = newStatus;
    return { body: { success: true, appointment: apt } };
  }
};

const matchDynamic = (req) => {
  // GET /api/chat/HN001 → messages
  let m = req.path.match(/^\/api\/chat\/([^/]+)$/);
  if (m && req.method === 'GET' && m[1] !== 'rooms') {
    return () => chatMessages[m[1]] || [];
  }
  // GET /api/patients/HN001 → patient
  m = req.path.match(/^\/api\/patients\/([^/]+)$/);
  if (m && req.method === 'GET') {
    return () => patients.find(x => x.hn === m[1] || x._id === m[1]) || null;
  }
  // GET /api/patients/HN001/medications
  m = req.path.match(/^\/api\/patients\/([^/]+)\/medications$/);
  if (m && req.method === 'GET') {
    const p = patients.find(x => x.hn === m[1] || x._id === m[1]);
    return () => p ? medications.filter(med => med.patient === p._id) : [];
  }
  // GET /api/patients/HN001/records
  m = req.path.match(/^\/api\/patients\/([^/]+)\/records$/);
  if (m && req.method === 'GET') {
    const p = patients.find(x => x.hn === m[1] || x._id === m[1]);
    return () => p
      ? records.filter(r => r.patient === p._id).sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
      : [];
  }
  // GET /api/patients/HN001/appointments
  m = req.path.match(/^\/api\/patients\/([^/]+)\/appointments$/);
  if (m && req.method === 'GET') {
    const p = patients.find(x => x.hn === m[1] || x._id === m[1]);
    return () => p
      ? appointments.filter(a => a.patient._id === p._id).sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];
  }
  return null;
};

module.exports = { handlers, matchDynamic, patients, chatMessages };
