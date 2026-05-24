/**
 * Mongoose Schemas สำหรับระบบบริหารจัดการคนไข้จิตเวช (MDD Care)
 * รพ.คลองหาด จ.สระแก้ว
 *
 * รองรับ: บันทึกประวัติ, ติดตามการทานยารายวัน (Medication Logs),
 * ระบบนัดหมาย, Red Flag Alerts, ยาควบคุมพิเศษ, แชต และ Audit Log SMS
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ─────────────────────────────────────────────
 * User Schema - บุคลากรทางการแพทย์
 * ───────────────────────────────────────────── */
const UserSchema = new Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true },
  fullName:  { type: String, required: true },
  role: {
    type: String,
    enum: ['doctor', 'nurse', 'pharmacist', 'admin'],
    required: true
  },
  phone:   { type: String, required: true },   // เบอร์มือถือ - สำหรับยิง SMS
  email:   String,
  onDuty:  { type: Boolean, default: false },  // อยู่เวรหรือไม่
  active:  { type: Boolean, default: true }
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * Patient Schema - คนไข้จิตเวช
 * ───────────────────────────────────────────── */
const PatientSchema = new Schema({
  hn:        { type: String, required: true, unique: true, index: true }, // Hospital Number
  citizenId: { type: String, required: true, unique: true },
  fullName:  { type: String, required: true },
  dob:       { type: Date, required: true },
  gender:    { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  address:   String,

  // เบอร์ติดต่อ - สำคัญสำหรับการแจ้งเตือน SMS
  phone:             { type: String, required: true },
  caregiverName:     { type: String, required: true },
  caregiverRelation: String,
  caregiverPhone:    { type: String, required: true },

  // วินิจฉัย
  diagnosis: {
    type: String,
    enum: ['MDD', 'BPD', 'PDD', 'SAD', 'OCD', 'PTSD', 'OTHER'],
    default: 'MDD'
  },
  diagnosisNote: String,
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'mild'
  },

  // Red Flags - อาการวิกฤตทางจิตเวช
  redFlags: [{
    flagType: {
      type: String,
      enum: ['suicidal', 'hallucination', 'aggressive', 'self-harm', 'other']
    },
    description: String,
    notedAt:  { type: Date, default: Date.now },
    notedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    resolved: { type: Boolean, default: false }
  }],

  status: {
    type: String,
    enum: ['active', 'inactive', 'admitted', 'discharged'],
    default: 'active'
  }
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * Appointment Schema - นัดหมาย
 * ───────────────────────────────────────────── */
const AppointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor:  { type: Schema.Types.ObjectId, ref: 'User' },
  date:    { type: Date, required: true, index: true },
  time:    { type: String, required: true },     // เก็บแยกเพื่อแสดงผลง่าย "09:30"
  reason:  String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'missed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  reminderSent: { type: Boolean, default: false },
  notes:        String
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * Medication Schema - ใบสั่งยา (รวมยาควบคุมพิเศษ)
 * ───────────────────────────────────────────── */
const MedicationSchema = new Schema({
  patient:        { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  medicationName: { type: String, required: true },
  isControlled:   { type: Boolean, default: false }, // ยาควบคุมพิเศษ (วอ.4 / Methylphenidate ฯลฯ)
  dosage:         { type: String, required: true },  // เช่น "10 mg"
  frequency:      { type: String, required: true },  // เช่น "วันละ 3 มื้อ"
  timesPerDay:    { type: Number, default: 1 },
  scheduledTimes: [String],                          // ["08:00", "12:00", "18:00"]
  startDate:      { type: Date, required: true },
  endDate:        Date,
  prescribedBy:   { type: Schema.Types.ObjectId, ref: 'User' },
  refillCount:    { type: Number, default: 0 },
  lastRefillDate: Date,
  totalPills:     Number,
  remainingPills: Number,
  active:         { type: Boolean, default: true }
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * MedicationLog Schema - บันทึกการทานยาประจำวัน
 * ใช้ตรวจจับ "การไม่ทานยา" เพื่อยิง SMS เตือนญาติ
 * ───────────────────────────────────────────── */
const MedicationLogSchema = new Schema({
  patient:       { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  medication:    { type: Schema.Types.ObjectId, ref: 'Medication', required: true },
  scheduledTime: { type: Date, required: true, index: true },
  takenTime:     Date,
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'late'],
    default: 'pending',
    index: true
  },
  confirmedBy: {
    type: String,
    enum: ['patient', 'caregiver', 'auto', 'staff'],
    default: 'patient'
  },
  notes:         String,
  smsAlertSent:  { type: Boolean, default: false }
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * Record Schema - บันทึกการรักษา / ติดตามอาการ
 * ───────────────────────────────────────────── */
const RecordSchema = new Schema({
  patient:   { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visitDate: { type: Date, default: Date.now },
  symptoms:  String,
  diagnosis: String,
  treatment: String,

  // แบบประเมินภาวะซึมเศร้า PHQ-9 (0-27)
  PHQ9Score: { type: Number, min: 0, max: 27 },
  riskAssessment: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    default: 'low'
  },
  nextAppointment: Date,
  notes:           String
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * ChatMessage Schema - ห้องแชตเรียลไทม์
 * รองรับการอัปโหลดรูป (Base64, ≤ 5MB, .jpg/.png)
 * ───────────────────────────────────────────── */
const ChatMessageSchema = new Schema({
  room:       { type: String, required: true, index: true }, // ใช้ HN ของคนไข้เป็น room
  sender:     { type: String, required: true },
  senderRole: {
    type: String,
    enum: ['patient', 'caregiver', 'doctor', 'nurse'],
    required: true
  },
  message:   String,
  imageData: String,   // Base64 string
  imageName: String,
  read:      { type: Boolean, default: false }
}, { timestamps: true });

/* ─────────────────────────────────────────────
 * NotificationLog Schema - Audit log ของ SMS ที่ส่ง
 * ───────────────────────────────────────────── */
const NotificationLogSchema = new Schema({
  recipient: { type: String, required: true },
  type: {
    type: String,
    enum: ['red_flag', 'medication_miss', 'appointment_reminder', 'refill_warning', 'general'],
    required: true
  },
  message: { type: String, required: true },
  status:  { type: String, enum: ['sent', 'failed', 'pending'], default: 'sent' },
  patient: { type: Schema.Types.ObjectId, ref: 'Patient' }
}, { timestamps: true });

module.exports = {
  User:            mongoose.model('User',            UserSchema),
  Patient:         mongoose.model('Patient',         PatientSchema),
  Appointment:     mongoose.model('Appointment',     AppointmentSchema),
  Medication:      mongoose.model('Medication',      MedicationSchema),
  MedicationLog:   mongoose.model('MedicationLog',   MedicationLogSchema),
  Record:          mongoose.model('Record',          RecordSchema),
  ChatMessage:     mongoose.model('ChatMessage',     ChatMessageSchema),
  NotificationLog: mongoose.model('NotificationLog', NotificationLogSchema)
};
