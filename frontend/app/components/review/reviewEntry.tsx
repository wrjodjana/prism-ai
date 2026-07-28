import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { colorMap, labelMap, type EntryTag } from "~/components/updates/entry/pill";

const entryTags: EntryTag[] = ["new", "improved", "fixed", "internal"];
const BODY_PREVIEW_LENGTH = 280;

interface ReviewEntryProps {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  prTitle: string | null;
  prBody: string | null;
  isSelected: boolean;
  onToggleSelect: (number: number) => void;
  onPublish: (number: number, headline: string, description: string, tag: EntryTag) => Promise<void>;
  onDiscard: (number: number) => Promise<void>;
}

export default function ReviewEntry({ owner, repo, number, headline, description, tag, prTitle, prBody, isSelected, onToggleSelect, onPublish, onDiscard }: ReviewEntryProps) {
  const [editedHeadline, setEditedHeadline] = useState(headline);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedTag, setEditedTag] = useState<EntryTag>(tag);
  const [showFullBody, setShowFullBody] = useState(false);
  const [pendingAction, setPendingAction] = useState<"publish" | "discard" | null>(null);

  const isLongBody = prBody !== null && prBody.length > BODY_PREVIEW_LENGTH;
  const displayedBody = prBody === null ? "No description" : isLongBody && !showFullBody ? `${prBody.slice(0, BODY_PREVIEW_LENGTH)}…` : prBody;

  async function handlePublish() {
    if (editedHeadline.trim() === "") {
      return;
    }
    try {
      setPendingAction("publish");
      await onPublish(number, editedHeadline, editedDescription, editedTag);
    } catch (e) {
      console.error("Failed to publish draft!", e);
      setPendingAction(null);
    }
  }

  async function handleDiscard() {
    try {
      setPendingAction("discard");
      await onDiscard(number);
    } catch (e) {
      console.error("Failed to discard draft!", e);
      setPendingAction(null);
    }
  }

  return (
    <Card className={`gap-4 rounded-lg p-4 ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex flex-row items-start gap-3">
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-muted/50 p-3">
          <a href={`https://github.com/${owner}/${repo}/pull/${number}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Source: PR #{number} ↗
          </a>
          <p className="text-sm font-medium text-foreground">{prTitle ?? "Source PR data unavailable"}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{displayedBody}</p>
          {isLongBody && (
            <Button variant="link" size="sm" onClick={() => setShowFullBody(!showFullBody)} className="h-auto self-start p-0 text-muted-foreground hover:text-foreground">
              {showFullBody ? "Show less" : "Show more"}
            </Button>
          )}
        </div>
        <Label className="flex shrink-0 cursor-pointer flex-row items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(number)} />
          Select
        </Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`headline-${number}`}>Headline</Label>
        <Input id={`headline-${number}`} value={editedHeadline} onChange={(e) => setEditedHeadline(e.target.value)} type="text" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`description-${number}`}>Description</Label>
        <Textarea id={`description-${number}`} value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={3} className="resize-none" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Tag</Label>
        <div className="flex flex-row items-center gap-2">
          {entryTags.map((t) => (
            <Badge key={t} asChild variant={editedTag === t ? "default" : "outline"} className={`h-auto cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${editedTag === t ? colorMap[t] : "text-muted-foreground hover:text-foreground"}`}>
              <button onClick={() => setEditedTag(t)}>{labelMap[t]}</button>
            </Badge>
          ))}
          {editedTag === "internal" && <span className="text-sm text-muted-foreground">Hidden from the public updates page</span>}
        </div>
      </div>
      <div className="flex flex-row gap-3">
        <Button variant="outline" onClick={() => handlePublish()} disabled={pendingAction !== null || editedHeadline.trim() === ""} className="h-10">
          {pendingAction === "publish" ? (
            <>
              <Spinner />
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish</span>
          )}
        </Button>
        <Button variant="outline" onClick={() => handleDiscard()} disabled={pendingAction !== null} className="h-10">
          {pendingAction === "discard" ? (
            <>
              <Spinner />
              <span>Discarding...</span>
            </>
          ) : (
            <span>Discard</span>
          )}
        </Button>
      </div>
    </Card>
  );
}
