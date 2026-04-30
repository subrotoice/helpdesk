import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import CreateUserDialog from "./CreateUserDialog";
import UsersTable, { type User } from "./UsersTable";

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users", {
    withCredentials: true,
  });
  return res.data.users;
}

export default function Users() {
  const [createOpen, setCreateOpen] = useState(false);
  const {
    data: users,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Users</h1>
          <p className="text-gray-600">All accounts in the system.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create user</Button>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      {isError && <p className="text-red-600">Error: {error.message}</p>}

      {(isPending || users) && (
        <UsersTable users={users} isPending={isPending} />
      )}
    </section>
  );
}
