import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }));

app.get("/", (_req, res) => {
  res.send("SubClub server running 🚀");
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  console.log("UPLOAD HIT");

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  return res.status(200).json({
    success: true,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});