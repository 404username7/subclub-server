import { Router } from "express";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post("/", upload.single("file"), (req, res) => {
  try {
    console.log("UPLOAD ROUTE HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.status(200).json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size,
      message: "Upload route is working",
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;