import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { requireAuth } from "./require-auth";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

const api = express.Router();

api.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "ticket-management-server Subroto 2" });
});

api.get("/me", requireAuth, (_req: Request, res: Response) => {
  res.json(res.locals.session.user);
});

app.use("/api", api);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
