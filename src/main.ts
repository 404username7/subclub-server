import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import multer from "multer";
import livekitRoutes from "./routes/livekit.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("This website is not allowed to call the server."));
    },
  }),
);
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => res.send("SubClub server running."));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use("/api/upload", uploadRoutes);
app.use("/api/livekit", livekitRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof Error && error.message.includes("not allowed to call")) {
    return res.status(403).json({ error: "This website is not allowed to call the server." });
  }

  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      error: status === 413 ? "Image is too large. Maximum size is 10 MB." : error.message,
    });
  }

  if (error instanceof Error && error.message.startsWith("Only JPG")) {
    return res.status(400).json({ error: error.message });
  }

  console.error("Request failed:", error);
  return res.status(500).json({ error: "The request could not be completed." });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`SubClub server listening on port ${port}`);
});
