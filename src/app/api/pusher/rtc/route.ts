import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

/**
 * POST /api/pusher/rtc
 * Server-side relay for WebRTC signaling (offer / answer / ICE candidate).
 * Avoids the need for "Enable client events" in the Pusher dashboard.
 *
 * Body:
 *   { type: "offer",  stationId, from, fromName, fromImage, sdp }
 *   { type: "answer", stationId, from, to, sdp }
 *   { type: "ice",    stationId, from, to, candidate }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type:        "offer" | "answer" | "ice" | "media";
      stationId:   string;
      from:        string;
      fromName?:   string;
      fromImage?:  string | null;
      to?:         string;
      sdp?:        RTCSessionDescriptionInit;
      candidate?:  RTCIceCandidateInit;
      micOn?:      boolean;
      camOn?:      boolean;
    };

    const { type, stationId, from, fromName, fromImage, to, sdp, candidate, micOn, camOn } = body;

    if (!type || !stationId || !from) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const channel = `private-rtc-${stationId}`;

    if (type === "offer") {
      await pusherServer.trigger(channel, "rtc:offer", { sdp, from, fromName, fromImage });
    } else if (type === "answer") {
      await pusherServer.trigger(channel, "rtc:answer", { sdp, from, to });
    } else if (type === "ice") {
      await pusherServer.trigger(channel, "rtc:ice", { candidate, from, to });
    } else if (type === "media") {
      await pusherServer.trigger(channel, "rtc:media", { from, micOn, camOn });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pusher/rtc] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
