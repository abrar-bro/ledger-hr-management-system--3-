import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import EmployeeTable from "../components/EmployeeTable.jsx";
import EmployeeModal from "../components/EmployeeModal.jsx";
import { createEmployee, deleteEmployee, getEmployees, resetToDemoData, subscribeToEmployees, updateEmployee } from "../api/employees";

// Falls back to periodic polling so the "Updated" column also picks up
// changes made by someone else (another admin, another tab, a live API),
// not just edits made in this session.
const POLL_INTERVAL_MS = 15000;

export default function Employees({ readOnly = false }) {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const list = await getEmployees();
    // New array reference each time so React re-renders even when the data
    // is unchanged — that's what keeps the "x minutes ago" text fresh.
    setEmployees([...list]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToEmployees(refresh);
    const pollId = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      unsubscribe();
      clearInterval(pollId);
    };
  }, []);

  const departments = useMemo(
    () => ["All", ...new Set(employees.map((e) => e.department))],
    [employees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q);
      const matchesDept = deptFilter === "All" || e.department === deptFilter;
      return matchesQuery && matchesDept;
    });
  }, [employees, query, deptFilter]);

  async function handleSave(form) {
    if (selected) {
      await updateEmployee(selected.id, form);
    } else {
      await createEmployee(form);
    }
    setSelected(null);
    setShowAdd(false);
    refresh();
  }

  async function handleDelete(id) {
    await deleteEmployee(id);
    setSelected(null);
    refresh();
  }

  async function handleReset() {
    if (!window.confirm("Reset the roster back to the original demo data? This clears any adds/edits.")) return;
    await resetToDemoData();
    refresh();
  }

  return (
    <>
      <Topbar
        title="Employees"
        subtitle={
          readOnly
            ? "View-only directory: ID, contact, address, department, and salary."
            : "Every record: ID, contact, address, department, and salary."
        }
      />
      <div className="page-body">
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search by name, ID, or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="select-input" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {!readOnly && (
            <>
              <button className="btn btn-amber" onClick={() => setShowAdd(true)}>
                + Add employee
              </button>
              <button className="btn btn-ghost" onClick={handleReset}>
                Reset 🔄

              </button>
            </>
          )}
        </div>

        <div className="panel">
          <div className="panel-body" style={{ padding: 0 }}>
            {!loading && <EmployeeTable employees={filtered} onSelect={setSelected} />}
          </div>
        </div>
      </div>

      {(selected || showAdd) && (
        <EmployeeModal
          employee={selected}
          onClose={() => {
            setSelected(null);
            setShowAdd(false);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          readOnly={readOnly}
        />
      )}
    </>
  );
}
