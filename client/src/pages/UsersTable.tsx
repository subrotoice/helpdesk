import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
};

type Props = {
  users: User[] | undefined;
  isPending: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
};

export default function UsersTable({ users, isPending, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          {users?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <span
                  className={
                    u.role === UserRole.admin
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
              <TableCell className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${u.name}`}
                  onClick={() => onEdit?.(u)}
                >
                  <Pencil />
                </Button>
                {u.role !== UserRole.admin && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${u.name}`}
                    onClick={() => onDelete?.(u)}
                  >
                    <Trash2 className="text-red-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {users?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
