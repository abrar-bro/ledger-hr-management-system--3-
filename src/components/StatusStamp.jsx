const LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
};

export default function StatusStamp({ status }) {
  const tone = LABELS[status] ? status : "absent";
  return <span className={`stamp ${tone}`}>{LABELS[tone]}</span>;
}
