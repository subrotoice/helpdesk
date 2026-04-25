import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRole, useSession } from "../lib/auth-client";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  if (isPending) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (getRole(session.user) !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
