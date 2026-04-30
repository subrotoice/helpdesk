import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  emailVerified: boolean;
  createdAt: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { users: User[] }) => setUsers(data.users))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Users</h1>
      <p className="text-gray-600">All accounts in the system.</p>

      {error && <p className="text-red-600">Error: {error}</p>}
      {!users && !error && <p className="text-gray-400">Loading…</p>}

      {users && (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                      }
                    >
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>{u.emailVerified ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
