import { useEffect, useState } from "react";

export default function Topbar({ title, subtitle }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-sub">{subtitle}</p>}
      </div>
      <div className="topbar-right">
        <span className="topbar-clock">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
          {now.toLocaleTimeString("en-US")}
        </span>
        <div className="admin-avatar">AD</div>
      </div>
    </header>
  );
}
