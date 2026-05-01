import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserForm from "./UserForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { id: string; name: string; email: string };
};

export default function UserDialog({ open, onOpenChange, user }: Props) {
  const isEdit = user !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this user's details."
              : "Add a new agent to the helpdesk."}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          user={user}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
