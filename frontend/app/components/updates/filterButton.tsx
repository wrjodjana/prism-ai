import { Badge } from "~/components/ui/badge";
import type { EntryTag } from "./entry/pill";
import { colorMap } from "./entry/pill";

export type FilterTag = "All" | "New" | "Improved" | "Fixed";

interface FilterButtonProps {
  tag: FilterTag;
  isActive: boolean;
  count: number;
  onClick: () => void;
}

export default function FilterButton({ tag, isActive, count, onClick }: FilterButtonProps) {
  const activeStyles = tag === "All" ? "bg-primary text-primary-foreground" : colorMap[tag.toLowerCase() as EntryTag];

  return (
    <Badge asChild variant={isActive ? "default" : "outline"} className={`h-auto cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${isActive ? activeStyles : "text-muted-foreground hover:text-foreground"}`}>
      <button onClick={onClick}>
        {tag}
        <span className="ml-1.5 text-xs opacity-60">{count}</span>
      </button>
    </Badge>
  );
}
