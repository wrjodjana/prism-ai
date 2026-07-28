import Navbar from "~/components/landing/navbar";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div>
      <Navbar />
      <div>
        <h1 className="text-center font-[600] tracking-[-0.04em] text-[2.2rem] leading-[1.12] pb-4">
          Translate PRs to
          <br />
          Customer-Facing <span className="text-brand">Insights</span>
        </h1>
        <h3 className="text-center text-muted-foreground">
          Prism reads every pull request and tells your <br />
          customer, support and product teams what actually <br />
          changed for them.
        </h3>
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={() => navigate("/main")}>
            Connect a Repo
          </Button>
        </div>
      </div>
    </div>
  );
}
