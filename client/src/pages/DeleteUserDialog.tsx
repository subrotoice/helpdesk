import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "./UsersTable";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

export default function DeleteUserDialog({ open, onOpenChange, user }: Props) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      axios.delete(`/api/users/${user!.id}`, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  const serverError =
    mutation.isError && axios.isAxiosError(mutation.error)
      ? (mutation.error.response?.data as { error?: string })?.error
      : undefined;
  const errorMessage = serverError ?? (mutation.isError ? "Failed to delete user" : undefined);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) mutation.reset();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{user?.name}</strong>? This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
