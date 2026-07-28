import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";

export default function Main() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSync(owner: string, repo: string) {
    try {
      setIsLoading(true);
      const encodedOwner = encodeURIComponent(owner);
      const encodedRepo = encodeURIComponent(repo);
      const response = await fetch(`http://127.0.0.1:3001/sync/${encodedOwner}/${encodedRepo}`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to sync repository!");
      }
      navigate(`/updates/${encodedOwner}/${encodedRepo}/review`);
    } catch (e) {
      console.error("Error posting git information", e);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-lg">Connect Repository</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner">Repository Owner</Label>
            <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} type="text" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repo">Repository Name</Label>
            <Input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} type="text" />
          </div>
          <Button variant="outline" onClick={() => handleSync(owner, repo)} disabled={isLoading} className="w-full h-10">
            {isLoading ? (
              <>
                <Spinner />
                <span>Connecting...</span>
              </>
            ) : (
              <span>Connect Repository</span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
