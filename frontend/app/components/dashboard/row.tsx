import Pill from "./row/pill";
import Middle from "./row/middle";
import SummaryCell from "./row/summaryCell";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

type prStatus = "open" | "merged" | "closed";
type summaryStatus = "idle" | "loading" | "done";

interface RowProps {
  status: prStatus;
  title: string;
  id: number;
  author: string;
  time: string;
  owner: string;
  repo: string;
}

export default function Row({ status, title, id, author, time, owner, repo }: RowProps) {
  const [summary, setSummary] = useState("");
  const [summaryState, setSummaryState] = useState<summaryStatus>("idle");

  async function getSummary(owner: string, repo: string, id: number) {
    setSummaryState("loading");
    try {
      const response = await fetch(`http://127.0.0.1:3000/summary?owner=${owner}&repo=${repo}&id=${id}`, { method: "GET" });
      const data = await response.json();
      setSummary(data.summary);
      setSummaryState("done");
    } catch (e) {
      console.error("Error fetching summary", e);
    }
  }

  return (
    <div className="flex flex-col gap-2 border border-gray-200 rounded-md px-4 py-3">
      <div className="flex flex-row items-center gap-4">
        <div className="w-16 shrink-0">
          <Pill status={status} />
        </div>
        <div className="min-w-0 flex-1">
          <Middle title={title} id={id} author={author} time={time} />
        </div>
        {summaryState !== "done" && (
          <button onClick={() => getSummary(owner, repo, id)} disabled={summaryState === "loading"} aria-label="Summarize" className="flex items-center justify-center hover:text-black text-gray-400 shrink-0 disabled:hover:text-gray-400">
            {summaryState === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
        )}
      </div>
      {summaryState === "done" && <SummaryCell summary={summary} />}
    </div>
  );
}
