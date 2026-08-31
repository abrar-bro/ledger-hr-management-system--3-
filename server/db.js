const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DB_NAME = process.env.DB_NAME || "ledgerhr";

const rootConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};

// Pool used by every query in server.js, scoped to the app's database.
const pool = mysql.createPool({
  ...rootConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Creates the database (if missing), the tables (if missing), and seeds
// demo employees + login accounts the first time it runs.
async function ensureSchema() {
  // A pool connection can't CREATE DATABASE for itself, so bootstrap with a
  // plain connection first.
  const bootstrap = await mysql.createConnection(rootConfig);
  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await bootstrap.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      department VARCHAR(100) NOT NULL,
      role VARCHAR(150),
      address VARCHAR(255),
      salary INT NOT NULL,
      bankName VARCHAR(150),
      bankAccount VARCHAR(50),
      joinedAt VARCHAR(20),
      updatedAt VARCHAR(40) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(64) PRIMARY KEY,
      employeeId VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      type VARCHAR(20) NOT NULL,
      timestamp VARCHAR(40) NOT NULL,
      INDEX (employeeId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leave_days (
      id VARCHAR(64) PRIMARY KEY,
      employeeId VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      date VARCHAR(20) NOT NULL,
      reason VARCHAR(255),
      createdAt VARCHAR(40) NOT NULL,
      INDEX (employeeId)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(40) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      employeeId VARCHAR(20)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_transfers (
      id VARCHAR(64) PRIMARY KEY,
      employeeId VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      bankName VARCHAR(150),
      bankAccount VARCHAR(50),
      amount INT NOT NULL,
      month VARCHAR(7) NOT NULL,
      forwardedAt VARCHAR(40) NOT NULL,
      UNIQUE KEY employee_month (employeeId, month)
    )
  `);

  // Seed employees once, from the same JSON data the frontend uses. The
  // "updatedAt" in seed-employees.json is ignored on purpose — the moment
  // the database is first seeded becomes each record's real "updated" time.
  const [[{ c: employeeCount }]] = await pool.query("SELECT COUNT(*) AS c FROM employees");
  if (employeeCount === 0) {
    const seedPath = path.join(__dirname, "seed-employees.json");
    const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
    const seededAt = new Date().toISOString();
    for (const emp of seed) {
      await pool.query(
        `INSERT INTO employees (id, name, email, phone, department, role, address, salary, bankName, bankAccount, joinedAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [emp.id, emp.name, emp.email, emp.phone, emp.department, emp.role, emp.address, emp.salary, emp.bankName || null, emp.bankAccount || null, emp.joinedAt, seededAt]
      );
    }
    console.log(`Seeded ${seed.length} employees into "${DB_NAME}"`);
  }

  // Seed login accounts once: one HR admin, plus one employee account per
  // seeded employee. Change these passwords before using this for real.
  const [[{ c: userCount }]] = await pool.query("SELECT COUNT(*) AS c FROM users");
  if (userCount === 0) {
    await pool.query(
      `INSERT INTO users (id, name, passwordHash, role, employeeId) VALUES (?, ?, ?, ?, ?)`,
      ["hr-admin", "admin", bcrypt.hashSync("admin123", 10), "hr", null]
    );

    const [employees] = await pool.query("SELECT id, name FROM employees");
    for (const emp of employees) {
      await pool.query(
        `INSERT INTO users (id, name, passwordHash, role, employeeId) VALUES (?, ?, ?, ?, ?)`,
        [`user-${emp.id}`, emp.name, bcrypt.hashSync("employee123", 10), "employee", emp.id]
      );
    }
    console.log(`Seeded ${employees.length + 1} login accounts (admin/admin123, employees/employee123)`);
  }
}

module.exports = { pool, ensureSchema };
