import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-helpers";
import { getPrivyClient } from "@/lib/privy-server";

/**
 * Protected API route — requires Privy JWT.
 * Returns the authenticated user's profile.
 *
 * Client usage:
 *   const { getAccessToken } = usePrivy();
 *   const token = await getAccessToken();
 *   const res = await fetch("/api/user", {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 */
export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const privy = getPrivyClient();
    const user = await privy.getUserById(auth.userId);

    return NextResponse.json({
      id: user.id,
      createdAt: user.createdAt,
      linkedAccounts: user.linkedAccounts.map((account) => ({
        type: account.type,
        ...(account.type === "email" && {
          address: (account as any).address,
        }),
        ...(account.type === "wallet" && {
          address: (account as any).address,
          chainType: (account as any).chainType,
        }),
        ...(account.type === "google_oauth" && {
          email: (account as any).email,
          name: (account as any).name,
        }),
      })),
    });
  } catch (err) {
    console.error("[/api/user] Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
