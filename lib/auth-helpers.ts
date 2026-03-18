import { NextRequest, NextResponse } from "next/server";
import { verifyPrivyToken } from "./privy-server";

/**
 * Helper to protect API routes with Privy JWT verification.
 * Use in any API route handler:
 *
 * ```ts
 * import { withAuth } from "@/lib/auth-helpers";
 *
 * export async function GET(req: NextRequest) {
 *   const auth = await withAuth(req);
 *   if (auth.error) return auth.error;
 *
 *   // auth.userId is now available
 *   return NextResponse.json({ userId: auth.userId });
 * }
 * ```
 */
export async function withAuth(
  req: NextRequest
): Promise<
  | { userId: string; error: null }
  | { userId: null; error: NextResponse }
> {
  const authHeader = req.headers.get("authorization");
  const result = await verifyPrivyToken(authHeader);

  if (!result) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Unauthorized — invalid or missing access token" },
        { status: 401 }
      ),
    };
  }

  return { userId: result.userId, error: null };
}

/**
 * Client-side helper to make authenticated API calls.
 * Use with Privy's getAccessToken():
 *
 * ```ts
 * import { usePrivy } from "@privy-io/react-auth";
 * import { fetchWithAuth } from "@/lib/auth-helpers";
 *
 * const { getAccessToken } = usePrivy();
 * const data = await fetchWithAuth("/api/protected", getAccessToken);
 * ```
 */
export async function fetchWithAuth(
  url: string,
  getAccessToken: () => Promise<string | null>,
  options: RequestInit = {}
) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
