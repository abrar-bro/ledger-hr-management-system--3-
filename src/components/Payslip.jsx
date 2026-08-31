import { colorFor, formatCurrency, formatDateTime, initials } from "../utils";

const MONTH_LABEL = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function Payslip({ employee, payroll, transfer, onClose, onForward, forwarding }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="timecard payslip-print" role="dialog" aria-modal="true" style={{ maxWidth: 600 }}>
        <div className="timecard-head payslip-no-print">
          <div className="timecard-title-row">
            <div className="timecard-avatar" style={{ background: colorFor(employee.name) }}>
              {initials(employee.name)}
            </div>
            <div>
              <p className="timecard-name">Pay Slip</p>
              <p className="timecard-role">
                {employee.name} · {MONTH_LABEL}
              </p>
            </div>
          </div>
          <button className="timecard-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="timecard-body">
          <div className="payslip-letterhead">
            <div>
              <div className="payslip-company">Ledger HR</div>
              <div className="payslip-doc-title">Pay Slip — {MONTH_LABEL}</div>
            </div>
            <div className="payslip-id">{employee.id}</div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>Employee</label>
              <div className="field-static">{employee.name}</div>
            </div>
            <div className="field">
              <label>Role</label>
              <div className="field-static">{employee.role || "—"}</div>
            </div>
            <div className="field">
              <label>Department</label>
              <div className="field-static">{employee.department}</div>
            </div>
            <div className="field">
              <label>Pay period</label>
              <div className="field-static">{MONTH_LABEL}</div>
            </div>
          </div>

          <table className="payslip-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base salary</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(payroll.baseSalary)}</td>
              </tr>
            </tbody>
          </table>

          <table className="payslip-table">
            <thead>
              <tr>
                <th>Deductions</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Break time over allowance
                  <div className="emp-role">
                    {payroll.excessBreakMinutes}m over {payroll.freeMinutesPerDay}m/day free
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  {payroll.breakDeduction > 0 ? `−${formatCurrency(payroll.breakDeduction)}` : formatCurrency(0)}
                </td>
              </tr>
              <tr>
                <td>
                  Vacation days over allowance
                  <div className="emp-role">
                    {payroll.vacationDays}d taken, {payroll.freeVacationDays}d/month free
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  {payroll.vacationDeduction > 0 ? `−${formatCurrency(payroll.vacationDeduction)}` : formatCurrency(0)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="payslip-net">
            <span>Net pay</span>
            <span>{formatCurrency(payroll.finalSalary)}</span>
          </div>

          <div className="field-grid" style={{ marginTop: 20 }}>
            <div className="field">
              <label>Bank</label>
              <div className="field-static">{employee.bankName || "—"}</div>
            </div>
            <div className="field">
              <label>Account number</label>
              <div className="field-static">{employee.bankAccount || "—"}</div>
            </div>
          </div>

          {transfer && (
            <div className="payslip-forwarded-note">
              ✓ Forwarded to bank on {formatDateTime(transfer.forwardedAt)}
            </div>
          )}

          {!transfer && !employee.bankAccount && (
            <div className="form-error payslip-no-print">
              No bank account on file for {employee.name} — add one from the Employees page
              (click their row → Bank / Account number) to enable forwarding.
            </div>
          )}

          <div className="timecard-footer payslip-no-print">
            <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
            <div className="timecard-footer-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-amber"
                disabled={!!transfer || forwarding || !employee.bankAccount}
                onClick={onForward}
                title={!employee.bankAccount ? "Add a bank account to this employee first" : undefined}
              >
                {transfer ? "Already forwarded" : forwarding ? "Forwarding…" : "Forward to bank"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
