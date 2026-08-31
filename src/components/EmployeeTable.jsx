import { colorFor, formatCurrency, formatDateTime, initials, timeAgo } from "../utils";

export default function EmployeeTable({ employees, onSelect }) {
  if (!employees.length) {
    return <div className="empty-state">No employees match your search.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="emp-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Department</th>
            <th>Address</th>
            <th>Bank</th>
            <th>Salary</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} onClick={() => onSelect(emp)}>
              <td className="emp-id">{emp.id}</td>
              <td>
                <div className="emp-name-cell">
                  <div className="avatar-chip" style={{ background: colorFor(emp.name) }}>
                    {initials(emp.name)}
                  </div>
                  <div>
                    <div className="emp-name">{emp.name}</div>
                    <div className="emp-role">{emp.role}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="dept-pill">{emp.department}</span>
              </td>
              <td>{emp.address}</td>
              <td>
                {emp.bankName ? (
                  <>
                    <div>{emp.bankName}</div>
                    {emp.bankAccount && (
                      <div className="emp-role">•••• {emp.bankAccount.replace(/\s+/g, "").slice(-4)}</div>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="salary-val">{formatCurrency(emp.salary)}</td>
              <td className="updated-val" title={emp.updatedAt}>
                {formatDateTime(emp.updatedAt)}
                <div className="emp-role">{timeAgo(emp.updatedAt)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
