import { useState } from "react";
import { colorFor, formatCurrency, formatDate, initials } from "../utils";

const DEPARTMENTS = ["Engineering", "Design", "Sales", "Human Resources", "Finance", "Operations"];

const emptyForm = {
  name: "",
  role: "",
  department: DEPARTMENTS[0],
  email: "",
  phone: "",
  address: "",
  salary: "",
  bankName: "",
  bankAccount: "",
  joinedAt: new Date().toISOString().slice(0, 10),
};

export default function EmployeeModal({ employee, onClose, onSave, onDelete, readOnly = false }) {
  const isNew = !employee;
  const [form, setForm] = useState(
    employee
      ? {
          name: employee.name,
          role: employee.role,
          department: employee.department,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          salary: employee.salary,
          bankName: employee.bankName || "",
          bankAccount: employee.bankAccount || "",
          joinedAt: employee.joinedAt,
        }
      : emptyForm
  );
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.department || !form.salary) {
      setError("Name, department, and salary are required.");
      return;
    }
    setError("");
    onSave({ ...form, salary: Number(form.salary) });
  }

  // Employees only get to view their own / colleagues' details — no editing.
  if (readOnly && employee) {
    return (
      <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="timecard" role="dialog" aria-modal="true">
          <div className="timecard-head">
            <div className="timecard-title-row">
              <div className="timecard-avatar" style={{ background: colorFor(employee.name) }}>
                {initials(employee.name)}
              </div>
              <div>
                <p className="timecard-name">{employee.name}</p>
                <p className="timecard-role">
                  {employee.role} · {employee.id}
                </p>
              </div>
            </div>
            <button className="timecard-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="timecard-body">
            <div className="field-grid">
              <div className="field">
                <label>Department</label>
                <div className="field-static">{employee.department}</div>
              </div>
              <div className="field">
                <label>Salary</label>
                <div className="field-static">{formatCurrency(employee.salary)}</div>
              </div>
              <div className="field">
                <label>Email</label>
                <div className="field-static">{employee.email || "—"}</div>
              </div>
              <div className="field">
                <label>Phone</label>
                <div className="field-static">{employee.phone || "—"}</div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Address</label>
                <div className="field-static">{employee.address || "—"}</div>
              </div>
              <div className="field">
                <label>Bank</label>
                <div className="field-static">{employee.bankName || "—"}</div>
              </div>
              <div className="field">
                <label>Account number</label>
                <div className="field-static">{employee.bankAccount || "—"}</div>
              </div>
              <div className="field">
                <label>Employee ID</label>
                <div className="field-static">{employee.id}</div>
              </div>
              <div className="field">
                <label>Last updated</label>
                <div className="field-static">{formatDate(employee.updatedAt)}</div>
              </div>
            </div>

            <div className="timecard-footer" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="timecard" role="dialog" aria-modal="true">
        <div className="timecard-head">
          <div className="timecard-title-row">
            <div className="timecard-avatar" style={{ background: colorFor(form.name || "New") }}>
              {initials(form.name) || "＋"}
            </div>
            <div>
              <p className="timecard-name">{isNew ? "New employee" : employee.name}</p>
              <p className="timecard-role">
                {isNew ? "Create a record" : `${employee.role} · ${employee.id}`}
              </p>
            </div>
          </div>
          <button className="timecard-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="timecard-body" onSubmit={handleSubmit}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="f-name">Full name</label>
              <input
                id="f-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Jordan Rivera"
              />
            </div>
            <div className="field">
              <label htmlFor="f-role">Role / title</label>
              <input
                id="f-role"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                placeholder="Product Designer"
              />
            </div>

            <div className="field">
              <label htmlFor="f-dept">Department</label>
              <select id="f-dept" value={form.department} onChange={(e) => update("department", e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-salary">Monthly salary (৳)</label>
              <input
                id="f-salary"
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => update("salary", e.target.value)}
                placeholder="95000"
              />
            </div>

            <div className="field">
              <label htmlFor="f-email">Email</label>
              <input
                id="f-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="jordan@company.com"
              />
            </div>
            <div className="field">
              <label htmlFor="f-phone">Phone</label>
              <input
                id="f-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 415 555 0100"
              />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="f-address">Address</label>
              <input
                id="f-address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street, city, state"
              />
            </div>

            <div className="field">
              <label htmlFor="f-bank-name">Bank name</label>
              <input
                id="f-bank-name"
                value={form.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                placeholder="Dutch-Bangla Bank"
              />
            </div>
            <div className="field">
              <label htmlFor="f-bank-account">Account number</label>
              <input
                id="f-bank-account"
                value={form.bankAccount}
                onChange={(e) => update("bankAccount", e.target.value)}
                placeholder="1012 3456 7891"
              />
            </div>

            <div className="field">
              <label>Employee ID</label>
              <div className="field-static">{isNew ? "auto-generated on save" : employee.id}</div>
            </div>
            <div className="field">
              <label>Last updated</label>
              <div className="field-static">{isNew ? "will be set on save" : formatDate(employee.updatedAt)}</div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="timecard-footer">
            <div>
              {!isNew && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onDelete(employee.id)}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="timecard-footer-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-amber">
                {isNew ? "Add employee" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
