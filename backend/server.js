/**
 * MDD Care - Backend Server
 * ระบบบริหารจัดการคนไข้โรคซึมเศร้า รพ.คลองหาด จ.สระแก้ว
 *
 * Stack: Node.js + Express + Socket.io + MongoDB Atlas + node-cron
 * Deploy: Render
 */

require('dotenv').config();

const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const mongoose  = require('mongoose');
const { Server } = require('socket.io');
const cron      = require('node-cron');

const {
  User, Patient, Appointment, Medication,
  MedicationLog, Record, ChatMessage, NotificationLog
} = require('./models/Schemas');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e7 // 10MB - รองรับรูป Base64 สูงสุด 5MB
});

/* ────────────── Middleware ────────────── */
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ────────────── MongoDB (Atlas / Memory fallback) ────────────── */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('⚠ MONGO_URI ไม่ตั้งค่า - ใช้ JSON Mock Store (demo only)');
    return;
  }
  try {
    mongoose.set('bufferTimeoutMS', 5000);
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB Error:', err.message);
  }
}
connectDB();

/* ─────────────────────────────────────────────────────────────
 * MOCK STORE (ใช้เมื่อไม่มี MongoDB - สำหรับ demo เท่านั้น)
 * ───────────────────────────────────────────────────────────── */
const dbReady = () => mongoose.connection.readyState === 1;
const MOCK = require('./mockStore');

app.use((req, res, next) => {
  if (dbReady()) return next();

  const key = `${req.method} ${req.path}`;
  const handler = MOCK.handlers[key] || MOCK.matchDynamic(req);
  if (handler) {
    const result = handler(req);
    if (result && result.broadcast) io.emit(result.broadcast.event, result.broadcast.data);
    return res.json(result.body !== undefined ? result.body : result);
  }
  next();
});

/* ═══════════════════════════════════════════════════════════════
 * SMS GATEWAY (Twilio Simulation)
 * ใช้งานจริงให้ uncomment ส่วน Twilio SDK และตั้งค่า ENV
 * ═══════════════════════════════════════════════════════════════ */
async function sendSMS(to, message, type = 'general', patientId = null) {
  try {
    /* ── PRODUCTION (uncomment เมื่อพร้อมใช้ Twilio จริง) ──
    const twilio = require('twilio')(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
    const result = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });
    */

    // ── DEMO / SIMULATION ──
    const stamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    console.log('\n📱 ═══ SMS GATEWAY (SIMULATION) ═══');
    console.log(`   📞 To:      ${to}`);
    console.log(`   🏷️  Type:    ${type}`);
    console.log(`   💬 Msg:     ${message}`);
    console.log(`   ⏰ Time:    ${stamp}`);
    console.log('   ═══════════════════════════════════\n');

    const log = await NotificationLog.create({
      recipient: to, type, message,
      patient: patientId, status: 'sent'
    });

    // ส่ง event ไปแสดงผลบน Dashboard ทันที
    io.emit('sms-sent', {
      _id: log._id, to, message, type,
      patient: patientId, timestamp: new Date()
    });

    return { success: true, to, message };
  } catch (error) {
    console.error('SMS Error:', error.message);
    return { success: false, error: error.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
 * API ROUTES
 * ═══════════════════════════════════════════════════════════════ */

app.get('/', (_req, res) => {
  res.json({
    name: 'MDD Care API - รพ.คลองหาด จ.สระแก้ว',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date()
  });
});

/* ──────────── Patients ──────────── */
app.get('/api/patients', async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'ไม่พบคนไข้' });
    res.json(patient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Red Flag Alert (วิกฤตทางจิตเวช) ──────────── */
app.post('/api/red-flag', async (req, res) => {
  try {
    const { patientId, flagType, description, notedBy } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        $push: { redFlags: { flagType, description, notedBy } },
        severity: 'critical'
      },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: 'ไม่พบคนไข้' });

    // ค้นแพทย์/พยาบาลที่กำลังเข้าเวร
    const onDutyStaff = await User.find({
      role: { $in: ['doctor', 'nurse'] },
      onDuty: true,
      active: true
    });

    const flagLabel = {
      'suicidal':       'เสี่ยงฆ่าตัวตาย',
      'hallucination':  'หูแว่ว/หลอน',
      'aggressive':     'ก้าวร้าว',
      'self-harm':      'ทำร้ายตนเอง',
      'other':          'อาการผิดปกติ'
    }[flagType] || flagType;

    const urgentMsg =
      `🚨 ด่วน! คนไข้ ${patient.fullName} (HN:${patient.hn}) ` +
      `มีอาการ Red Flag: ${flagLabel} กรุณาเข้าตรวจสอบทันที [รพ.คลองหาด]`;

    for (const staff of onDutyStaff) {
      await sendSMS(staff.phone, urgentMsg, 'red_flag', patient._id);
    }

    // เด้งบน Dashboard ทุกหน้าจอ
    io.emit('red-flag-alert', {
      patient: { id: patient._id, hn: patient.hn, fullName: patient.fullName },
      flagType, flagLabel, description,
      timestamp: new Date(),
      priority: 'CRITICAL'
    });

    res.json({
      success: true,
      message: 'แจ้งเตือน Red Flag สำเร็จ ส่ง SMS ไปแล้ว',
      smsCount: onDutyStaff.length,
      patient: patient.fullName
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Check Refill (สกัดกั้นการเวียนรับยาซ้ำซ้อน) ──────────── */
app.post('/api/check-refill', async (req, res) => {
  try {
    const { patientId, medicationName } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'ไม่พบคนไข้' });

    // ตรวจสอบการรับยาในรอบ 30 วัน
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = await Medication.find({
      patient: patientId,
      medicationName: { $regex: medicationName, $options: 'i' },
      lastRefillDate: { $gte: thirtyDaysAgo }
    }).sort({ lastRefillDate: -1 });

    let warning   = null;
    let allowRefill = true;
    let smsSent   = false;

    if (recent.length >= 2) {
      warning =
        `⚠️ ตรวจพบการรับยา "${medicationName}" จำนวน ${recent.length} ครั้ง ` +
        `ในช่วง 30 วันที่ผ่านมา อาจเป็นการเวียนรับยาซ้ำซ้อน - เสี่ยง Overdose`;
      allowRefill = false;

      // ยิง SMS แจ้งญาติ
      const alertMsg =
        `⚠️ คำเตือนความปลอดภัย: คนไข้ ${patient.fullName} อาจมีพฤติกรรม ` +
        `เวียนรับยา "${medicationName}" ซ้ำซ้อน กรุณาเฝ้าระวังการใช้ยา ` +
        `เกินขนาด และติดต่อ รพ.คลองหาด ทันที`;

      await sendSMS(patient.caregiverPhone, alertMsg, 'refill_warning', patient._id);
      smsSent = true;

      io.emit('refill-warning', {
        patient: { id: patient._id, hn: patient.hn, fullName: patient.fullName },
        medication: medicationName,
        count: recent.length,
        timestamp: new Date()
      });
    }

    res.json({
      allowRefill, warning, smsSent,
      recentCount:     recent.length,
      lastRefillDates: recent.map(m => m.lastRefillDate),
      patient:         { hn: patient.hn, fullName: patient.fullName }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Medications ──────────── */
app.get('/api/medications', async (_req, res) => {
  try {
    const meds = await Medication.find().populate('patient').sort({ createdAt: -1 });
    res.json(meds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/medications', async (req, res) => {
  try {
    const med = await Medication.create(req.body);
    res.status(201).json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/medications/confirm', async (req, res) => {
  try {
    const { patientId, medicationId, confirmedBy } = req.body;

    const log = await MedicationLog.create({
      patient:       patientId,
      medication:    medicationId,
      scheduledTime: new Date(),
      takenTime:     new Date(),
      status:        'taken',
      confirmedBy:   confirmedBy || 'patient'
    });

    io.emit('medication-confirmed', { patientId, timestamp: new Date() });
    res.json({ success: true, log });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/medications/missed', async (_req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7); // ภายใน 7 วัน

    const missed = await MedicationLog.find({
      status: 'missed',
      scheduledTime: { $gte: since }
    })
      .populate('patient')
      .populate('medication')
      .sort({ scheduledTime: -1 })
      .limit(50);

    res.json(missed);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Appointments ──────────── */
app.get('/api/appointments', async (_req, res) => {
  try {
    const list = await Appointment.find()
      .populate('patient').populate('doctor')
      .sort({ date: 1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/appointments/today', async (_req, res) => {
  try {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const list = await Appointment.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('patient').populate('doctor').sort({ time: 1 });

    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const apt = await Appointment.create(req.body);
    res.status(201).json(apt);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

/* ──────────── Dashboard Stats ──────────── */
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, activeRedFlags, todayAppointments, missedAppointments, missedMedications]
      = await Promise.all([
        Patient.countDocuments({ status: 'active' }),
        Patient.countDocuments({ severity: 'critical', 'redFlags.resolved': false }),
        Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'scheduled' }),
        Appointment.countDocuments({ status: 'missed' }),
        MedicationLog.countDocuments({ status: 'missed' })
      ]);

    res.json({
      totalPatients, activeRedFlags,
      todayAppointments, missedAppointments, missedMedications
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Chat History ──────────── */
app.get('/api/chat/rooms', async (_req, res) => {
  try {
    const rooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$message' },
          lastSender:  { $first: '$sender' },
          lastTime:    { $first: '$createdAt' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);
    res.json(rooms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/chat/:room', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room: req.params.room })
      .sort({ createdAt: 1 }).limit(200);
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Notification Log ──────────── */
app.get('/api/notifications/recent', async (_req, res) => {
  try {
    const logs = await NotificationLog.find()
      .populate('patient', 'hn fullName')
      .sort({ createdAt: -1 }).limit(20);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Demo Seed (สำหรับเดโม) ──────────── */
app.post('/api/seed', async (_req, res) => {
  try {
    await Promise.all([
      User.deleteMany({}), Patient.deleteMany({}),
      Appointment.deleteMany({}), Medication.deleteMany({}),
      MedicationLog.deleteMany({})
    ]);

    const docs = await User.insertMany([
      { username: 'dr_somchai', password: '$2a$10$demo', fullName: 'นพ.สมชาย ใจดี',
        role: 'doctor', phone: '0891234567', onDuty: true },
      { username: 'nurse_malee', password: '$2a$10$demo', fullName: 'พว.มาลี สดใส',
        role: 'nurse', phone: '0817654321', onDuty: true }
    ]);

    const patients = await Patient.insertMany([
      { hn: 'HN001', citizenId: '1234567890123', fullName: 'นายสมศักดิ์ ทดสอบ',
        dob: new Date('1985-05-12'), gender: 'male', phone: '0812345678',
        caregiverName: 'นางพิมพ์ ทดสอบ', caregiverRelation: 'ภรรยา',
        caregiverPhone: '0823456789', diagnosis: 'MDD', severity: 'moderate' },
      { hn: 'HN002', citizenId: '1234567890124', fullName: 'นางสาวรัตนา ใจดี',
        dob: new Date('1992-08-20'), gender: 'female', phone: '0834567890',
        caregiverName: 'นางสายใจ ใจดี', caregiverRelation: 'แม่',
        caregiverPhone: '0845678901', diagnosis: 'BPD', severity: 'severe' },
      { hn: 'HN003', citizenId: '1234567890125', fullName: 'นายอภิชาติ มั่นคง',
        dob: new Date('1978-11-03'), gender: 'male', phone: '0856789012',
        caregiverName: 'นางพรทิพย์ มั่นคง', caregiverRelation: 'พี่สาว',
        caregiverPhone: '0867890123', diagnosis: 'PDD', severity: 'mild' }
    ]);

    const meds = await Medication.insertMany([
      { patient: patients[0]._id, medicationName: 'Fluoxetine', dosage: '20 mg',
        frequency: 'วันละ 1 ครั้ง เช้า', timesPerDay: 1, scheduledTimes: ['08:00'],
        startDate: new Date(), prescribedBy: docs[0]._id, totalPills: 30, remainingPills: 28 },
      { patient: patients[1]._id, medicationName: 'Methylphenidate', dosage: '10 mg',
        frequency: 'วันละ 2 ครั้ง', isControlled: true, timesPerDay: 2,
        scheduledTimes: ['08:00', '13:00'], startDate: new Date(),
        prescribedBy: docs[0]._id, totalPills: 60, remainingPills: 50 }
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    await Appointment.insertMany([
      { patient: patients[0]._id, doctor: docs[0]._id, date: today, time: '09:00',
        reason: 'ติดตามอาการ', status: 'scheduled' },
      { patient: patients[1]._id, doctor: docs[0]._id, date: today, time: '10:30',
        reason: 'ปรับยา', status: 'scheduled' },
      { patient: patients[2]._id, doctor: docs[0]._id, date: tomorrow, time: '14:00',
        reason: 'ประเมินผล', status: 'scheduled' }
    ]);

    // จำลองการลืมทานยา 1 รายการ
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await MedicationLog.create({
      patient: patients[0]._id, medication: meds[0]._id,
      scheduledTime: oneHourAgo, status: 'missed', confirmedBy: 'auto'
    });

    res.json({
      success: true,
      message: 'Seed data สร้างเสร็จ',
      stats: { users: docs.length, patients: patients.length, meds: meds.length }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ──────────── Manual Trigger (สำหรับทดสอบ Cron) ──────────── */
app.post('/api/trigger/medication-check', async (_req, res) => {
  const result = await checkMissedMedications();
  res.json(result);
});

/* ═══════════════════════════════════════════════════════════════
 * SOCKET.IO - Real-time Chat
 * รับ-ส่งข้อความ + รูป Base64 (.jpg/.png, ≤ 5MB)
 * ═══════════════════════════════════════════════════════════════ */
io.on('connection', (socket) => {
  console.log(`✓ Socket connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`  → ${socket.id} joined room: ${room}`);
    socket.to(room).emit('user-joined', { socketId: socket.id, room });
  });

  socket.on('leave-room', (room) => {
    socket.leave(room);
  });

  socket.on('send-message', async (data) => {
    try {
      const { room, sender, senderRole, message, imageData, imageName } = data;

      if (!room || !sender) {
        socket.emit('error', { message: 'ข้อมูลไม่ครบถ้วน' });
        return;
      }

      // ตรวจสอบรูปภาพ
      if (imageData) {
        const sizeInBytes = (imageData.length * 3) / 4;
        if (sizeInBytes > 5 * 1024 * 1024) {
          socket.emit('error', { message: 'รูปภาพมีขนาดใหญ่เกิน 5MB' });
          return;
        }
        const isJpg = imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg');
        const isPng = imageData.startsWith('data:image/png');
        if (!isJpg && !isPng) {
          socket.emit('error', { message: 'รองรับเฉพาะไฟล์ .jpg และ .png' });
          return;
        }
      }

      let chatMsg;
      if (dbReady()) {
        chatMsg = await ChatMessage.create({
          room, sender, senderRole, message, imageData, imageName
        });
      } else {
        // Mock mode - broadcast without persistence
        chatMsg = {
          _id: 'mock_' + Date.now(),
          room, sender, senderRole, message, imageData, imageName,
          createdAt: new Date()
        };
        const store = require('./mockStore');
        if (!store.chatMessages[room]) store.chatMessages[room] = [];
        store.chatMessages[room].push(chatMsg);
      }

      io.to(room).emit('new-message', chatMsg);
    } catch (err) {
      console.error('Chat error:', err.message);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user-typing', { sender: data.sender });
  });

  socket.on('disconnect', () => {
    console.log(`✗ Socket disconnected: ${socket.id}`);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRON JOBS - Background Tasks
 * ═══════════════════════════════════════════════════════════════ */

/**
 * ตรวจสอบการลืมทานยา (เรียกใช้ใน cron และ manual trigger)
 */
async function checkMissedMedications() {
  console.log('🔍 [Cron] ตรวจสอบการลืมทานยา...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const missedLogs = await MedicationLog.find({
    status: 'pending',
    scheduledTime: { $lte: oneHourAgo },
    smsAlertSent: false
  }).populate('patient').populate('medication');

  let smsCount = 0;
  for (const log of missedLogs) {
    log.status       = 'missed';
    log.smsAlertSent = true;
    await log.save();

    const { patient, medication } = log;
    const scheduledTimeStr = log.scheduledTime.toLocaleTimeString('th-TH', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    });

    const alertMsg =
      `🔔 รพ.คลองหาด: คนไข้ ${patient.fullName} ยังไม่ได้ทานยา ` +
      `"${medication.medicationName}" ตามเวลา ${scheduledTimeStr} น. ` +
      `กรุณาช่วยเตือนและกำกับการทานยาอย่างใกล้ชิด`;

    await sendSMS(patient.caregiverPhone, alertMsg, 'medication_miss', patient._id);
    smsCount++;

    io.emit('medication-missed', {
      patient:    { id: patient._id, fullName: patient.fullName, hn: patient.hn },
      medication: medication.medicationName,
      scheduledTime: log.scheduledTime
    });
  }

  console.log(`✓ ตรวจสอบเสร็จ - ส่ง SMS ${smsCount} ราย`);
  return { checked: missedLogs.length, smsSent: smsCount };
}

// ทุก 30 นาที - ตรวจสอบการลืมทานยา
cron.schedule('*/30 * * * *', checkMissedMedications, {
  timezone: 'Asia/Bangkok'
});

// ทุกวัน 09:00 น. - แจ้งเตือนนัดล่วงหน้า 1 วัน
cron.schedule('0 9 * * *', async () => {
  console.log('🔍 [Cron] ส่งแจ้งเตือนนัดหมายล่วงหน้า...');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1);

  const appointments = await Appointment.find({
    date: { $gte: tomorrow, $lt: dayAfter },
    status: 'scheduled',
    reminderSent: false
  }).populate('patient');

  for (const apt of appointments) {
    const { patient } = apt;
    const dateStr = apt.date.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric'
    });
    const msg =
      `📅 รพ.คลองหาด: เตือนนัดหมาย คนไข้ ${patient.fullName} ` +
      `มีนัดพรุ่งนี้ ${dateStr} เวลา ${apt.time} น. โปรดมาตามนัด`;

    await sendSMS(patient.caregiverPhone, msg, 'appointment_reminder', patient._id);
    apt.reminderSent = true;
    await apt.save();
  }

  console.log(`✓ ส่งแจ้งเตือน ${appointments.length} นัดหมาย`);
}, { timezone: 'Asia/Bangkok' });

/* ═══════════════════════════════════════════════════════════════
 * Start Server
 * ═══════════════════════════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   🏥  MDD Care - รพ.คลองหาด แผนกจิตเวช                        ║
║   🚀  Server: http://localhost:${PORT}                          ║
║   🌐  Socket.io: ready                                       ║
║   ⏰  Cron jobs: scheduled (Asia/Bangkok)                    ║
║   💾  MongoDB: connecting...                                 ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, io, sendSMS };
