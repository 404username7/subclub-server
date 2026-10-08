import { AccessToken } from "livekit-server-sdk";
import { Router } from "express";
import { requireSupabaseUser } from "../lib/supabase-auth.js";

const router = Router();

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

router.post("/token", requireSupabaseUser, async (req, res) => {
  const user = req.subclubUser!;
  const role = getString(req.body?.role);
  const metadata = user.appMetadata;
  let creatorId: string;
  let canPublish = false;

  if (role === "host") {
    if (metadata.subclub_role !== "creator") {
      return res.status(403).json({ error: "This account is not approved to go live." });
    }
    creatorId = user.id;
    canPublish = true;
  } else if (role === "viewer") {
    const requestedCreatorId = getString(req.body?.creatorId);
    const allowedCreators = metadata.subclub_accessible_creator_ids;

    if (
      !requestedCreatorId ||
      !Array.isArray(allowedCreators) ||
      !allowedCreators.includes(requestedCreatorId)
    ) {
      return res.status(403).json({ error: "This account is not approved to watch this live room." });
    }
    creatorId = requestedCreatorId;
  } else {
    return res.status(400).json({ error: 'Set role to "host" or "viewer".' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const serverUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !serverUrl) {
    console.error("LiveKit is not configured.");
    return res.status(503).json({ error: "Live video is unavailable." });
  }

  const roomName = `subclub-${creatorId}`;
  try {
    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      ttl: "15m",
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
    });

    return res.json({ token: await token.toJwt(), serverUrl, roomName });
  } catch (error) {
    console.error("LiveKit token creation failed:", error);
    return res.status(500).json({ error: "Could not start the live session." });
  }
});

export default router;
