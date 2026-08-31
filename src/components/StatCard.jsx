export default function StatCard({ label, value, hint, hintTone }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint && <p className={`stat-hint ${hintTone || ""}`}>{hint}</p>}
    </div>
  );
}
