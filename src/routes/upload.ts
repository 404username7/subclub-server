import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  console.log("UPLOAD HIT");

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  return res.json({
    success: true,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

export default router;