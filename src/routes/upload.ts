import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), (req, res) => {
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
});

export default router;