import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
  id: string;
  appMetadata: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      subclubUser?: AuthenticatedUser;
    }
  }
}

export async function requireSupabaseUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    return res.status(401).json({ error: "Sign in first." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Supabase auth is not configured.");
    return res.status(503).json({ error: "Authentication is unavailable." });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Your sign-in has expired. Sign in again." });
    }

    const user = (await response.json()) as {
      id?: unknown;
      app_metadata?: unknown;
    };

    if (typeof user.id !== "string") {
      return res.status(401).json({ error: "Invalid sign-in token." });
    }

    req.subclubUser = {
      id: user.id,
      appMetadata:
        user.app_metadata && typeof user.app_metadata === "object"
          ? (user.app_metadata as Record<string, unknown>)
          : {},
    };
    return next();
  } catch (error) {
    console.error("Supabase token check failed:", error);
    return res.status(503).json({ error: "Could not verify your sign-in." });
  }
}
