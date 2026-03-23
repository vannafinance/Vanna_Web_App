import { PrivyClient } from "@privy-io/server-auth";

// Singleton Privy server client for JWT verification
let privyClient: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error(
        "Missing NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET environment variables"
      );
    }

    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

/**
 * Verify a Privy access token from Authorization header.
 * Returns the userId on success, null on failure.
 */
export async function verifyPrivyToken(
  authHeader: string | null
): Promise<{ userId: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const claims = await getPrivyClient().verifyAuthToken(token);
    return { userId: claims.userId };
  } catch {
    return null;
  }
}

/**
 * Get user profile from an identity token.
 * Use this for getting linked accounts, email, wallet addresses.
 */
export async function getPrivyUser(idToken: string) {
  return getPrivyClient().getUser({ idToken });
}
