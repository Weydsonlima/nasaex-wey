import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const json = await request.json();
  console.log(json);
  const { trackingId, statusId, name, phone, email, description } = json;

  await prisma.lead.create({
    data: {
      trackingId,
      statusId,
      name,
      phone,
      email,
      description,
    },
  });
  return Response.json({ success: true });
}
