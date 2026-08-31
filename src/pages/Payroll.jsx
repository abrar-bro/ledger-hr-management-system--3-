import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import StatCard from "../components/StatCard.jsx";
import Payslip from "../components/Payslip.jsx";
import { getEmployees } from "../api/employees";
import { getLog, subscribeToAttendance } from "../api/attendance";
import { deleteVacationDay, getLeaveLog, logVacationDay, subscribeToLeave } from "../api/leave";
import { forwardToBank, getBankTransfers, subscribeToBankTransfers } from "../api/payments";
import { computePayroll, POLICY } from "../payroll";
import { colorFor, formatCurrency, formatDate, initials } from "../utils";

const MONTH_LABEL = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
const todayIso = () => new Date().toISOString().slice(0, 10);

function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function monthKey(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
}

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [leaveLog, setLeaveLog] = useState([]);
  const [bankTransfers, setBankTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [reason, setReason] = useState("");

  const [payslipEmployeeId, setPayslipEmployeeId] = useState(null);
  const [forwarding, setForwarding] = useState(false);

  async function refresh() {
    const [emps, aLog, lLog, transfers] = await Promise.all([
      getEmployees(),
      getLog(),
      getLeaveLog(),
      getBankTransfers(),
    ]);
    setEmployees(emps);
    setAttendanceLog(aLog);
    setLeaveLog(lLog);
    setBankTransfers(transfers);
    setLoading(false);
    setEmpId((prev) => prev || emps[0]?.id || "");
  }

  useEffect(() => {
    refresh();
    const unsubAttendance = subscribeToAttendance(refresh);
    const unsubLeave = subscribeToLeave(refresh);
    const unsubTransfers = subscribeToBankTransfers(refresh);
    return () => {
      unsubAttendance();
      unsubLeave();
      unsubTransfers();
    };
  }, []);

  async function handleLogVacation(e) {
    e.preventDefault();
    const emp = employees.find((x) => x.id === empId);
    if (!emp || !date) return;
    await logVacationDay(emp, date, reason.trim());
    setReason("");
  }

  function transferFor(employeeId) {
    const key = monthKey();
    return bankTransfers.find((t) => t.employeeId === employeeId && t.month === key) || null;
  }

  async function handleForward(employee, amount) {
    setForwarding(true);
    try {
      await forwardToBank(employee, amount);
    } finally {
      setForwarding(false);
    }
  }

  const totalDeduction = employees.reduce(
    (sum, e) => sum + computePayroll(e, attendanceLog, leaveLog).totalDeduction,
    0
  );

  const thisMonthLeave = leaveLog
    .filter((e) => isThisMonth(e.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const payslipEmployee = employees.find((e) => e.id === payslipEmployeeId) || null;

  return (
    <>
      <Topbar
        title="Payroll"
        subtitle={`Break-time and vacation-day deductions for ${MONTH_LABEL}`}
      />
      <div className="page-body">
        <div className="stat-row stat-row-5">
          <StatCard label="Employees" value={employees.length} hint="This month" />
          <StatCard label="Free break / day" value={`${POLICY.freeBreakMinutesPerDay}m`} hint="Per employee" />
          <StatCard label="Free vacation" value={`${POLICY.freeVacationDaysPerMonth}d / mo`} hint="Per employee" />
          <StatCard label="Deduction / day" value={formatCurrency(POLICY.vacationDayDeduction)} hint="After free days" />
          <StatCard label="Total deductions" value={formatCurrency(totalDeduction)} hint="This month" hintTone="warn" />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Log a vacation day</h2>
          </div>
          <div className="panel-body">
            <form className="quick-punch-row" onSubmit={handleLogVacation}>
              <select className="select-input" value={empId} onChange={(e) => setEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="search-input"
                style={{ flex: "0 0 170px" }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                className="search-input"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button type="submit" className="btn btn-amber">
                + Log vacation day
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Monthly salary after deductions</h2>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {!loading && (
              <div className="table-wrap">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Base salary</th>
                      <th>Break excess</th>
                      <th>Vacation days</th>
                      <th>Deductions</th>
                      <th>Final salary</th>
                      <th>Bank</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const p = computePayroll(emp, attendanceLog, leaveLog);
                      const transfer = transferFor(emp.id);
                      return (
                        <tr key={emp.id}>
                          <td>
                            <div className="emp-name-cell">
                              <div className="avatar-chip" style={{ background: colorFor(emp.name) }}>
                                {initials(emp.name)}
                              </div>
                              <div>
                                <div className="emp-name">{emp.name}</div>
                                <div className="emp-role">{emp.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="salary-val">{formatCurrency(p.baseSalary)}</td>
                          <td className="salary-val">{p.excessBreakMinutes}m over</td>
                          <td className="salary-val">
                            {p.vacationDays}d
                            {p.excessVacationDays > 0 && (
                              <span style={{ color: "var(--red-500)", marginLeft: 6, fontSize: 11.5 }}>
                                (+{p.excessVacationDays} unpaid)
                              </span>
                            )}
                          </td>
                          <td
                            className="salary-val"
                            style={{ color: "var(--red-500)" }}
                            title={`Break: -${formatCurrency(p.breakDeduction)} · Vacation: -${formatCurrency(p.vacationDeduction)}`}
                          >
                            {p.totalDeduction > 0 ? `−${formatCurrency(p.totalDeduction)}` : formatCurrency(0)}
                          </td>
                          <td className="salary-val" style={{ fontWeight: 700, color: "var(--ink-950)" }}>
                            {formatCurrency(p.finalSalary)}
                          </td>
                          <td>
                            {transfer ? (
                              <span className="stamp present">Sent</span>
                            ) : (
                              <span className="stamp absent">Pending</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-ghost" onClick={() => setPayslipEmployeeId(emp.id)}>
                              Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Vacation days logged this month</h2>
          </div>
          <div className="panel-body">
            {thisMonthLeave.length === 0 ? (
              <div className="empty-state">No vacation days logged this month.</div>
            ) : (
              <ul className="ledger-list">
                {thisMonthLeave.map((entry) => (
                  <li className="ledger-item" key={entry.id}>
                    <span className="ledger-dot" />
                    <span className="ledger-who">{entry.name}</span>
                    <span>
                      · {formatDate(entry.date)}
                      {entry.reason ? ` — ${entry.reason}` : ""}
                    </span>
                    <button
                      className="timecard-close"
                      style={{ marginLeft: "auto" }}
                      onClick={() => deleteVacationDay(entry.id)}
                      aria-label={`Remove vacation day for ${entry.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--ink-400)", maxWidth: "64ch" }}>
          Policy: {POLICY.freeBreakMinutesPerDay} minutes of break per day are paid; break time
          beyond that is deducted at each employee's per-minute rate. The first{" "}
          {POLICY.freeVacationDaysPerMonth} vacation day(s) per month are paid — every vacation day
          beyond that is deducted at a flat {formatCurrency(POLICY.vacationDayDeduction)} per day.
          Edit these numbers in <code>src/payroll.js</code>.
        </p>
      </div>

      {payslipEmployee && (
        <Payslip
          employee={payslipEmployee}
          payroll={computePayroll(payslipEmployee, attendanceLog, leaveLog)}
          transfer={transferFor(payslipEmployee.id)}
          forwarding={forwarding}
          onClose={() => setPayslipEmployeeId(null)}
          onForward={() =>
            handleForward(payslipEmployee, computePayroll(payslipEmployee, attendanceLog, leaveLog).finalSalary)
          }
        />
      )}
    </>
  );
}
