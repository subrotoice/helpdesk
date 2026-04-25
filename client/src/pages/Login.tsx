import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "../lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const onSubmit = async (values: LoginValues) => {
    await signIn.email(values, {
      onError: (ctx) => {
        setError("root", {
          message: ctx.error.message ?? "Sign in failed",
        });
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>HelpDesk</CardTitle>
          <CardDescription>
            Sign in to the ticket management dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
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
                      placeholder="you@example.com"
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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {errors.root && (
                <p className="text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
