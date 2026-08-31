require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool, ensureSchema } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const VALID_PUNCH_TYPES = ["in", "break-start", "break-end", "out"];

// In-memory session store: token -> { id, name, role, employeeId }.
// Fine for a small/demo server; swap for a real session store or JWTs
// if you need sessions to survive a server restart.
const sessions = new Map();

function currentUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return sessions.get(token) || null;
}

// HR-only guard for write routes employees shouldn't be able to hit.
function requireHR(req, res, next) {
  const user = currentUser(req);
  if (!user || user.role !== "hr") {
    return res.status(403).json({ error: "HR access required" });
  }
  req.user = user;
  next();
}

// Wraps an async route handler so a rejected promise reaches Express's
// error handler instead of crashing the process.
function h(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function nextEmployeeId() {
  const [rows] = await pool.query("SELECT id FROM employees");
  const max = rows.reduce((m, r) => Math.max(m, Number(String(r.id).replace(/\D/g, "")) || 0), 1000);
  return `EMP-${max + 1}`;
}

// ---------- auth ----------

app.post(
  "/api/auth/login",
  h(async (req, res) => {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: "name and password are required" });
    }
    const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(name) = LOWER(?)", [name.trim()]);
    const row = rows[0];
    if (!row || !bcrypt.compareSync(password, row.passwordHash)) {
      return res.status(401).json({ error: "Invalid name or password" });
    }
    const token = crypto.randomUUID();
    const user = { id: row.id, name: row.name, role: row.role, employeeId: row.employeeId };
    sessions.set(token, user);
    res.json({ token, user });
  })
);

app.post("/api/auth/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  sessions.delete(token);
  res.status(204).end();
});

// ---------- employees ----------

app.get(
  "/api/employees",
  h(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM employees ORDER BY updatedAt DESC");
    res.json(rows);
  })
);

app.post(
  "/api/employees",
  requireHR,
  h(async (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.department || !body.salary) {
      return res.status(400).json({ error: "name, department, and salary are required" });
    }
    const record = {
      id: await nextEmployeeId(),
      name: body.name,
      email: body.email || "",
      phone: body.phone || "",
      department: body.department,
      role: body.role || "",
      address: body.address || "",
      salary: Number(body.salary),
      bankName: body.bankName || "",
      bankAccount: body.bankAccount || "",
      joinedAt: body.joinedAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    await pool.query(
      `INSERT INTO employees (id, name, email, phone, department, role, address, salary, bankName, bankAccount, joinedAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.name, record.email, record.phone, record.department, record.role, record.address, record.salary, record.bankName, record.bankAccount, record.joinedAt, record.updatedAt]
    );
    res.status(201).json(record);
  })
);

app.put(
  "/api/employees/:id",
  requireHR,
  h(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [req.params.id]);
    const existing = rows[0];
    if (!existing) return res.status(404).json({ error: "Employee not found" });

    const updated = {
      ...existing,
      ...req.body,
      salary: req.body.salary !== undefined ? Number(req.body.salary) : existing.salary,
      updatedAt: new Date().toISOString(),
    };
    await pool.query(
      `UPDATE employees SET name=?, email=?, phone=?, department=?, role=?, address=?, salary=?, bankName=?, bankAccount=?, joinedAt=?, updatedAt=?
       WHERE id=?`,
      [updated.name, updated.email, updated.phone, updated.department, updated.role, updated.address, updated.salary, updated.bankName, updated.bankAccount, updated.joinedAt, updated.updatedAt, req.params.id]
    );
    res.json(updated);
  })
);

app.delete(
  "/api/employees/:id",
  requireHR,
  h(async (req, res) => {
    await pool.query("DELETE FROM employees WHERE id = ?", [req.params.id]);
    await pool.query("DELETE FROM attendance WHERE employeeId = ?", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- attendance (in / break-start / break-end / out) ----------

app.get(
  "/api/attendance",
  h(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM attendance ORDER BY timestamp DESC");
    res.json(rows);
  })
);

app.post(
  "/api/attendance",
  h(async (req, res) => {
    const { employeeId, type } = req.body || {};
    if (!employeeId || !VALID_PUNCH_TYPES.includes(type)) {
      return res.status(400).json({ error: `employeeId and a valid type (${VALID_PUNCH_TYPES.join(", ")}) are required` });
    }
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [employeeId]);
    const employee = rows[0];
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const entry = {
      id: crypto.randomUUID(),
      employeeId,
      name: employee.name,
      department: employee.department,
      type,
      timestamp: new Date().toISOString(),
    };
    await pool.query(
      `INSERT INTO attendance (id, employeeId, name, department, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.employeeId, entry.name, entry.department, entry.type, entry.timestamp]
    );
    res.status(201).json(entry);
  })
);

// ---------- vacation / leave days ----------

app.get(
  "/api/leave",
  h(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM leave_days ORDER BY date DESC");
    res.json(rows);
  })
);

app.post(
  "/api/leave",
  h(async (req, res) => {
    const { employeeId, date, reason } = req.body || {};
    if (!employeeId || !date) {
      return res.status(400).json({ error: "employeeId and date are required" });
    }
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [employeeId]);
    const employee = rows[0];
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const entry = {
      id: crypto.randomUUID(),
      employeeId,
      name: employee.name,
      department: employee.department,
      date,
      reason: reason || "",
      createdAt: new Date().toISOString(),
    };
    await pool.query(
      `INSERT INTO leave_days (id, employeeId, name, department, date, reason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.employeeId, entry.name, entry.department, entry.date, entry.reason, entry.createdAt]
    );
    res.status(201).json(entry);
  })
);

app.delete(
  "/api/leave/:id",
  h(async (req, res) => {
    await pool.query("DELETE FROM leave_days WHERE id = ?", [req.params.id]);
    res.status(204).end();
  })
);

// ---------- bank transfers (payslip "forward to bank") ----------

app.get(
  "/api/bank-transfers",
  h(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bank_transfers ORDER BY forwardedAt DESC");
    res.json(rows);
  })
);

app.post(
  "/api/bank-transfers",
  requireHR,
  h(async (req, res) => {
    const { employeeId, amount, month } = req.body || {};
    if (!employeeId || amount === undefined || !month) {
      return res.status(400).json({ error: "employeeId, amount, and month are required" });
    }
    const [rows] = await pool.query("SELECT * FROM employees WHERE id = ?", [employeeId]);
    const employee = rows[0];
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const entry = {
      id: crypto.randomUUID(),
      employeeId,
      name: employee.name,
      bankName: employee.bankName || "",
      bankAccount: employee.bankAccount || "",
      amount: Number(amount),
      month,
      forwardedAt: new Date().toISOString(),
    };
    // One transfer per employee per month — replace if it already exists.
    await pool.query("DELETE FROM bank_transfers WHERE employeeId = ? AND month = ?", [employeeId, month]);
    await pool.query(
      `INSERT INTO bank_transfers (id, employeeId, name, bankName, bankAccount, amount, month, forwardedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.employeeId, entry.name, entry.bankName, entry.bankAccount, entry.amount, entry.month, entry.forwardedAt]
    );
    res.status(201).json(entry);
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Catches errors from any h()-wrapped route above.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ledger HR API (MySQL) running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to set up the database:", err.message);
    process.exit(1);
  });
