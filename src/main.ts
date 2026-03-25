import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();

// 🔥 VERY IMPORTANT FOR RAILWAY
const PORT = process.env.PORT || 8080;

// ✅ Enable CORS
app.use(cors({
  origin: "*",
}));

// ✅ Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ HEALTH CHECK (so Railway doesn’t act weird)
app.get("/", (req, res) => {
  res.send("SubClub server running 🚀");
});

// ✅ UPLOAD ROUTE (THIS MUST BE BEFORE BODY PARSING)
app.post("/api/upload", upload.single("file"), (req, res) => {
  console.log("🔥 UPLOAD HIT");

  if (!req.file) {
    console.log("❌ NO FILE");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("✅ FILE RECEIVED:", req.file.originalname);

  return res.json({
    success: true,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

// ✅ ONLY AFTER UPLOAD ROUTE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});