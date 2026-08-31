export default function DeptBar({ name, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="dept-row">
      <span className="dept-name">{name}</span>
      <span className="dept-track">
        <span className="dept-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="dept-count">{count}</span>
    </div>
  );
}
