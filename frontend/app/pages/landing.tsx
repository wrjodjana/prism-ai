import Navbar from "~/components/landing/navbar";
import { useNavigate } from "react-router";
export default function Landing() {
  const navigate = useNavigate();
  return (
    <div>
      <Navbar />
      <div>
        <h1 className="text-center font-bold text-4xl pb-4">
          Translate PRs to
          <br />
          Customer-Facing Insights
        </h1>
        <h3 className="text-center text-gray-400">
          Prism reads every pull request and tells your <br />
          customer, support and product teams what actually <br />
          changed for them.
        </h3>
        <div className="flex justify-center pt-4">
          <button onClick={() => navigate("/main")} className="w-fit h-10 border border-black rounded-md px-3 py-2 hover:text-black text-gray-400">
            Connect a Repo
          </button>
        </div>
      </div>
    </div>
  );
}
