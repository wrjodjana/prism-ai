import { Badge } from "~/components/ui/badge";

export type EntryTag = "new" | "improved" | "fixed" | "internal";

interface PillProps {
  tag: EntryTag;
}

export const labelMap: Record<EntryTag, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
  internal: "Internal",
};

export const colorMap: Record<EntryTag, string> = {
  new: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  improved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  fixed: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  internal: "bg-muted text-muted-foreground",
};

export default function Pill({ tag }: PillProps) {
  return <Badge className={`rounded-full px-2.5 ${colorMap[tag]}`}>{labelMap[tag]}</Badge>;
}
