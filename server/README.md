# Ledger HR — API Server (MySQL)

An Express backend that gives the React app and the attendance kiosk a real MySQL
database to talk to.

## Prerequisites

A running MySQL server (local install, XAMPP/WAMP, Docker, or a hosted MySQL) and a
user with rights to create databases/tables — or a database already created for you.

## Run it

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your MySQL connection details:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=ledgerhr
```

```bash
npm start
```

On first run the server automatically:

1. Creates the `ledgerhr` database if it doesn't exist yet.
2. Creates the `employees`, `attendance`, `leave_days`, and `users` tables.
3. Seeds the employee roster from `seed-employees.json`.
4. Seeds login accounts — see **Login accounts** below.

The API starts on **http://localhost:4000** (change `PORT` if needed).

> If your MySQL user isn't allowed to `CREATE DATABASE`, just create an empty
> `ledgerhr` database yourself first (phpMyAdmin, MySQL Workbench, or
> `CREATE DATABASE ledgerhr;`) — the server will create the tables inside it either way.

## Connect the frontend to it

In the **project root** (not this folder), edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Restart `npm run dev` in the root folder. `src/api/client.js` will now send every
request to this server — and therefore to MySQL — instead of the local
JSON/localStorage mock. No other code changes needed.

## Routes

| Method | Path                  | Purpose                                   |
|--------|-----------------------|--------------------------------------------|
| POST   | `/api/auth/login`     | `{ name, password }` → `{ token, user }`  |
| POST   | `/api/auth/logout`    | Invalidate a session token                |
| GET    | `/api/employees`      | List all employees                        |
| POST   | `/api/employees`      | Create an employee (HR only)              |
| PUT    | `/api/employees/:id`  | Update an employee (HR only)              |
| DELETE | `/api/employees/:id`  | Delete an employee (HR only)              |
| GET    | `/api/attendance`     | Full attendance log (all punches)         |
| POST   | `/api/attendance`     | Record a punch — `{ employeeId, type }`   |
| GET    | `/api/leave`          | Full vacation-day log                     |
| POST   | `/api/leave`          | Log a vacation day — `{ employeeId, date, reason }` |
| DELETE | `/api/leave/:id`      | Remove a logged vacation day               |
| GET    | `/api/bank-transfers` | Full "forwarded to bank" log              |
| POST   | `/api/bank-transfers` | Forward a payslip to bank (HR only) — `{ employeeId, amount, month }` |
| GET    | `/api/health`         | Health check                              |

"HR only" routes require an `Authorization: Bearer <token>` header from an
`/api/auth/login` response for a user with `role: "hr"` — otherwise they respond
`403`. Sessions live in memory and reset when the server restarts.

Valid `type` values for attendance punches: `in`, `break-start`, `break-end`, `out`.
Salary deduction for break time and vacation days is calculated on the frontend from
this raw data — see `src/payroll.js` in the project root.

## Login accounts

Seeded once on first run, alongside the employee data:

- **HR admin** — name `admin`, password `admin123`
- **One employee account per employee** — their name, password `employee123`

Change these in `server/db.js` (or update the `users` table directly) before using this
for anything real — passwords are hashed with bcrypt, but the demo passwords
themselves are intentionally simple.

## Resetting the data

Drop and recreate the database (or just the four tables) to reset to the seed data —
MySQL doesn't have a single data file to delete like the earlier SQLite version did.

```sql
DROP DATABASE ledgerhr;
```

The tables and seed data are recreated automatically the next time you `npm start`.
