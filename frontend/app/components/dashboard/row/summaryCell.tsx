import { Sparkles } from "lucide-react";

interface SummaryCellProps {
  summary: string;
}

export default function SummaryCell({ summary }: SummaryCellProps) {
  return (
    <div className="flex flex-row items-start gap-1.5 pl-20 text-sm text-gray-500">
      <Sparkles size={13} className="mt-0.5 shrink-0" />
      <p className="leading-relaxed">{summary}</p>
    </div>
  );
}
