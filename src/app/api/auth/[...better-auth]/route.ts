import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { enforceAuthRouteRateLimit } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);

export async function GET(req: Request) {
  try {
    await enforceAuthRouteRateLimit(req, "GET", 120, 60);
  } catch {
    return new Response("Too many auth requests", { status: 429 });
  }
  return handlers.GET(req);
}

export async function POST(req: Request) {
  try {
    await enforceAuthRouteRateLimit(req, "POST", 30, 60);
  } catch {
    return new Response("Too many auth attempts", { status: 429 });
  }
  return handlers.POST(req);
}

