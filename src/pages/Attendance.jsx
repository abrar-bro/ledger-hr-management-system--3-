import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import StatCard from "../components/StatCard.jsx";
import { getEmployees } from "../api/employees";
import { getStatus, getTodayLog, punch, subscribeToAttendance } from "../api/attendance";
import { colorFor, formatDateTime, initials, punchLabel } from "../utils";

const STATUS_TEXT = { in: "clocked in", break: "on break", out: "clocked out" };

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [todayLog, setTodayLog] = useState([]);
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState(null);
  const [status, setStatus] = useState("out");

  async function refresh() {
    const [emps, log] = await Promise.all([getEmployees(), getTodayLog()]);
    setEmployees(emps);
    setTodayLog(log);
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToAttendance(refresh);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setMatch(null);
      return;
    }
    const found = employees.find(
      (e) => e.id.toLowerCase() === q || e.name.toLowerCase().includes(q)
    );
    setMatch(found || null);
  }, [query, employees]);

  useEffect(() => {
    if (!match) return;
    getStatus(match.id).then(setStatus);
  }, [match, todayLog]);

  const stats = useMemo(() => {
    const latestByEmployee = {};
    // todayLog is newest-first, so the first entry seen per employee is the latest
    todayLog.forEach((e) => {
      if (!(e.employeeId in latestByEmployee)) latestByEmployee[e.employeeId] = e.type;
    });
    let present = 0;
    let onBreak = 0;
    Object.values(latestByEmployee).forEach((type) => {
      if (type === "break-start") {
        present += 1;
        onBreak += 1;
      } else if (type === "in" || type === "break-end") {
        present += 1;
      }
    });
    const notClockedIn = Math.max(employees.length - Object.keys(latestByEmployee).length, 0);
    return { present, onBreak, punches: todayLog.length, notClockedIn };
  }, [employees, todayLog]);

  async function handlePunch(type) {
    if (!match) return;
    await punch(match, type);
    setQuery("");
  }

  return (
    <>
      <Topbar title="Attendance" subtitle="Clock-ins, breaks, clock-outs, and today's kiosk activity." />
      <div className="page-body">
        <div className="kiosk-banner">
          <div>
            <p className="kiosk-banner-title">Attendance POS Kiosk</p>
            <p className="kiosk-banner-sub">
              A full-screen, touch-friendly clock-in station built in plain HTML/CSS/JS — perfect
              for a tablet at the front desk. It shares the same attendance log as this dashboard.
            </p>
          </div>
          <a className="btn btn-amber" href="/pos.html" target="_blank" rel="noreferrer">
            Launch kiosk ↗
          </a>
        </div>

        <div className="attendance-summary">
          <StatCard label="Present now" value={stats.present} hint="Clocked in, not yet out" hintTone="up" />
          <StatCard label="On break" value={stats.onBreak} hint="Currently on a break" hintTone="warn" />
          <StatCard label="Punches today" value={stats.punches} hint="In / break / out events" />
          <StatCard label="Not clocked in" value={stats.notClockedIn} hint="Out of full roster" hintTone="warn" />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Quick punch</h2>
          </div>
          <div className="panel-body">
            <div className="quick-punch-row">
              <input
                className="search-input"
                placeholder="Search employee by name or ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                list="attendance-names"
              />
              <datalist id="attendance-names">
                {employees.map((e) => (
                  <option key={e.id} value={e.name} />
                ))}
              </datalist>
              <button className="btn btn-primary" disabled={!match || status !== "out"} onClick={() => handlePunch("in")}>
                Clock in
              </button>
              <button className="btn btn-amber" disabled={!match || status !== "in"} onClick={() => handlePunch("break-start")}>
                Start break
              </button>
              <button className="btn btn-ghost" disabled={!match || status !== "break"} onClick={() => handlePunch("break-end")}>
                End break
              </button>
              <button className="btn btn-danger" disabled={!match || status !== "in"} onClick={() => handlePunch("out")}>
                Clock out
              </button>
            </div>
            {match && (
              <div className="ledger-item" style={{ paddingTop: 14 }}>
                <div className="avatar-chip" style={{ background: colorFor(match.name) }}>
                  {initials(match.name)}
                </div>
                <span className="ledger-who">{match.name}</span>
                <span>· {match.department}</span>
                <span className="ledger-meta">currently {STATUS_TEXT[status]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Today's log</h2>
          </div>
          <div className="panel-body">
            {todayLog.length === 0 ? (
              <div className="empty-state">No punches recorded yet today.</div>
            ) : (
              <ul className="ledger-list">
                {todayLog.map((entry) => (
                  <li className="ledger-item" key={entry.id}>
                    <span className="ledger-dot" />
                    <span className="ledger-who">{entry.name}</span>
                    <span>{punchLabel(entry.type)}</span>
                    <span className="ledger-meta">{formatDateTime(entry.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
