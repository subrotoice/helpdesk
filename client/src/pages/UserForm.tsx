import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .refine(
      (v) => v.length === 0 || v.length >= 6,
      "Password must be at least 6 characters",
    ),
});

export type UserFormValues = z.infer<typeof createUserSchema>;

type Props = {
  user?: { id: string; name: string; email: string };
  onSuccess: () => void;
  onCancel: () => void;
};

export default function UserForm({ user, onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();
  const isEdit = user !== undefined;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: isEdit
      ? { name: user.name, email: user.email, password: "" }
      : { name: "", email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (isEdit) {
        const payload: { name: string; email: string; password?: string } = {
          name: values.name,
          email: values.email,
        };
        if (values.password.length > 0) payload.password = values.password;
        const res = await axios.patch(`/api/users/${user.id}`, payload, {
          withCredentials: true,
        });
        return res.data;
      }
      const res = await axios.post("/api/users", values, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      const fallback = isEdit
        ? "Failed to save changes"
        : "Failed to create user";
      const message = err.response?.data?.error ?? err.message ?? fallback;
      setError("root", { message: message || fallback });
    },
  });

  const onSubmit = (values: UserFormValues) => mutation.mutate(values);
  const isSubmitting = mutation.isPending;

  const submitIdle = isEdit ? "Save changes" : "Create user";
  const submitPending = isEdit ? "Saving…" : "Creating…";
  const passwordLabel = isEdit ? "New password (optional)" : "Password";
  const passwordPlaceholder = isEdit
    ? "Leave blank to keep current password"
    : undefined;

  return (
    <>
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="name"
                  placeholder="Jane Doe"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="jane@example.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{passwordLabel}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  placeholder={passwordPlaceholder}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" form="user-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? submitPending : submitIdle}
        </Button>
      </DialogFooter>
    </>
  );
}
