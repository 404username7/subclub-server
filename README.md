# SubClub server

This server verifies Supabase sign-in tokens, stores private image uploads in Cloudflare R2, and creates short-lived LiveKit room tokens.

## Required environment variables

Copy `.env.example` to `.env` for local development. In Railway, add the same names under the service's Variables page. Never put real secrets in the repository or browser code.

- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: verify a user's Supabase access token.
- `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and `CLOUDFLARE_R2_BUCKET_NAME`: store uploads in a **private** R2 bucket.
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`: create LiveKit participant tokens. `LIVEKIT_URL` is the LiveKit server URL sent to the browser.
- `CORS_ORIGINS`: exact frontend origins, separated by commas. Example: `https://subclubx.com,https://www.subclubx.com`.

The server will not start if R2 credentials are missing. Uploads need R2; live sessions need LiveKit; both features need Supabase.

## Supabase access policy

The token route reads only server-managed `app_metadata`; it ignores user-editable profile metadata.

- A creator needs `app_metadata.subclub_role` set to `creator`.
- A viewer needs `app_metadata.subclub_accessible_creator_ids` set to an array of creator user IDs they may watch, for example `['creator-user-uuid']`.

Until these values are populated by a trusted server/admin process, the server rejects host and viewer tokens. Do not accept these permissions from the browser. After changing a user's app metadata, have them sign out and back in so Supabase issues a fresh access token.

This is a starter authorization rule. If access depends on a per-creator subscription stored in a database table, replace the viewer allow-list check with a server-side subscription lookup before launch.

## API

### Upload an image

`POST /api/upload`, authenticated with `Authorization: Bearer <Supabase access token>`. Send `multipart/form-data` with one `file` field. JPG, PNG, WEBP, or GIF images up to 10 MB are accepted. The response contains an R2 `key`, not a public URL: the bucket stays private. The frontend must store that key. A separate authorized read/signed-URL route is still needed before private uploads can be displayed to other users.

### Get a LiveKit token

`POST /api/livekit/token`, authenticated with the same bearer token.

Host body: `{"role":"host"}`. The caller must have creator metadata.

Viewer body: `{"role":"viewer","creatorId":"creator-user-uuid"}`. The creator ID must be in the caller's server-managed access list. Host tokens can publish; viewer tokens cannot. Tokens expire after 15 minutes.

### Health check

`GET /healthz` returns `{"ok":true}`.

## Run and deploy

Use Node.js 20 or newer.

```sh
pnpm install
pnpm build
pnpm start
```

For Railway, set the build command to `pnpm build` and the start command to `pnpm start`. After deploying, open `/healthz`. Then connect the frontend using the API routes above and send the signed-in user's Supabase access token. The frontend must store the returned R2 key; it will need an authorized read/signed-URL route before it can display private uploaded files.
