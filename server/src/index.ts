import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());

const api = express.Router();

api.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "ticket-management-server" });
});

app.use("/api", api);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
