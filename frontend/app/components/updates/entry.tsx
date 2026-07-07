import type { EntryTag } from "./entry/pill";
import Pill from "./entry/pill";

interface EntryProps {
  headline: string;
  description: string;
  tag: EntryTag;
}

export default function Entry({ headline, description, tag }: EntryProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
      <Pill tag={tag} />
      <div>
        <p className="text-sm font-medium text-gray-900">{headline}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
