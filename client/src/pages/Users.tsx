import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import UserDialog from "./UserDialog";
import UsersTable, { type User } from "./UsersTable";

async function fetchUsers(): Promise<User[]> {
  const res = await axios.get<{ users: User[] }>("/api/users", {
    withCredentials: true,
  });
  return res.data.users;
}

type DialogState = { mode: "create" } | { mode: "edit"; user: User } | null;

export default function Users() {
  const [dialog, setDialog] = useState<DialogState>(null);
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
        <Button onClick={() => setDialog({ mode: "create" })}>
          Create user
        </Button>
      </div>

      <UserDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        user={dialog?.mode === "edit" ? dialog.user : undefined}
      />

      {isError && <p className="text-red-600">Error: {error.message}</p>}

      {(isPending || users) && (
        <UsersTable
          users={users}
          isPending={isPending}
          onEdit={(user) => setDialog({ mode: "edit", user })}
        />
      )}
    </section>
  );
}
