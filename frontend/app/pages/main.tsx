import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function Main() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const navigate = useNavigate();

  async function handleSync(owner: string, repo: string) {
    try {
      await fetch(`http://127.0.0.1:3000/pull_requests/sync?owner=${owner}&repo=${repo}`, { method: "POST" });
      navigate(`/dashboard/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    } catch (e) {
      console.error("Error posting git information", e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm border border-black rounded-md px-6 py-8 flex flex-col space-y-6">
        <h1 className="text-lg font-medium text-center">Connect Repository</h1>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Repository Owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} type="text" className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none " />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Repository Name</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} type="text" className="border border-black rounded-md px-3 py-2 text-sm focus:outline-none" />
          </div>
          <button onClick={() => handleSync(owner, repo)} className="w-full h-10 border border-black rounded-md px-3 py-2 hover:text-black text-gray-400">
            Connect Repository
          </button>
        </div>
      </div>
    </div>
  );
}
