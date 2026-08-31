# Build prompt used for this project

You can reuse or adapt this prompt with any AI coding tool to regenerate or extend
this project.

---

You are a UI/UX designer and full-stack frontend developer. Build a **small, clean HR
Management System** with two parts:

1. **Admin Dashboard** — built with **React** (Vite, no router library, no UI kit):
   - Sidebar navigation: Dashboard, Employees, Attendance.
   - **Dashboard**: key stats (total employees, departments, present today, average
     salary), a department breakdown chart, and a live activity ledger.
   - **Employees**: a searchable/filterable table showing, for every employee, their
     **ID, name, address, salary, department, and "updated at"** timestamp. Support
     viewing full details plus add / edit / delete through a modal.
   - Load data from a local **JSON file** as mock data, structured so it's a drop-in
     swap for a real REST API later.

2. **Attendance POS** — a standalone kiosk screen built with **plain HTML, CSS, and
   vanilla JavaScript** (no framework, no build step): live clock, employee lookup by
   ID or name, a numeric keypad, and big Clock In / Clock Out buttons, with a scrolling
   log of today's punches. It should read the same employee JSON data as the React app
   and share attendance records with it (e.g. via `localStorage`) so both stay in sync.

**Requirements:**
- Keep the project intentionally small — as few files and dependencies as reasonable,
  but complete and production-shaped.
- Set up a `.env.example` documenting exactly how to point the app at a real API
  (base URL + key) later, and isolate all data-fetching in a small `api/` layer so
  swapping mock data for a live API touches only that layer.
- Design it to be genuinely **beautiful and distinctive** — pick a real design
  direction tied to the subject matter (this project uses a "punch card / ledger"
  theme: dashed perforation edges, a rotated rubber-stamp status badge, monospace
  figures for IDs/money, warm paper background, dark "ink" sidebar and kiosk screen),
  not a generic dashboard template. Responsive down to mobile, visible focus states.
- Package everything as a ready-to-run project with a README covering install, run,
  file structure, and how to connect a real backend.

---

Feel free to hand this same prompt to Claude (or another AI tool) later with changes
like "add a payroll page" or "connect this to a Postgres + Express API" to extend the
project the same way it was built.
