import cors from "cors";
import { RoomConfiguration } from '@livekit/protocol';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });
// This route handler creates a token for a given room and participant
async function createToken(request) {
    var _a, _b;
    const roomName = (_a = request.room_name) !== null && _a !== void 0 ? _a : request.roomName;
    const participantName = (_b = request.participant_name) !== null && _b !== void 0 ? _b : request.participantName;
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
        identity: participantName,
        // Token to expire after 10 minutes
        ttl: '10m',
    });
    // Token permissions can be added here based on the
    // desired capabilities of the participant
    at.addGrant({
        roomJoin: true,
        room: roomName,
        canUpdateOwnMetadata: true,
    });
    if (request.participant_identity) {
        at.identity = request.participant_identity;
    }
    if (request.participant_metadata) {
        at.metadata = request.participant_metadata;
    }
    if (request.participant_attributes) {
        at.attributes = request.participant_attributes;
    }
    if (request.room_config) {
        at.roomConfig = RoomConfiguration.fromJson(request.room_config);
    }
    return at.toJwt();
}
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3000;
app.post('/createToken', async (req, res) => {
    var _a, _b, _c;
    const body = (_a = req.body) !== null && _a !== void 0 ? _a : {};
    body.roomName = (_b = body.roomName) !== null && _b !== void 0 ? _b : `room-${crypto.randomUUID()}`;
    body.participantName = (_c = body.participantName) !== null && _c !== void 0 ? _c : `user-${crypto.randomUUID()}`;
    try {
        res.send({
            server_url: process.env.LIVEKIT_URL,
            participant_token: await createToken(body),
        });
    }
    catch (err) {
        console.error('Error generating token:', err);
        res.status(500).send({ message: 'Generating token failed' });
    }
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
