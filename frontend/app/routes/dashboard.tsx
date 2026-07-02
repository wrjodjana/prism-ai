import FilterButton from "~/components/dashboard/filterButton";
import Row from "~/components/dashboard/row";
import { useState, useEffect } from "react";

type PRStatus = "open" | "merged" | "closed";

interface PullRequest {
  status: PRStatus;
  title: string;
  id: number;
  author: string;
  created_at: string;
}

export default function Dashboard() {
  const [selectedTag, setSelectedTag] = useState("All");
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);

  useEffect(() => {
    async function fetchPRs() {
      try {
        const response = await fetch("http://127.0.0.1:3000/pull_requests");
        const data = await response.json();
        setPullRequests(data);
      } catch (e) {
        console.error("Error fetching pull requests", e);
      }
    }
    fetchPRs();
  }, []);

  const filteredPrs = pullRequests.filter((pr) => {
    if (selectedTag === "All") {
      return true;
    }
    return pr.status === selectedTag.toLowerCase();
  });

  return (
    <div>
      <div className="flex flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-medium">Pull Requests</h1>
        </div>
        <div className="flex flex-row space-x-4">
          <FilterButton status="All" isActive={selectedTag === "All"} onClick={() => setSelectedTag("All")} />
          <FilterButton status="Open" isActive={selectedTag === "Open"} onClick={() => setSelectedTag("Open")} />
          <FilterButton status="Merged" isActive={selectedTag === "Merged"} onClick={() => setSelectedTag("Merged")} />
          <FilterButton status="Closed" isActive={selectedTag === "Closed"} onClick={() => setSelectedTag("Closed")} />
        </div>
      </div>
      {filteredPrs.map((pr) => (
        <Row key={pr.id} id={pr.id} title={pr.title} status={pr.status} author={pr.author} time={pr.created_at} />
      ))}
    </div>
  );
}
