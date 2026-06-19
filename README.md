# ChickKo POS

ระบบ Point of Sale สำหรับจัดการหลังบ้านร้านอาหาร ChickKo รองรับ 2 สาขา (ภูเก็ต HKT / กรุงเทพ BKK)

---

## Features

- **Dashboard & Analytics** — ดูยอดขาย ต้นทุน กำไร รายวัน/รายเดือน พร้อมกราฟ peak hours และสินค้าขายดี
- **Cost Management** — บันทึกรายจ่ายแยกหมวดหมู่ ติดตามสถานะการชำระเงิน
- **Inventory** — จัดการสต็อกสินค้า นับสต็อก รับสินค้าเข้า
- **Income & Delivery** — บันทึกยอดขาย Dine-in และออเดอร์ Delivery รายวัน
- **Staff Time Tracking** — Clock in/out พนักงาน ดูประวัติเวลาทำงาน คำนวณค่าจ้าง
- **Financial Statement** — งบสรุปรายรับ-รายจ่ายรายเดือน
- **Rolling Game** — ระบบสุ่มรางวัลสำหรับลูกค้า (หน้า public ไม่ต้อง login)
- **Role-based Access** — แบ่งสิทธิ์ Owner / Manager / Staff

---

## Tech Stack

| Category | Library |
|----------|---------|
| Framework | React 19 + Vite 7 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| HTTP Client | Axios 1.11 |
| Charts | Chart.js 4.5 + react-chartjs-2 |
| Auth | JWT (jwt-decode) + js-cookie |
| Icons | React Icons 5 |
| Hosting | Vercel (frontend) + Railway (backend API) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Sket-Naphat/chickko.pos.git
cd chickko.pos
npm install
```

### Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
VITE_API_URL=https://chickkoapi.up.railway.app/api
```

> หรือจะสลับ base URL ใน `src/lib/api.js` โดยตรง (uncomment บรรทัดที่ต้องการ)

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview   # preview build ก่อน deploy
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
chickko.pos/
├── public/
├── routes/
│   └── RequireAuth.jsx          # Route guard ตรวจ JWT ก่อนเข้าหน้า protected
├── src/
│   ├── App.jsx                  # Root router + wiring global loading & toast
│   ├── main.jsx                 # Entry point
│   ├── pages/                   # หน้าหลักทุกหน้า (21 pages)
│   ├── components/              # UI components แยกตาม feature
│   │   ├── Navbar.jsx
│   │   ├── LoadingBar.jsx
│   │   ├── Toast.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── dashboard/           # กราฟและการ์ดสรุปสำหรับ Dashboard
│   │   ├── cost/                # Modal สำหรับ Cost management
│   │   ├── stock/               # Modal อัปเดต Stock item
│   │   ├── workTime/            # Modal และตาราง Worktime
│   │   └── Statement/           # Modal สำหรับ Statement income
│   ├── lib/
│   │   ├── api.js               # Axios instance (JWT inject, loading, error handler)
│   │   └── dateUtils.js         # แปลงวันที่ไทย (พ.ศ.)
│   └── services/
│       ├── dashboardService.js  # คำนวณและ aggregate ข้อมูล dashboard
│       └── costService.js       # เรียก API หมวดหมู่ cost
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Pages & Routes

### Public (ไม่ต้อง Login)

| Route | หน้า |
|-------|------|
| `/` `/login` | หน้า Login — เลือกสาขา HKT / BKK |
| `/register` | สมัครสมาชิก |
| `/rolling-game` | สุ่มรางวัลสำหรับลูกค้า |

### Protected (ต้อง Login)

| Route | หน้า | สิทธิ์ |
|-------|------|--------|
| `/home` | เมนูหลัก | ทุกคน |
| `/dashboard` | Analytics & รายงาน | Owner |
| `/cost` | บันทึกรายจ่าย | Owner |
| `/stock` | สต็อกสินค้า | Manager+ |
| `/stockitem` | รายการสินค้าในสต็อก | Manager+ |
| `/checkstock/:id` | นับสต็อก | Manager+ |
| `/stockin/:id` | รับสินค้าเข้า | Manager+ |
| `/income` | รายได้ Dine-in รายวัน | Owner |
| `/income-detail` | รายละเอียดออเดอร์ | Owner |
| `/delivery` | ออเดอร์ Delivery | Owner |
| `/delivery-detail` | รายละเอียด Delivery | Owner |
| `/worktime` | ประวัติเวลาทำงาน | Manager+ |
| `/timeclock` | Clock In / Clock Out | ทุกคน |
| `/statement` | งบการเงิน | Owner |
| `/statement-income` | รายรับ (Statement) | Owner |
| `/event` | จัดการ Event | Manager+ |
| `/rolling-game-report` | รายงานผลสุ่มรางวัล | Manager+ |

---

## Authentication

- ใช้ **JWT** เก็บใน cookie (`authToken`, `authData`)
- ทุก request จะแนบ `Authorization: Bearer <token>` อัตโนมัติ
- Token หมดอายุ → logout และ redirect `/login` ทันที
- เลือกสาขาตอน login → ส่ง `X-Site: HKT` หรือ `X-Site: BKK` ใน header

### Permission Levels

| Level | Role | สิทธิ์ |
|-------|------|--------|
| 1 | Owner | เข้าได้ทุกหน้า รวม Dashboard, Cost, Statement |
| 2 | Manager | Stock, Worktime, Event |
| 3 | Staff | TimeClock, Stock (จำกัด) |

---

## API Overview

Backend: `https://chickkoapi.up.railway.app/api`

| Resource | Methods | คำอธิบาย |
|----------|---------|----------|
| `/auth` | POST, GET | Login, Register, ดึงรายชื่อพนักงาน |
| `/cost` | GET, POST, DELETE | รายจ่าย, หมวดหมู่, ประเภทการซื้อ, ค่าจ้าง |
| `/stock` | GET, POST | สต็อก, นับสต็อก, รับสินค้าเข้า |
| `/orders` | POST | รายงานยอดขาย Dine-in และ Delivery |
| `/worktime` | POST | บันทึก/แก้ไข/ดูเวลาทำงาน |
| `/statement` | GET, POST, PUT, DELETE | รายรับ-รายจ่ายในงบการเงิน |
| `/event` | GET, POST, PUT, DELETE | รางวัลและรายงาน Rolling Game |

---

## Themes

DaisyUI รองรับ 3 theme:

- `autumn` (default)
- `light`
- `business`

สลับได้ผ่านปุ่ม ThemeToggle มุมบนขวา
