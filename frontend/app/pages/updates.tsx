import Entry from "~/components/updates/entry";
import type { EntryTag } from "~/components/updates/entry/pill";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import FilterButton, { type FilterTag } from "~/components/updates/filterButton";

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
  const [selectedTag, setSelectedTag] = useState<FilterTag>("All");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}`, { method: "GET" });
        const updates = await response.json();
        const filteredData = updates.filter((d: any) => d.tag !== "internal").map((d: any) => ({ ...d, merged_at: new Date(d.merged_at) }));
        setUpdates(filteredData);

        console.log("Successfully added updates!");
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

  async function deleteUpdates() {
    try {
      await fetch("http://127.0.0.1:3001/updates", { method: "DELETE" });
      navigate("/main");
    } catch (e) {
      console.error("Failed to delete updates!", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-row justify-between items-center px-4 py-4">
        <h1 className="text-4xl font-medium">Product Updates</h1>
        <button onClick={() => deleteUpdates()} className="h-10 border border-black rounded-md px-3 py-2 text-sm hover:text-black text-gray-400">
          Disconnect Repository
        </button>
      </div>
      <div className="flex flex-row gap-3 px-4 pb-4">
        {FilterTags.map((tag) => (
          <FilterButton key={tag} tag={tag} isActive={selectedTag === tag} onClick={() => setSelectedTag(tag)} />
        ))}
      </div>
      <div className="flex flex-col gap-8 px-4 pb-8">
        {groupByMonth(selectedUpdates).map(({ month, entries }) => (
          <div key={month} className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-gray-900">{month}</h2>
            {entries.map((u) => (
              <Entry key={u.number} headline={u.headline} description={u.description} tag={u.tag} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
