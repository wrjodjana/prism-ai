import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function Main() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const navigate = useNavigate();

  async function handleSync(owner: string, repo: string) {
    try {
      await fetch(`http://127.0.0.1:3000/github?owner=${owner}&repo=${repo}`);
      navigate("/dashboard");
    } catch (e) {
      console.error("Error posting git information", e);
    }
  }

  return (
    <div>
      <div className="flex flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-medium">Connect Repository</h1>
        </div>
      </div>
      <div className="px-4 py-6 flex flex-col space-y-4 max-w-md">
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">Repository Owner</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} type="text" className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black" />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">Repository Name</label>
          <input value={repo} onChange={(e) => setRepo(e.target.value)} type="text" className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black" />
        </div>
        <button onClick={() => handleSync(owner, repo)} className="w-fit h-10 border border-black rounded-md px-3 py-2 hover:text-black text-gray-400">
          Sync Pull Requests
        </button>
      </div>
    </div>
  );
}
