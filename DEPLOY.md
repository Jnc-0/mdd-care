# 🚀 Deploy MDD Care ใน 5-10 นาที

ทำตาม 5 ขั้นนี้ — ไม่มีอะไรซับซ้อน

---

## 📋 สิ่งที่ต้องมี (ฟรีทั้งหมด)

- [ ] GitHub account → https://github.com/signup
- [ ] MongoDB Atlas account → https://cloud.mongodb.com
- [ ] Render account → https://render.com (login ด้วย GitHub ได้)
- [ ] Vercel account → https://vercel.com (login ด้วย GitHub ได้)

---

## 🔧 STEP 1 — Push โค้ดขึ้น GitHub (1 นาที)

1. ไป https://github.com/new สร้าง repo ชื่อ `mdd-care` (Public หรือ Private ก็ได้)
2. **อย่ากด** "Add README" — repo ต้องว่างเปล่า
3. รัน script นี้ใน PowerShell:

```powershell
cd C:\Users\Administrator\.claude\projects\mdd-care
.\deploy-helper.ps1
```

Script จะถาม GitHub username แล้ว push ให้

---

## 🗄️ STEP 2 — MongoDB Atlas (2 นาที)

1. https://cloud.mongodb.com → **Build a Database** → เลือก **M0 FREE**
2. Provider: AWS, Region: **Singapore (ap-southeast-1)** (ใกล้ไทยที่สุด)
3. Cluster Name: `mdd-care-cluster` → **Create**
4. Security Quickstart:
   - Username: `mdd_admin`
   - Password: กด **Autogenerate Secure Password** → **COPY ไว้!**
5. Where would you like to connect from: **My Local Environment** → IP `0.0.0.0/0` (allow all)
6. **Finish and Close**
7. ซ้ายมือ → **Database** → **Connect** → **Drivers**
8. Driver: Node.js, Version: 5.5 or later
9. คัดลอก connection string เปลี่ยน `<password>` เป็น password จริง + เติม `/mdd_care` ก่อน `?`:

```
mongodb+srv://mdd_admin:YOUR_PASSWORD@mdd-care-cluster.xxxxx.mongodb.net/mdd_care?retryWrites=true&w=majority
```

📋 **เก็บ string นี้ไว้ใช้ STEP 3**

---

## ⚙️ STEP 3 — Deploy Backend ขึ้น Render (2 นาที)

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Connect GitHub → เลือก repo `mdd-care`
3. Render จะอ่าน `render.yaml` ที่เตรียมไว้แล้วอัตโนมัติ
4. ตั้ง Blueprint Name: `mdd-care`
5. กรอก env vars ที่ขึ้นมา:
   - **MONGO_URI** = paste connection string จาก STEP 2
   - **FRONTEND_URL** = `https://mdd-care.vercel.app` *(ใส่ทีหลังก็ได้ แก้ใน Render dashboard)*
6. **Apply** → รอ 2-3 นาที (Build → Deploy)
7. เมื่อเสร็จ จะได้ URL เช่น: `https://mdd-care-api.onrender.com`

📋 **เก็บ URL นี้ไว้ใช้ STEP 4**

---

## 🎨 STEP 4 — Deploy Frontend ขึ้น Vercel (2 นาที)

1. https://vercel.com/new → **Import** repo `mdd-care`
2. ตั้งค่า:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: คลิก **Edit** → เลือก **`frontend`** ⚠️ สำคัญ!
3. กางส่วน **Environment Variables** กรอก 2 ตัว:
   - **NEXT_PUBLIC_API_URL** = `https://mdd-care-api.onrender.com` (จาก STEP 3)
   - **NEXT_PUBLIC_SOCKET_URL** = `https://mdd-care-api.onrender.com` (เหมือนกัน)
4. **Deploy** → รอ 1-2 นาที
5. ได้ URL เช่น: `https://mdd-care-xxx.vercel.app`

---

## 🔄 STEP 5 — เชื่อม Backend ↔ Frontend (1 นาที)

1. กลับไป Render dashboard → mdd-care-api → **Environment**
2. แก้ `FRONTEND_URL` เป็น URL Vercel จริง (จาก STEP 4)
3. **Save Changes** → backend จะ redeploy อัตโนมัติ (30 วินาที)

---

## ✅ STEP 6 — ทดสอบ (1 นาที)

1. เปิด URL Vercel ในมือถือ/คอมพิวเตอร์
2. คลิก **แดชบอร์ดทีมแพทย์**
3. กดปุ่ม **🌱 Seed Demo** มุมขวา → สร้างข้อมูลตัวอย่าง 3 คนไข้
4. กดปุ่ม **🚨 ทดสอบ Red Flag** → แถบแดงจะเด้งทันที + log ใน Render จะแสดง SMS

🎉 **เสร็จแล้ว!** ระบบ live 24/7 ใช้งานจากที่ไหนก็ได้

---

## 📱 STEP 7 (Optional) — เปิด SMS จริงด้วย Twilio

เมื่อพร้อมส่ง SMS จริง (ไม่ใช่จำลอง):

1. https://twilio.com → sign up → ได้ Trial credit ฟรี
2. Console → Account Info → คัดลอก Account SID + Auth Token
3. Phone Numbers → Buy a number (Thai +66 หรือ US +1)
4. Render dashboard → Environment → เพิ่ม:
   ```
   TWILIO_SID    = ACxxxxxxxxxxx
   TWILIO_TOKEN  = xxxxxxxxxxxxx
   TWILIO_PHONE  = +1xxxxxxxxxx
   ```
5. แก้ `backend/server.js` — uncomment ส่วน Twilio SDK (ที่ comment ไว้แล้ว)
6. git push → Render auto-redeploy → SMS ส่งเข้ามือถือจริง

---

## ⚠️ ข้อจำกัด Free Tier

| Service | จำกัด | ผลกระทบ |
|---------|------|---------|
| Render Free | Sleep 15 นาทีเมื่อไม่มีคนใช้ | คนแรกของวันรอ ~30 วิ wake up |
| MongoDB M0 | 512MB storage | พอ ~5,000 คนไข้ |
| Vercel Hobby | ฟรีไม่จำกัด | ใช้งานในแผนก OK |

อัปเกรด **Render Starter ($7/เดือน)** เมื่อใช้ production จริง — ไม่ sleep + socket.io เสถียร

---

## 🆘 ติดปัญหา?

- **Backend ไม่ขึ้น**: ดู Render Logs → ส่วนใหญ่เป็น MONGO_URI ผิด
- **Frontend เห็นแต่ empty**: ตรวจ env vars ใน Vercel + ต้อง redeploy หลังแก้
- **CORS error**: FRONTEND_URL ใน Render ต้องตรงกับ Vercel URL เป๊ะ ๆ
- **MongoDB connection failed**: Atlas Network Access ต้อง allow `0.0.0.0/0`
