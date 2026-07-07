export type EntryTag = "new" | "improved" | "fixed";

interface PillProps {
  tag: EntryTag;
}

const labelMap: Record<EntryTag, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
};

const colorMap: Record<EntryTag, string> = {
  new: "bg-green-100 text-green-800",
  improved: "bg-blue-100 text-blue-800",
  fixed: "bg-violet-100 text-violet-800",
};

export default function Pill({ tag }: PillProps) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[tag]}`}>{labelMap[tag]}</span>;
}
