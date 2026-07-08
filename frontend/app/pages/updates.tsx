import Entry from "~/components/updates/entry";
import type { EntryTag } from "~/components/updates/entry/pill";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

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

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const response = await fetch(`http://127.0.0.1:3000/updates/${encodedOwner}/${encodedRepo}`, { method: "GET" });
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-center items-center px-4 py-4">
        <h1 className="text-4xl font-medium">Product Updates</h1>
      </div>
      <div className="flex flex-col gap-4 px-4">
        {updates.map((u) => (
          <Entry key={u.number} headline={u.headline} description={u.description} tag={u.tag} />
        ))}
      </div>
    </div>
  );
}
