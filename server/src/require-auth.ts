import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.locals.session = session;
  next();
}

export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = res.locals.session as
    | { user: { role?: string } }
    | undefined;
  if (session?.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
