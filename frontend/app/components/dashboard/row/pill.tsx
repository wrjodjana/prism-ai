type PRStatus = "open" | "merged" | "closed";

interface PillProps {
  status: PRStatus;
}

const colorMap: Record<PRStatus, String> = {
  open: "bg-green-100 text-green-800",
  merged: "bg-purple-100 text-purple-800",
  closed: "bg-red-100 text-red-800",
};

export default function Pill({ status }: PillProps) {
  return (
    <div>
      <div className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${colorMap[status]}`}>{status}</div>
    </div>
  );
}
