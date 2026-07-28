import Entry from "~/components/updates/entry";
import type { EntryTag } from "~/components/updates/entry/pill";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import FilterButton, { type FilterTag } from "~/components/updates/filterButton";
import { Button } from "~/components/ui/button";
import type { UpdateResponse } from "~/lib/types";

interface Update {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  merged_at: Date;
}

const FilterTags: FilterTag[] = ["All", "New", "Improved", "Fixed"];

export default function Updates() {
  const { owner, repo } = useParams();
  const encodedOwner = encodeURIComponent(owner as string);
  const encodedRepo = encodeURIComponent(repo as string);

  const [updates, setUpdates] = useState<Update[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [selectedTag, setSelectedTag] = useState<FilterTag>("All");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}?status=published`, { method: "GET" });
        if (!response.ok) {
          throw new Error("Failed to fetch published updates!");
        }
        const data: UpdateResponse[] = await response.json();
        const filteredData = data
          .filter((d) => d.tag !== "internal")
          .map((d) => ({
            owner: d.owner,
            repo: d.repo,
            number: d.number,
            headline: d.headline,
            description: d.description,
            tag: d.tag,
            merged_at: new Date(d.merged_at),
          }));
        setUpdates(filteredData);

        const draftResponse = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}?status=draft`, { method: "GET" });
        if (!draftResponse.ok) {
          throw new Error("Failed to fetch drafts!");
        }
        const drafts: UpdateResponse[] = await draftResponse.json();
        setDraftCount(drafts.length);
      } catch (e) {
        console.error("Failed to fetch updates!", e);
      }
    }
    fetchUpdates();
  }, [owner, repo]);

  const selectedUpdates = updates.filter((u) => {
    if (selectedTag === "All") {
      return true;
    }
    return u.tag === selectedTag.toLowerCase();
  });

  function groupByMonth(updates: Update[]) {
    const sorted = updates.toSorted((a, b) => +b.merged_at - +a.merged_at);

    const groups = new Map<string, Update[]>();
    for (const update of sorted) {
      const month = update.merged_at.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const entries = groups.get(month);
      if (entries) {
        entries.push(update);
      } else {
        groups.set(month, [update]);
      }
    }
    return Array.from(groups, ([month, entries]) => ({ month, entries }));
  }

  const monthGroups = groupByMonth(selectedUpdates);

  function tagCount(tag: FilterTag) {
    if (tag == "All") {
      return updates.length;
    }
    return updates.filter((u) => u.tag === tag.toLowerCase()).length;
  }

  async function deleteUpdates() {
    try {
      const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete updates!");
      }
      navigate("/main");
    } catch (e) {
      console.error("Failed to delete updates!", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-row justify-between items-center px-4 py-4">
        <h1 className="text-4xl font-medium">Product Updates</h1>
        <div className="flex flex-row gap-3">
          {draftCount > 0 && (
            <Button variant="outline" onClick={() => navigate(`/updates/${encodedOwner}/${encodedRepo}/review`)} className="h-10">
              Review Drafts ({draftCount})
            </Button>
          )}
          <Button variant="outline" onClick={() => deleteUpdates()} className="h-10">
            Disconnect Repository
          </Button>
        </div>
      </div>
      <div className="flex flex-row gap-3 px-4 pb-4">
        {FilterTags.map((tag) => (
          <FilterButton key={tag} tag={tag} count={tagCount(tag)} isActive={selectedTag === tag} onClick={() => setSelectedTag(tag)} />
        ))}
      </div>
      <div className="flex flex-row gap-8 px-4 pb-8">
        <div className="flex flex-1 flex-col gap-8">
          {monthGroups.map(({ month, entries }) => (
            <div key={month} id={month} className="flex flex-col gap-3 scroll-mt-8">
              <h2 className="text-lg font-medium text-foreground">{month}</h2>
              {entries.map((u) => (
                <Entry key={u.number} headline={u.headline} description={u.description} tag={u.tag} />
              ))}
            </div>
          ))}
        </div>
        {monthGroups.length > 0 && (
          <nav className="sticky top-8 hidden w-36 shrink-0 flex-col gap-1 self-start md:flex">
            {monthGroups.map(({ month }) => (
              <Button key={month} variant="ghost" size="sm" onClick={() => document.getElementById(month)?.scrollIntoView({ behavior: "smooth" })} className="justify-start px-1 py-1 text-left text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
                {month}
              </Button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
