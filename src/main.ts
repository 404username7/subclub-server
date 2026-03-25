import uploadRouter from "./routes/upload.js";
import cors from "cors";
import { RoomConfiguration } from "@livekit/protocol";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import { AccessToken } from "livekit-server-sdk";

type TokenRequest = {
  room_name?: string;
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_config?: ReturnType<RoomConfiguration["toJson"]>;

  roomName?: string;
  participantName?: string;
};

dotenv.config({ path: ".env.local" });

function createToken(request: TokenRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
  }

  const roomName = request.room_name ?? request.roomName ?? "default-room";
  const participantName =
    request.participant_name ?? request.participantName ?? "guest";
  const participantIdentity =
    request.participant_identity ?? participantName;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    metadata: request.participant_metadata,
    attributes: request.participant_attributes,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  if (request.room_config) {
    at.roomConfig = RoomConfiguration.fromJson(request.room_config);
  }

  return at.toJwt();
}

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/upload", uploadRouter);

app.get("/", (_req, res) => {
  res.send("SubClub server running 🚀");
});

const port = Number(process.env.PORT) || 3000;

app.post("/createToken", async (req, res) => {
  const body = req.body ?? {};

  try {
    res.send({
      server_url: process.env.LIVEKIT_URL,
      participant_token: await createToken(body),
    });
  } catch (err) {
    console.error("Error generating token:", err);
    res.status(500).send({ message: "Generating token failed" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});