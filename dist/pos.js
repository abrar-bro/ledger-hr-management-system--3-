// Ledger HR — Attendance POS Kiosk
// Plain HTML/CSS/JS, no build step, no framework. Reads the same
// /employees.json mock data as the React dashboard and writes punches to
// the same localStorage key, so both sides of the app stay in sync.
(function () {
  "use strict";

  const LOG_KEY = "ledgerhr_attendance_log";
  const AVATAR_COLORS = ["#e3993c", "#4b8f63", "#3f6fae", "#bd4f3c", "#8d5fd3", "#2b8fa3"];

  const els = {
    time: document.getElementById("kiosk-time"),
    date: document.getElementById("kiosk-date"),
    search: document.getElementById("kiosk-search"),
    keypad: document.getElementById("keypad"),
    status: document.getElementById("punch-status"),
    card: document.getElementById("employee-card"),
    btnIn: document.getElementById("btn-in"),
    btnBreakStart: document.getElementById("btn-break-start"),
    btnBreakEnd: document.getElementById("btn-break-end"),
    btnOut: document.getElementById("btn-out"),
    log: document.getElementById("punch-log"),
  };

  let employees = [];
  let matched = null;

  // ---------- clock ----------
  function tickClock() {
    const now = new Date();
    els.time.textContent = now.toLocaleTimeString("en-US");
    els.date.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---------- data ----------
  function loadEmployees() {
    return fetch("/employees.json")
      .then((res) => res.json())
      .then((data) => {
        employees = data;
      })
      .catch(() => {
        setStatus("Could not load employee data.", "err");
      });
  }

  function readLog() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeLog(log) {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    window.dispatchEvent(new Event("ledgerhr:attendance-updated"));
  }

  function todaysLog() {
    const today = new Date().toDateString();
    return readLog().filter((e) => new Date(e.timestamp).toDateString() === today);
  }

  // Punch types are: "in", "break-start", "break-end", "out".
  function statusFor(employeeId) {
    const mine = todaysLog().filter((e) => e.employeeId === employeeId);
    if (!mine.length) return "out";
    const latest = mine[0].type; // newest first
    if (latest === "break-start") return "break";
    if (latest === "in" || latest === "break-end") return "in";
    return "out";
  }

  const STATUS_LABEL = { in: "Clocked in", break: "On break", out: "Clocked out" };
  const PUNCH_LABEL = { in: "In", out: "Out", "break-start": "Break start", "break-end": "Break end" };

  // ---------- helpers ----------
  function initials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }

  function colorFor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  function setStatus(message, tone) {
    els.status.textContent = message;
    els.status.className = "punch-status" + (tone ? " " + tone : "");
  }

  // ---------- keypad ----------
  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "EMP-"];
  KEYS.forEach((key) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "keypad-btn" + (key === "EMP-" ? " wide" : "");
    btn.textContent = key;
    btn.addEventListener("click", () => {
      if (key === "⌫") {
        els.search.value = els.search.value.slice(0, -1);
      } else {
        els.search.value += key;
      }
      els.search.dispatchEvent(new Event("input"));
      els.search.focus();
    });
    els.keypad.appendChild(btn);
  });

  // ---------- search / match ----------
  function findEmployee(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (
      employees.find((e) => e.id.toLowerCase() === q) ||
      employees.find((e) => e.name.toLowerCase() === q) ||
      employees.find((e) => e.name.toLowerCase().includes(q)) ||
      null
    );
  }

  function renderEmployeeCard() {
    if (!matched) {
      els.card.className = "employee-card empty";
      els.card.innerHTML =
        '<div class="employee-placeholder"><span class="employee-placeholder-icon">🪪</span>Employee details will appear here once found.</div>';
      els.btnIn.disabled = true;
      els.btnBreakStart.disabled = true;
      els.btnBreakEnd.disabled = true;
      els.btnOut.disabled = true;
      return;
    }

    const status = statusFor(matched.id);
    els.card.className = "employee-card";
    els.card.innerHTML = `
      <div class="employee-avatar" style="background:${colorFor(matched.name)}">${initials(matched.name)}</div>
      <div>
        <div class="employee-info-name">${matched.name}</div>
        <div class="employee-info-role">${matched.role} · ${matched.department}</div>
        <span class="employee-info-status ${status}">${STATUS_LABEL[status]}</span>
      </div>
    `;
    els.btnIn.disabled = status !== "out";
    els.btnBreakStart.disabled = status !== "in";
    els.btnBreakEnd.disabled = status !== "break";
    els.btnOut.disabled = status !== "in";
  }

  function renderLog() {
    const entries = todaysLog();
    if (!entries.length) {
      els.log.innerHTML = '<li class="punch-log-empty">No punches yet today.</li>';
      return;
    }
    els.log.innerHTML = entries
      .slice(0, 12)
      .map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `
          <li>
            <strong>${entry.name}</strong>
            <span class="punch-log-time">${entry.department}</span>
            <span class="punch-log-time">${time}</span>
            <span class="punch-log-type ${entry.type}">${PUNCH_LABEL[entry.type] || entry.type}</span>
          </li>
        `;
      })
      .join("");
  }

  function handlePunch(type) {
    if (!matched) return;
    const log = readLog();
    log.unshift({
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      employeeId: matched.id,
      name: matched.name,
      department: matched.department,
      type,
      timestamp: new Date().toISOString(),
    });
    writeLog(log);
    const verb =
      type === "in" ? "clocked in" : type === "out" ? "clocked out" : type === "break-start" ? "started a break" : "ended their break";
    setStatus(`${matched.name} ${verb} ✓`, "ok");
    els.search.value = "";
    matched = null;
    renderEmployeeCard();
    renderLog();
    setTimeout(() => setStatus("Waiting for ID…"), 2500);
  }

  // ---------- events ----------
  els.search.addEventListener("input", () => {
    matched = findEmployee(els.search.value);
    if (els.search.value.trim() && !matched) {
      setStatus("No matching employee found.", "err");
    } else if (matched) {
      setStatus(`Found ${matched.name}. Ready to punch.`, "ok");
    } else {
      setStatus("Waiting for ID…");
    }
    renderEmployeeCard();
  });

  els.search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && matched) {
      const status = statusFor(matched.id);
      // Enter only handles the unambiguous cases; on-break requires an explicit tap.
      if (status === "out") handlePunch("in");
      else if (status === "in") handlePunch("out");
    }
  });

  els.btnIn.addEventListener("click", () => handlePunch("in"));
  els.btnBreakStart.addEventListener("click", () => handlePunch("break-start"));
  els.btnBreakEnd.addEventListener("click", () => handlePunch("break-end"));
  els.btnOut.addEventListener("click", () => handlePunch("out"));

  window.addEventListener("storage", (e) => {
    if (e.key === LOG_KEY) {
      renderEmployeeCard();
      renderLog();
    }
  });

  // ---------- init ----------
  loadEmployees().then(() => {
    renderEmployeeCard();
    renderLog();
    els.search.focus();
  });
})();
