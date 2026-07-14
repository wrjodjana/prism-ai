import Entry from "~/components/updates/entry";
import type { EntryTag } from "~/components/updates/entry/pill";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router";
import FilterButton from "~/components/filterButton";

interface Update {
  owner: string;
  repo: string;
  number: number;
  headline: string;
  description: string;
  tag: EntryTag;
  merged_at: string;
}

export default function Updates() {
  const { owner, repo } = useParams();
  const encodedOwner = encodeURIComponent(owner as string);
  const encodedRepo = encodeURIComponent(repo as string);

  const [updates, setUpdates] = useState<Update[]>([]);
  const [selectedTag, setSelectedTag] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const response = await fetch(`http://127.0.0.1:3001/updates/${encodedOwner}/${encodedRepo}`, { method: "GET" });
        const data = await response.json();
        const nonInternalData = data.filter((d: any) => d.tag !== "internal");
        setUpdates(nonInternalData);

        console.log("Successfully added updates!");
      } catch (e) {
        console.error("Failed to fetch updates!", e);
      }
    }
    fetchUpdates();
  }, [owner, repo]);

  const filteredUpdates = updates.filter((u) => {
    if (selectedTag === "All") {
      return true;
    }
    return u.tag === selectedTag.toLowerCase();
  });

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
      <div className="flex flex-row space-x-4">
        <FilterButton tag="All" isActive={selectedTag === "All"} onClick={() => setSelectedTag("All")} />
        <FilterButton tag="New" isActive={selectedTag === "New"} onClick={() => setSelectedTag("New")} />
        <FilterButton tag="Improved" isActive={selectedTag === "Improved"} onClick={() => setSelectedTag("Improved")} />
        <FilterButton tag="Fixed" isActive={selectedTag === "Fixed"} onClick={() => setSelectedTag("Fixed")} />
      </div>
      <div className="flex flex-col gap-4 px-4">
        {filteredUpdates.map((u) => (
          <Entry key={u.number} headline={u.headline} description={u.description} tag={u.tag} />
        ))}
      </div>
    </div>
  );
}
