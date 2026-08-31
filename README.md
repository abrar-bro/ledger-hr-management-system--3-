# Ledger HR — Employee & Attendance Management System

A small, self-contained HR admin system:

- **Login** (React) — HR admins and employees sign in with a name and password. HR gets
  full access; employees get a read-only employee directory.
- **Admin Dashboard** (React + Vite) — stats, department breakdown, live activity ledger.
- **Employees** (React) — full roster with ID, name, address, department, salary, and
  "updated at", plus add / edit / delete.
- **Attendance POS** (plain HTML/CSS/JavaScript, no framework, no build step) — a
  full-screen kiosk for clocking in, taking a break, ending a break, and clocking out,
  meant to run on a tablet at the front desk.
- **Payroll** (React) — automatically deducts salary for break time beyond a free daily
  allowance, and shows each employee's final salary for the month.
- **API server** (`server/`) — an optional Express + MySQL backend, so the whole system
  can run against a real database instead of mock data.
- Ships with realistic **JSON mock data** and a thin API layer, so it runs 100% offline
  today and can be pointed at the included backend (or your own) later by editing one
  `.env` file.

Design direction: a "punch card / ledger" aesthetic — dashed perforation edges, a
rotated rubber-stamp status badge, monospace figures for IDs and money, and an amber
accent on a warm paper background, with a dark ink sidebar and kiosk screen.

---

## 1. Install & run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

This starts the React dashboard at **http://localhost:5173**.

The attendance kiosk is a plain static page — open it directly in the browser, or click
**"Launch kiosk"** on the Attendance page:

```
http://localhost:5173/pos.html
```

(In production it's just a static HTML file — you can also open
`dist/pos.html` after `npm run build`, or host it on any server / kiosk device.)

## 2. Project structure

```
hr-management-system/
├─ index.html                 # Vite entry (React admin dashboard)
├─ public/
│  ├─ employees.json          # Shared mock data (used by React AND the kiosk)
│  ├─ pos.html                # Attendance POS kiosk — plain HTML
│  ├─ pos.css                 # Kiosk styling
│  └─ pos.js                  # Kiosk logic — plain vanilla JavaScript
├─ src/
│  ├─ main.jsx                # React entry point
│  ├─ App.jsx                 # Login gate + role-based routing (no external router lib)
│  ├─ payroll.js              # Break-time & vacation-day → salary deduction calculation
│  ├─ api/
│  │  ├─ client.js            # fetch wrapper, switches on VITE_API_BASE_URL
│  │  ├─ session.js           # localStorage session (logged-in user + token)
│  │  ├─ auth.js              # login / logout, demo credentials or real API
│  │  ├─ employees.js         # getEmployees / create / update / delete
│  │  ├─ attendance.js        # getLog / punch / getStatus (localStorage-backed)
│  │  ├─ leave.js             # getLeaveLog / logVacationDay / deleteVacationDay
│  │  └─ payments.js          # getBankTransfers / forwardToBank (payslip bank action)
│  ├─ components/             # Sidebar, Topbar, StatCard, EmployeeTable, EmployeeModal, Payslip…
│  ├─ pages/                  # Login.jsx, Dashboard.jsx, Employees.jsx, Attendance.jsx, Payroll.jsx
│  ├─ styles/
│  │  ├─ tokens.css           # Design tokens: color, type, radius, shadow
│  │  └─ components.css       # All component styling
│  └─ utils.js                # formatCurrency, formatDate, initials, colorFor…
├─ server/                    # Optional Express + MySQL backend — see server/README.md
├─ .env.example                # Copy to .env when you connect a real API
└─ package.json
```

## 3. Logging in

Two roles, one login screen:

| Role     | How to sign in                              | What they can do |
|----------|-----------------------------------------------|-------------------|
| HR admin | name `admin`, password `admin123`             | Everything — Dashboard, Employees (add/edit/delete), Attendance, Payroll |
| Employee | their full name (e.g. `Sarah Chen`), password `employee123` | View-only Employees directory — no add/edit/delete, no Dashboard/Attendance/Payroll |

These are demo credentials for local mode. Once connected to `server/` (or your own
backend), real accounts come from the `users` table — see `server/db.js`. The signed-in
name and role show in the sidebar, with a **Log out** button underneath.

## 4. How the mock data works

- `public/employees.json` is the single source of truth for employee records. Both the
  React app (`src/api/employees.js`) and the kiosk (`public/pos.js`) fetch it directly, so
  there's only one file to edit if you want to change the demo roster.
- Attendance punches are written to `localStorage` under the key
  `ledgerhr_attendance_log`. Because the React dashboard and the kiosk page run on the
  same origin, a clock-in at `/pos.html` shows up on the **Attendance** and **Dashboard**
  pages immediately (a custom event + the `storage` event keep everything in sync).
- Adding/editing/deleting an employee in the React app updates an in-memory copy of the
  roster for the current session (there's no backend yet to persist it to).

## 5. Break time, vacation days & payroll

Attendance punches are one of four types: `in`, `break-start`, `break-end`, `out` —
available both on the **Attendance** page (Quick punch) and on the kiosk
(`/pos.html`). Vacation days are logged separately, per employee per date, from the
**Payroll** page. Together they drive the payroll math:

- Break time gets **60 free minutes per day**; beyond that it's deducted at the
  employee's per-minute rate (`salary ÷ 22 working days ÷ 8-hour day`).
- Vacation days get **2 free days per month** — every vacation day beyond that is
  deducted at a **flat ৳300 per day**. Both numbers (`freeVacationDaysPerMonth` and
  `vacationDayDeduction`) live in `POLICY` in `src/payroll.js`.
- The **Payroll** page shows, per employee: base salary, break time over the daily
  allowance, vacation days taken this month, the combined deduction, and the
  **final salary** — all recalculated live from the attendance and leave logs.

This logic lives entirely in `src/payroll.js` (pure functions, no side effects) so it
works the same whether the underlying data is coming from `localStorage` or a real API.

**Pay slips & bank forwarding** — click **Payslip** on any row in the Payroll table to
open a printable pay slip (base salary, deduction breakdown, net pay, bank account) for
that employee's current month. **Print / Save as PDF** uses the browser's native print
dialog — no extra dependency. **Forward to bank** simulates sending that month's net pay
to the employee's bank account (`bankName` / `bankAccount` on their record, editable from
the Employees page) and records it so it can't be sent twice for the same month; this is
a simulation, not a real banking integration — wire `src/api/payments.js` up to your
actual payment provider's API when you're ready to send real transfers.

## 6. Connecting a real database

This project includes an optional backend in `server/` — **Express + MySQL** — so you
can go from mock data to a real database in a couple of minutes:

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your MySQL connection details (host, user, password, database name),
then:

```bash
npm start
```

The server creates the database, tables, and seed data automatically on first run —
see `server/README.md` for details and troubleshooting.

Then, in the **project root**, point the frontend at it:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Restart `npm run dev`. `src/api/client.js` automatically routes every call through
`fetch` to the server instead of the local JSON/localStorage, using:

- `GET /employees`, `POST /employees`, `PUT /employees/:id`, `DELETE /employees/:id`
- `GET /attendance`, `POST /attendance` — `type` is one of `in`, `break-start`,
  `break-end`, `out`
- `GET /leave`, `POST /leave` — `{ employeeId, date, reason }`, `DELETE /leave/:id`

No component code needs to change — `src/pages/*.jsx` only ever calls the functions in
`src/api/*.js`. See `server/README.md` for full route docs. If you'd rather use a
different database (Postgres, MongoDB, etc.) instead of the included MySQL server, just
point `VITE_API_BASE_URL` at that instead — the frontend doesn't care which database is
behind the API, as long as the routes and response shapes match.

For the kiosk (`public/pos.js`), swap the `fetch("/employees.json")` and the
`localStorage` read/write calls for calls to your API in the same way — it's kept
framework-free on purpose so it can run on lightweight kiosk hardware.

## 7. Notes

- No UI library or router dependency — navigation is a simple `useState` switch in
  `App.jsx`, and every visual element is hand-styled in `src/styles/components.css` to
  keep the project genuinely small and easy to read end to end.
- Fonts (Space Grotesk, IBM Plex Mono, Inter) load from Google Fonts; swap the `<link>`
  tags in `index.html` / `public/pos.html` if you need to self-host them.
