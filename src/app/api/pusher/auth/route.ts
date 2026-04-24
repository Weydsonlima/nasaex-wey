import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

/**
 * Pusher auth endpoint — required for:
 *  - presence channels (presence-world-*)
 *  - client events (WebRTC signaling)
 */
export async function POST(req: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId  = params.get("socket_id")!;
  const channel   = params.get("channel_name")!;

  // Guest fallback if not logged in
  const userId   = session?.user?.id   ?? `guest_${socketId.replace(".", "_")}`;
  const userName = session?.user?.name ?? "Visitante";
  const userImage = session?.user?.image ?? null;

  try {
    let authResponse: object;

    if (channel.startsWith("presence-")) {
      authResponse = pusherServer.authorizeChannel(socketId, channel, {
        user_id: userId,
        user_info: { name: userName, image: userImage },
      });
    } else {
      authResponse = pusherServer.authorizeChannel(socketId, channel);
    }

    return NextResponse.json(authResponse);
  } catch (err) {
    console.error("Pusher auth error:", err);
    return new NextResponse("Unauthorized", { status: 403 });
  }
}
