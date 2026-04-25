import { useEffect, useState } from "react";
import { useSession } from "../lib/auth-client";

type Health = { status: string; service: string };

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Welcome {session?.user.name}</h1>
      <p className="text-gray-600">AI-powered ticket management system.</p>
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-500">
          Server health
        </h2>
        {error && <p className="text-red-600">Error: {error}</p>}
        {health && (
          <pre className="text-sm text-gray-800">
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
        {!health && !error && <p className="text-gray-400">Loading…</p>}
      </div>
    </section>
  );
}
