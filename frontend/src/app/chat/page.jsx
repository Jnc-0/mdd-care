'use client';

/**
 * MDD Care - Chat Page
 * รพ.คลองหาด แผนกจิตเวช
 *
 * Features:
 *  - ห้องแชตเรียลไทม์ระหว่างพยาบาล ↔ คนไข้/ญาติ (Socket.io)
 *  - อัปโหลดรูปภาพรายงานอาการ / ซองยา (Base64, ≤ 5MB, .jpg/.png)
 *  - Light/Dark Mode (Winter Palette)
 *  - Typing indicator + Auto-scroll
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

const API_URL    = process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const ROLES = [
  { value: 'nurse',     label: 'พยาบาล',      color: 'indigo' },
  { value: 'doctor',    label: 'แพทย์',       color: 'blue'   },
  { value: 'caregiver', label: 'ญาติผู้ดูแล', color: 'slate'  },
  { value: 'patient',   label: 'คนไข้',       color: 'zinc'   }
];

const fmtTime = (d) => new Date(d).toLocaleTimeString('th-TH', {
  hour: '2-digit', minute: '2-digit'
});

/* ============ Image bubble ============ */
function ImageBubble({ src, name }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 rounded-lg overflow-hidden border border-white/30 hover:opacity-90 transition"
      >
        <img
          src={src}
          alt={name || 'image'}
          className="max-w-[220px] max-h-[220px] object-cover"
        />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={src}
            alt={name || 'image'}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

/* ============ Message bubble ============ */
function MessageBubble({ msg, mine }) {
  const roleStyle = {
    nurse:     'bg-indigo-600 text-white',
    doctor:    'bg-blue-600  text-white',
    caregiver: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100',
    patient:   'bg-zinc-200  dark:bg-zinc-700  text-slate-900 dark:text-slate-100'
  }[msg.senderRole] || 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100';

  const roleLabel = {
    nurse: 'พยาบาล', doctor: 'แพทย์',
    caregiver: 'ญาติ', patient: 'คนไข้'
  }[msg.senderRole] || msg.senderRole;

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-slide-in`}>
      <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
        {!mine && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 ml-2">
            {msg.sender} · {roleLabel}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2 shadow-sm ${roleStyle} ${
          mine ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}>
          {msg.message && (
            <div className="whitespace-pre-wrap break-words">{msg.message}</div>
          )}
          {msg.imageData && (
            <ImageBubble src={msg.imageData} name={msg.imageName} />
          )}
        </div>
        <div className={`text-[10px] text-slate-400 mt-1 ${mine ? 'mr-2' : 'ml-2'}`}>
          {fmtTime(msg.createdAt || msg.timestamp || Date.now())}
        </div>
      </div>
    </div>
  );
}

/* ============ Main Chat Page ============ */
export default function ChatPage() {
  const [dark, setDark] = useState(false);
  const [rooms,       setRooms]       = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [imgPreview,  setImgPreview]  = useState(null); // Base64
  const [imgName,     setImgName]     = useState(null);
  const [imgError,    setImgError]    = useState(null);
  const [sender,      setSender]      = useState('');
  const [senderRole,  setSenderRole]  = useState('nurse');
  const [typingUser,  setTypingUser]  = useState(null);
  const [connected,   setConnected]   = useState(false);
  const [showSetup,   setShowSetup]   = useState(true);

  const socketRef = useRef(null);
  const fileRef   = useRef(null);
  const endRef    = useRef(null);
  const typingTimerRef = useRef(null);

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

  /* ── Persist sender setup ── */
  useEffect(() => {
    const s = localStorage.getItem('mdd-sender');
    const r = localStorage.getItem('mdd-sender-role');
    if (s) { setSender(s); setShowSetup(false); }
    if (r) setSenderRole(r);
  }, []);

  /* ── Load rooms + socket ── */
  useEffect(() => {
    fetchRooms();

    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    const s = socketRef.current;

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('new-message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      fetchRooms();
    });

    s.on('user-typing', (data) => {
      setTypingUser(data.sender);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 2000);
    });

    s.on('error', (err) => {
      alert('ข้อผิดพลาด: ' + err.message);
    });

    return () => s.disconnect();
  }, []);

  /* ── Auto-scroll on new message ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Join room ── */
  useEffect(() => {
    if (!currentRoom || !socketRef.current) return;
    socketRef.current.emit('join-room', currentRoom);
    loadMessages(currentRoom);
    return () => socketRef.current?.emit('leave-room', currentRoom);
  }, [currentRoom]);

  /* ── API ── */
  const fetchRooms = async () => {
    try {
      const [roomsRes, patientsRes] = await Promise.all([
        fetch(`${API_URL}/api/chat/rooms`).then(r => r.json()),
        fetch(`${API_URL}/api/patients`).then(r => r.json())
      ]);

      // ผสม room ที่มีแชต + คนไข้ทั้งหมด (HN เป็น room key)
      const roomMap = new Map();
      patientsRes.forEach(p => {
        roomMap.set(p.hn, {
          room: p.hn,
          patientName: p.fullName,
          lastMessage: null,
          lastTime: null,
          unreadCount: 0
        });
      });
      roomsRes.forEach(r => {
        const existing = roomMap.get(r._id) || { room: r._id, patientName: r._id };
        roomMap.set(r._id, {
          ...existing,
          lastMessage: r.lastMessage,
          lastTime: r.lastTime,
          unreadCount: r.unreadCount
        });
      });
      setRooms(Array.from(roomMap.values()));
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (room) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/${room}`);
      setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Send ── */
  const send = () => {
    if (!currentRoom) return alert('เลือกห้องแชตก่อน');
    if (!sender)      return alert('ตั้งชื่อผู้ส่งก่อน');
    if (!input.trim() && !imgPreview) return;

    socketRef.current.emit('send-message', {
      room: currentRoom,
      sender, senderRole,
      message: input.trim(),
      imageData: imgPreview,
      imageName: imgName
    });

    setInput('');
    setImgPreview(null); setImgName(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Image upload ── */
  const onPickImage = (e) => {
    setImgError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(jpeg|png|jpg)$/.test(file.type)) {
      setImgError('รองรับเฉพาะ .jpg และ .png');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImgError('ไฟล์ใหญ่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgPreview(ev.target.result);
      setImgName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const onTyping = () => {
    if (!currentRoom || !sender) return;
    socketRef.current?.emit('typing', { room: currentRoom, sender });
  };

  const saveSetup = () => {
    if (!sender.trim()) return alert('กรอกชื่อก่อน');
    localStorage.setItem('mdd-sender', sender);
    localStorage.setItem('mdd-sender-role', senderRole);
    setShowSetup(false);
  };

  /* ============ Render ============ */
  return (
    <main className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      {/* ───── NAVBAR ───── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >←</Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              💬
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">
                ห้องแชตคนไข้-ญาติ
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                {connected ? 'เชื่อมต่อแล้ว' : 'ขาดการเชื่อมต่อ'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sender && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
                <span className="text-slate-500 dark:text-slate-400">เข้าใช้:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{sender}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  {ROLES.find(r => r.value === senderRole)?.label}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowSetup(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
            >
              ⚙️
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* ───── MAIN LAYOUT ───── */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">

        {/* ROOMS LIST */}
        <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 overflow-y-auto flex-shrink-0 hidden md:block">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ห้องแชต ({rooms.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rooms.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มีห้องแชต
              </div>
            ) : rooms.map(r => (
              <button
                key={r.room}
                onClick={() => setCurrentRoom(r.room)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  currentRoom === r.room
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-500'
                    : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {r.patientName || r.room}
                  </div>
                  {r.unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {r.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  HN:{r.room}
                </div>
                {r.lastMessage && (
                  <div className="text-xs text-slate-500 dark:text-slate-500 truncate mt-1">
                    {r.lastMessage}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* CHAT AREA */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {!currentRoom ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center text-slate-400 dark:text-slate-500">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-lg font-medium">เลือกห้องแชตเพื่อเริ่มสนทนา</div>
                <div className="text-sm mt-1">รายชื่อห้องอยู่ทางซ้าย</div>
              </div>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {rooms.find(r => r.room === currentRoom)?.patientName || currentRoom}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      HN:{currentRoom} · {messages.length} ข้อความ
                    </div>
                  </div>
                  {/* Mobile: room selector */}
                  <select
                    value={currentRoom}
                    onChange={(e) => setCurrentRoom(e.target.value)}
                    className="md:hidden text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    {rooms.map(r => (
                      <option key={r.room} value={r.room}>
                        {r.patientName} (HN:{r.room})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-slate-400 py-12">
                    ยังไม่มีข้อความ — เริ่มสนทนาได้เลย
                  </div>
                ) : messages.map(msg => (
                  <MessageBubble
                    key={msg._id || msg.createdAt}
                    msg={msg}
                    mine={msg.sender === sender}
                  />
                ))}
                {typingUser && typingUser !== sender && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic ml-2">
                    {typingUser} กำลังพิมพ์...
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* IMAGE PREVIEW */}
              {imgPreview && (
                <div className="mx-4 mb-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
                  <img src={imgPreview} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                      {imgName}
                    </div>
                    <div className="text-xs text-slate-500">พร้อมส่ง</div>
                  </div>
                  <button
                    onClick={() => { setImgPreview(null); setImgName(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}

              {imgError && (
                <div className="mx-4 mb-2 px-3 py-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
                  ⚠️ {imgError}
                </div>
              )}

              {/* INPUT */}
              <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
                    title="แนบรูปภาพ (.jpg/.png ≤ 5MB)"
                  >
                    📷
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={onPickImage}
                    className="hidden"
                  />
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      onTyping();
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="พิมพ์ข้อความ... (Enter = ส่ง, Shift+Enter = ขึ้นบรรทัดใหม่)"
                    className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-32"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() && !imgPreview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium transition flex-shrink-0 shadow-sm"
                  >
                    ส่ง
                  </button>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-3">
                  <span>📎 .jpg/.png ≤ 5MB</span>
                  <span>⚡ เรียลไทม์ผ่าน Socket.io</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ───── SETUP MODAL ───── */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              👤 ตั้งค่าผู้ใช้งาน
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              กรอกชื่อและบทบาทของคุณก่อนเริ่มแชต
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="เช่น พว.มาลี / นางพิมพ์ (ภรรยา)"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  บทบาท
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setSenderRole(r.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition ${
                        senderRole === r.value
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveSetup}
                className="w-full mt-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
              >
                เริ่มใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
