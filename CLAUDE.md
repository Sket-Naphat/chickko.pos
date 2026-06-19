# ChickKo POS

ระบบ Point of Sale สำหรับร้านอาหาร/คาเฟ่ ChickKo — รองรับ 2 สาขา (HKT-ภูเก็ต, BKK-กรุงเทพ)

## Tech Stack

- **Frontend:** React 19, Vite 7, React Router DOM 7
- **Styling:** Tailwind CSS 4, DaisyUI 5 (default theme: `autumn`)
- **HTTP Client:** Axios 1.11 พร้อม JWT interceptor
- **Charts:** Chart.js 4.5 + react-chartjs-2
- **Auth:** JWT decode + js-cookie (cookie-based storage)
- **Font:** Kanit (Google Fonts, Thai)
- **Hosting:** Vercel (frontend), Railway (backend API)

## Project Structure

```
chickko.pos/
├── src/
│   ├── App.jsx              # Root router + global loading bar & toast wiring
│   ├── main.jsx             # React entry point (BrowserRouter)
│   ├── pages/               # 21 full-page route components
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── LoadingBar.jsx
│   │   ├── Toast.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── dashboard/       # Dashboard sub-components (graphs, summary cards)
│   │   ├── cost/            # Cost management modals
│   │   ├── stock/           # Stock update modal
│   │   ├── workTime/        # Work time modals
│   │   └── Statement/       # Statement modals
│   ├── lib/
│   │   ├── api.js           # Axios instance: JWT injection, loading state, error handling
│   │   └── dateUtils.js     # Thai date/time formatting (Buddhist calendar)
│   └── services/
│       ├── dashboardService.js  # Data aggregation (daily/monthly/peak hours/top items)
│       └── costService.js       # Cost category & purchase type API calls
└── routes/
    └── RequireAuth.jsx      # JWT route guard (redirects to /login if expired)
```

## Entry Points

- `src/main.jsx` → renders `<App />` wrapped in `<BrowserRouter>`
- `src/App.jsx` → defines all routes, conditionally renders `<Navbar>`, wires global listeners

## Routes

### Public (no auth required)
| Path | Page |
|------|------|
| `/` or `/login` | Login |
| `/register` | Register |
| `/rolling-game` | Rolling Game (lottery) |

### Protected (requires valid JWT)
| Path | Page |
|------|------|
| `/home` | Dashboard menu (role-based) |
| `/dashboard` | Analytics & reporting |
| `/cost` | Cost management |
| `/stock`, `/stockitem`, `/checkstock/:id`, `/stockin/:id` | Inventory |
| `/income`, `/income-detail` | Income tracking |
| `/worktime`, `/timeclock` | Staff time management |
| `/delivery`, `/delivery-detail` | Delivery management |
| `/event`, `/rolling-game-report` | Event management |
| `/statement`, `/statement-income` | Financial statements |

## Key Conventions

- **Auth:** JWT stored in `authToken` cookie; user data in `authData` cookie
- **Multi-branch:** Login sends `X-Site` header (`HKT` or `BKK`)
- **Role levels:** Permission 1 = Owner, 2 = Manager, 3 = Staff (controls menu visibility)
- **API base URL:** Configured in `src/lib/api.js` — comment-swap between localhost and Railway for dev/prod. Should ideally use `.env`
- **Date formatting:** Thai Buddhist year (+543) via `src/lib/dateUtils.js`
- **Language:** Thai throughout UI and code comments

## Common Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Known TODOs

- `src/pages/DeliveryDetail.jsx:442` — TODO: add edit function
- `src/pages/IncomeDetail.jsx:409` — TODO: add edit function
- `src/lib/api.js` — API baseURL hardcoded; should use `import.meta.env.VITE_API_URL`
- No test files exist in the project
