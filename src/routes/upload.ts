import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import multer from "multer";
import { r2, r2Bucket } from "../lib/r2.js";
import { requireSupabaseUser } from "../lib/supabase-auth.js";

const router = Router();
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP, and GIF images are accepted."));
    }
    callback(null, true);
  },
});

function matchesImageSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  switch (file.mimetype) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/gif":
      return bytes.subarray(0, 4).toString("ascii") === "GIF8";
    case "image/webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

router.post("/", requireSupabaseUser, (req, res, next) => {
  upload.single("file")(req, res, async (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ error: "Choose an image first." });
    if (!matchesImageSignature(req.file)) {
      return res.status(400).json({ error: "The file contents do not match an accepted image type." });
    }

    const userId = req.subclubUser!.id;
    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const key = `${userId}/${randomUUID()}.${extensionByType[req.file.mimetype]}`;

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: r2Bucket(),
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );

      return res.status(201).json({
        success: true,
        key,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (putError) {
      console.error("R2 upload failed:", putError);
      return res.status(502).json({ error: "The image could not be saved." });
    }
  });
});

export default router;
