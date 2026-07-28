import { Card } from "~/components/ui/card";
import type { EntryTag } from "./entry/pill";
import Pill from "./entry/pill";

interface EntryProps {
  headline: string;
  description: string;
  tag: EntryTag;
}

export default function Entry({ headline, description, tag }: EntryProps) {
  return (
    <Card className="flex-row items-start gap-3 rounded-lg p-4">
      <Pill tag={tag} />
      <div>
        <p className="text-sm font-medium text-foreground">{headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
