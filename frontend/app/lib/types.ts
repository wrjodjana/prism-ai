import type { EntryTag } from "~/components/updates/entry/pill";

export type EntryStatus = "draft" | "published" | "discarded";

/** Row shape returned by the backend's GET /updates/:owner/:repo endpoint. */
export interface UpdateResponse {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  merged_at: string;
  pr_title: string | null;
  pr_body: string | null;
  status: EntryStatus;
}
