import FilterButton from "~/components/dashboard/filterButton";
import Row from "~/components/dashboard/row";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

type prStatus = "open" | "merged" | "closed";

interface PullRequest {
  status: prStatus;
  title: string;
  id: number;
  author: string;
  created_at: string;
}

export default function Dashboard() {
  const [selectedTag, setSelectedTag] = useState("All");
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPRs() {
      try {
        const response = await fetch("http://127.0.0.1:3000/pull_requests", { method: "GET" });
        const data = await response.json();
        setPullRequests(data);

        console.log("Successfully added pull requests!");
      } catch (e) {
        console.error("Error fetching pull requests", e);
      }
    }
    fetchPRs();
  }, []);

  const filteredPRs = pullRequests.filter((pr) => {
    if (selectedTag === "All") {
      return true;
    }
    return pr.status === selectedTag.toLowerCase();
  });

  async function deletePRs() {
    try {
      await fetch("http://127.0.0.1:3000/pull_requests", { method: "DELETE" });
      navigate("/main");
      console.log("Successfully deleted pull requests!");
    } catch (e) {
      console.error("Error deleting pull requests", e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-row justify-between items-center px-4 py-4">
        <div className="flex flex-row items-center space-x-4">
          <h1 className="text-lg font-medium">Pull Requests</h1>
          <div className="w-fit h-10 border border-black rounded-md px-3 py-2 hover:text-black text-gray-400">
            <button onClick={() => deletePRs()}>Disconnect Repository</button>
          </div>
        </div>
        <div className="flex flex-row space-x-4">
          <FilterButton status="All" isActive={selectedTag === "All"} onClick={() => setSelectedTag("All")} />
          <FilterButton status="Open" isActive={selectedTag === "Open"} onClick={() => setSelectedTag("Open")} />
          <FilterButton status="Merged" isActive={selectedTag === "Merged"} onClick={() => setSelectedTag("Merged")} />
          <FilterButton status="Closed" isActive={selectedTag === "Closed"} onClick={() => setSelectedTag("Closed")} />
        </div>
      </div>
      {filteredPRs.map((pr) => (
        <Row key={pr.id} id={pr.id} title={pr.title} status={pr.status} author={pr.author} time={pr.created_at} />
      ))}
    </div>
  );
}
