const PALETTE = ["#e3993c", "#4b8f63", "#3f6fae", "#bd4f3c", "#8d5fd3", "#2b8fa3"];

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function colorFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function formatCurrency(value) {
  // Bangladeshi Taka. Using a manual ৳ prefix instead of currency:"BDT"
  // because Intl's en-US locale renders BDT as the text "BDT", not ৳.
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value || 0);
  return `৳${amount}`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function punchLabel(type) {
  if (type === "in") return "clocked in";
  if (type === "out") return "clocked out";
  if (type === "break-start") return "started a break";
  if (type === "break-end") return "ended their break";
  return type;
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
