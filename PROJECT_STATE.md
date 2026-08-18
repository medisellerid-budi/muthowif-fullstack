# 📊 PROJECT STATE — SmartUmroh TourGuide (muthowifApp)

> **Last Updated:** 2026-08-17 (Sprint 5 — Final MVP)
> **Estimasi Progress Keseluruhan: 100% (MVP)**

---

## 🏗️ Arsitektur

```
muthowifApp/
├── backend/                   → Next.js API Server + LiveKit token provider
│   ├── src/app/api/           → REST API endpoints
│   ├── src/lib/               → auth.ts, livekit.ts, prisma.ts
│   ├── prisma/                → schema.prisma, migrations, seed.ts
│   └── Dockerfile
├── smartumroh-tourguide/      → Ionic React (mobile web frontend)
│   ├── src/pages/             → Halaman-halaman utama
│   ├── src/components/        → Komponen UI
│   ├── src/hooks/             → useRaiseHand.ts
│   ├── src/context/           → AuthContext.tsx
│   ├── src/services/          → api.ts (axios instance)
│   └── Dockerfile
└── docker-compose.yml         → PostgreSQL + LiveKit server lokal
```

**Tech Stack:**

| Layer          | Teknologi                                 |
|----------------|-------------------------------------------|
| Frontend       | Ionic React, Vite, TypeScript, TailwindCSS |
| Backend        | Next.js App Router, TypeScript            |
| Database       | PostgreSQL via Prisma ORM                 |
| Real-time      | LiveKit (audio streaming + data channel)  |
| QR Scan        | ZXing Browser                             |
| Containerization | Docker + Docker Compose                 |

---

## ✅ Fitur yang SUDAH SELESAI

### 🔐 Autentikasi Guide
- [x] Login guide dengan email & password
- [x] `AuthContext` + `PrivateRoute` guard
- [x] `POST /api/auth/login` endpoint
- [x] `GET /api/auth/me` endpoint

### 📋 Manajemen Sesi (Guide Side)
- [x] Buat sesi baru (judul, lokasi, durasi, expected participants)
- [x] Dashboard sesi dengan stats (aktif, total peserta, total sesi)
- [x] Detail sesi: kode akses, QR code, daftar peserta
- [x] Mulai broadcast / kembali ke siaran
- [x] Akhiri sesi (status `ENDED`)
- [x] Session expiry via field `endsAt`
- [x] Status sesi: `SCHEDULED` → `ACTIVE` → `ENDED`

### 🎙️ Room Broadcast (Guide)
- [x] LiveKit room untuk guide (audio publisher)
- [x] Toggle microphone on/off
- [x] Keluar sementara dari room (sesi tetap aktif)
- [x] Live listener count
- [x] Buka/tutup sesi tanya-jawab

### 👥 Join Peserta
- [x] Form join dengan nama + kode akses (`UMROH-XXXXXX`)
- [x] Auto-fill kode dari URL query param (`?code=...`)
- [x] Scan QR Code menggunakan kamera (ZXing)
- [x] Validasi: sesi sudah berakhir / kadaluarsa / belum aktif
- [x] Record peserta ke database saat join

### 🎧 Room Peserta
- [x] Audio streaming dari guide
- [x] Tab "Listen" dan tab "People"
- [x] Status koneksi (TERHUBUNG)
- [x] Keluar dari sesi dengan konfirmasi

### 📱 Identifikasi Device Peserta
- [x] Install `@capacitor/device` untuk ambil device UUID
- [x] Fallback UUID via `localStorage` untuk browser web
- [x] Field `deviceId` + unique constraint `[sessionId, deviceId]` di DB
- [x] Logic reconnect — device yang sudah join tidak membuat record duplikat
- [x] Toast "Selamat datang kembali" saat reconnect

### ✋ Raise Hand / Q&A System
- [x] Guide buka/tutup sesi pertanyaan
- [x] Peserta angkat/turunkan tangan
- [x] Antrian pertanyaan real-time (via LiveKit Data Channel)
- [x] Guide memanggil peserta dari antrian
- [x] Indikator "🎙️ Silakan Anda berbicara!" untuk peserta dipanggil
- [x] Badge antrian visible untuk semua peserta

### 🖥️ Backend API Endpoints
- [x] `POST /api/auth/login`
- [x] `GET  /api/auth/me`
- [x] `POST /api/auth/register` ✅ **BARU**
- [x] `GET  /api/sessions`
- [x] `POST /api/sessions` (fix: endsAt via Prisma langsung) ✅ **FIXED**
- [x] `GET  /api/sessions/[id]/participants` (dengan isOnline dari LiveKit)
- [x] `POST /api/sessions/[id]/start`
- [x] `POST /api/sessions/[id]/end`
- [x] `POST /api/sessions/[id]/leave`
- [x] `POST /api/join`

---

## ⚠️ Fitur Ada Tapi Belum Sempurna

| Masalah | Lokasi | Keterangan |
|---|---|---|
| ~~**Password tidak di-hash**~~ | ~~`prisma/seed.ts`~~ | ✅ **FIXED** — bcrypt salt 12 |
| ~~**`endsAt` via raw SQL**~~ | ~~`api/sessions/route.ts`~~ | ✅ **FIXED** — Prisma langsung |
| ~~**Tab "Belum Join" hardcoded 0**~~ | ~~`GuideSessionDetail.tsx`~~ | ✅ **FIXED** — fetch dari `/sessions/[id]/expected`, hitung `hasJoined` |
| ~~**Polling setiap 5 detik**~~ | ~~`GuideSessionDetail.tsx`~~ | ✅ **FIXED** — Smart polling dengan Page Visibility API |
| ~~**`isOnline` tidak ada di DB schema**~~ | ~~`GuideSessionDetail.tsx`~~ | ✅ **SUDAH ADA** — diambil dari LiveKit `roomService.listParticipants()` |
| ~~**Token di localStorage**~~ | ~~`GuideRoom.tsx`~~ | ✅ **FIXED** — pindah ke `sessionStorage` |
| ~~**500 error saat buat sesi**~~ | ~~`POST /api/sessions`~~ | ✅ **FIXED** — `prisma generate` dijalankan di dalam Docker container |
| ~~**Network Error saat Login**~~ | ~~`api.ts` & `middleware.ts`~~ | ✅ **FIXED** — Dihapus header ngrok & ditambah bypass di CORS |
| ~~**Blank page saat logout Admin**~~ | ~~`SuperadminDashboard.tsx`~~ | ✅ **FIXED** — Dihapus `history.replace('/')` yang bentrok dengan `<PrivateRoute>` |

---

## ❌ Fitur yang BELUM ADA

| Fitur | Prioritas | Keterangan |
|---|---|---|
| ~~**Registrasi guide**~~ | ~~🔴 Tinggi~~ | ✅ **DONE** — `/guide/register` + `POST /api/auth/register` |
| ~~**Password hashing**~~ | ~~🔴 Tinggi~~ | ✅ **DONE** — bcrypt di seed & login |
| ~~**Online status peserta real-time**~~ | ~~🟡 Sedang~~ | ✅ **DONE** — polling smart + Visibility API |
| ~~**Expected Participants (Belum Join)**~~ | ~~🟡 Sedang~~ | ✅ **DONE** — UI input + endpoint `/expected` + tab "Belum Join" |
| ~~**Push Notification**~~ | ~~🟡 Sedang~~ | ✅ **DONE** — Smart Wait + auto-retry + browser Notification API |
| ~~**Share via WhatsApp/sosmed**~~ | ~~🟢 Rendah~~ | ✅ **DONE** — Web Share API + WhatsApp fallback |
| ~~**Dark mode**~~ | ~~🟢 Rendah~~ | ✅ **DONE** — ThemeContext + global CSS variables + toggle di header |
| ~~**Offline handling**~~ | ~~🟢 Rendah~~ | ✅ **DONE** — `useNetworkStatus` hook + global `<NetworkBanner />` |
| **Rekaman sesi** | 🟢 Rendah | LiveKit support egress recording, belum diimplementasi (Post-MVP) |
| **Analytics / laporan** | 🟢 Rendah | Tidak ada export data atau laporan sesi (Post-MVP) |

---

## 📈 Progress per Area

```
Core Flow (Join & Broadcast)  ████████████████████ 100%
Manajemen Sesi Guide          ████████████████████ 100%
Q&A / Raise Hand              ████████████████████ 100%
Keamanan (Auth/Security)      ████████████████████ 100%
Expected Participants         ████████████████████ 100%
UX / Notifikasi               ████████████████████ 100%
```

---

## 🎯 Rekomendasi Langkah Selanjutnya

### 🔴 Sebelum Production (Wajib)
~~1. **Hash password** — Implementasi `bcrypt` di login & seed~~ ✅ Done  
~~2. **Halaman Register Guide** — Agar guide bisa daftar mandiri~~ ✅ Done  
~~3. **Fix `isOnline` participant** — Integrasikan dengan LiveKit~~ ✅ Done  
~~4. **Fix `endsAt` raw SQL** — Ganti ke Prisma query~~ ✅ Done  
~~5. **Setup Deployment VPS** — Docker Compose, Nginx Proxy Manager, SSL~~ ✅ Done

### 🟡 Prioritas Sedang
~~6. **Implementasi Expected Participants** — Form Input + Tab "Belum Join"~~ ✅ Done  
~~7. **Share session via WhatsApp** — Tombol bagikan via Web Share API/WA~~ ✅ Done  
~~8. **DevOps Hardening** — Auto-backup DB harian & Healthchecks container~~ ✅ Done

### 🟢 Nice to Have
~~9. **Dark Mode**~~ ✅ Done  
~~10. **Offline Handling**~~ ✅ Done  
~~11. **PWA Auto-Update Prompt**~~ ✅ Done  
12. **Rekaman sesi** — LiveKit Egress recording (Post-MVP)
13. **Analytics dashboard** — Statistik per sesi (Post-MVP)

---

## 🐛 Gotcha & Catatan Deployment

### Prisma Schema Change di Docker

Setiap kali schema Prisma diubah, jalankan perintah berikut agar Docker container mendapat Prisma Client yang terbaru:

```bash
# 1. Push schema ke DB (jalankan dari host, sekali saja)
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartumroh?schema=public" \
  npx prisma db push

# 2. Generate Prisma Client di dalam container
docker exec smartumroh-backend npx prisma generate

# 3. Restart backend
docker restart smartumroh-backend
```

> **Kenapa?** Docker container punya volume `node_modules` yang terisolasi dari host.
> `prisma generate` di host hanya mengupdate `node_modules` lokal, bukan yang ada di dalam container.

### Environment Variables Penting

| Variable | Lokasi | Nilai (Development) |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | `postgresql://postgres:password@db:5432/smartumroh` |
| `LIVEKIT_URL` | `backend/.env` | `ws://localhost:7880` |
| `LIVEKIT_API_KEY` | `backend/.env` | `devkey` |
| `LIVEKIT_API_SECRET` | `backend/.env` | `secretkey123` |
| `JWT_SECRET` | `backend/.env` | `smartumroh-secret-key-2024` |
| `VITE_API_URL` | Frontend env | `http://localhost:8651` |
