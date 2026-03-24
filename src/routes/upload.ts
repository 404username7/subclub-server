import { Router } from "express";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../lib/r2.js";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const key = `uploads/${Date.now()}-${file.originalname}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const url = `${process.env.VITE_CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    res.json({ url });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
    return;
  }
});

export default router;