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
│   ├── pages/               # ~21 full-page route components — thin "page shell" only where a domain has been refactored (see Cost), still fat elsewhere (not yet refactored)
│   ├── components/          # Reusable UI components, one lowercase subfolder per feature domain
│   │   ├── common/          # Cross-cutting UI used by 2+ domains: Navbar.jsx, LoadingBar.jsx, LoadingState.jsx, ThemeToggle.jsx
│   │   ├── ui/
│   │   │   └── Toast.jsx    # Toast component (daisyUI alert style, props: show/message/type/position) — used by most pages for action feedback
│   │   ├── dashboard/       # Dashboard sub-components (graphs, summary cards) — NOT YET refactored to the domain-folder convention below
│   │   ├── cost/            # Cost domain — refactored, see below for the full convention
│   │   │   ├── UnpaidCostList.jsx, PaidCostList.jsx   # list views (was one big Cost.jsx)
│   │   │   ├── ModalNewCost.jsx, ModalConfirmPayment.jsx, ConfirmDeleteModal.jsx
│   │   │   ├── hooks/useCostOptions.js                # domain-local hook (fetch category/purchase-type options)
│   │   │   └── utils/costBadge.js                     # domain-local pure helper (category badge color)
│   │   ├── stock/           # Stock update modal — NOT YET refactored
│   │   ├── worktime/        # Work time modals — NOT YET refactored
│   │   └── statement/       # Statement modals — NOT YET refactored
│   ├── lib/                 # Framework-agnostic pure utilities, no backend I/O, no domain coupling — shared by ALL domains
│   │   ├── api.js           # Axios instance: JWT injection, loading state, error handling
│   │   ├── dateUtils.js     # Thai date/time formatting (Buddhist calendar)
│   │   └── formatUtils.js   # Currency/number formatting (formatCurrency)
│   ├── services/            # One file per BACKEND domain, API calls (async, hits `api.js`) ONLY — no formatting/transform logic
│   │   ├── dashboardService.js  # NOT YET cleaned up — currently 100% client-side data transform, no actual API calls despite the name
│   │   └── costService.js       # ✅ Fully cleaned: only functions that call `/cost/*` endpoints
│   └── routes/
│       └── RequireAuth.jsx  # JWT route guard (redirects to /login if expired)
```

### Domain component-folder convention (established on `components/cost/`, apply to every domain going forward)

When a `components/<domain>/` folder accumulates non-component helper code, split it like this:
- `components/<domain>/*.jsx` — components (list views, modals) directly in the domain folder
- `components/<domain>/hooks/*.js` — domain-local custom hooks (e.g. `useCostOptions.js`) — only for hooks specific to that one domain; a hook shared by 2+ *different* domains belongs in a future top-level `src/hooks/`, not here
- `components/<domain>/utils/*.js` — domain-local pure helper functions (e.g. `costBadge.js`) — only if specific to that domain; cross-domain formatting helpers belong in `src/lib/` instead

Don't pre-create empty `hooks/`/`utils/` subfolders for a domain that doesn't need them yet — only split once a domain actually has hook/util files (avoids empty scaffolding). `dashboard/`, `stock/`, `worktime/`, `statement/` are still flat because they haven't been touched yet, not because the convention doesn't apply to them.

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
| `/employee` | Employee management |

## Key Conventions

- **Auth:** JWT stored in `authToken` cookie; user data in `authData` cookie. Read directly via `Cookies.get("authData")` + `JSON.parse` wherever needed (e.g. `Navbar.jsx`) — there's no auth context/provider, no global state library at all (no Redux/Zustand/Context beyond the raw cookie reads)
- **Multi-branch:** Login sends `X-Site` header (`HKT` or `BKK`)
- **Role levels:** Permission 1 = Owner, 2 = Manager, 3 = Staff (controls menu visibility)
- **API base URL:** Configured in `src/lib/api.js` — comment-swap between localhost and Railway for dev/prod. Should ideally use `.env`
- **Date formatting:** Thai Buddhist year (+543) via `src/lib/dateUtils.js` — `lib/dateUtils.js` is the single source now for the Cost domain (`formatDisplayDateLong`, `formatDisplayTime`, migrated out of `costService.js`); `services/dashboardService.js` still has its own near-duplicate formatter, not yet migrated
- **Currency formatting:** `formatCurrency()` in `src/lib/formatUtils.js` — use this instead of raw `.toLocaleString()`; only the Cost domain has been migrated to it so far, other domains (Statement, Delivery, etc.) still call `.toLocaleString()`/`.toFixed()` directly
- **Data fetching:** No consistent data layer yet outside the Cost domain — most pages call `api.get/post/delete(...)` directly inline (inside `useEffect` + local `loading`/`data` state), each with its own try/catch/finally. Only `services/costService.js` is a complete, API-calls-only service; `dashboardService.js` exists but is actually a data-transform module, not an API service; other domains have no service module at all yet
- **Language:** Thai throughout UI and code comments

## Code Style Notes

- **No TypeScript** — plain `.jsx`/`.js`, no PropTypes either; props are undocumented or described via a JSDoc comment block above the component (inconsistently applied)
- **Comments as changelog:** many inline comments are Thai annotations marking *what was changed and why*, prefixed with emoji (`✅`, `👉`) rather than relying on commit messages, e.g. `// ✅ เพิ่มหน้ากิจกรรม`, `// 👉 เปลี่ยนชื่อเป็น StockInDetail เพื่อความชัดเจน`. Follow this convention when making small targeted edits to existing files rather than removing/replacing the pattern
- **Indentation is inconsistent** across files — some use 2 spaces (`api.js`, `Toast.jsx`), others 4 spaces (`Navbar.jsx`). Match the surrounding file rather than a fixed project-wide rule
- **Components:** mostly `function Name() {}` with `export default` at the bottom, or `export default function Name() {}` inline — both patterns appear, pick based on the file being edited
- **Styling:** Tailwind utility classes + daisyUI semantic classes (`btn`, `alert`, `toast`, `base-100`, etc.) written inline in `className`; no CSS modules or styled-components
- **ESLint:** flat config (`eslint.config.js`), `react-hooks` + `react-refresh` plugins, with `no-unused-vars` relaxed for identifiers starting with an uppercase letter or `_`

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
- `src/services/dashboardService.js` — still 100% client-side transform logic (no API calls despite the name) with its own near-duplicate Thai date formatter; needs the same cleanup already done for `costService.js`
- 19 of 22 pages still call `api.*` directly inline instead of through a `services/*.js` module — only Cost is done; Dashboard, Stock, Worktime, Statement, Delivery, Income, Event, Employee still pending
- Only Cost domain has been split into `hooks/`/`utils/` subfolders under `components/cost/` — see the domain component-folder convention above; other domains (`dashboard/`, `stock/`, `worktime/`, `statement/`) still flat, apply the same split once they're touched
- No test files exist in the project
