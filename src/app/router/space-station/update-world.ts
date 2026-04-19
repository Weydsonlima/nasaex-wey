import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import z from "zod";

const avatarConfigSchema = z.object({
  suitColor: z.string().optional(),
  helmetColor: z.string().optional(),
  accessory: z.enum(["none", "flag", "jetpack"]).optional(),
  skinTone: z.string().optional(),
  useProfilePhoto: z.boolean().optional(),
  hairStyle: z.enum(["none", "short", "long", "curly", "afro", "ponytail"]).optional(),
  hairColor: z.string().optional(),
  beardStyle: z.enum(["none", "stubble", "short", "full"]).optional(),
  faceAccessory: z.enum(["none", "glasses", "sunglasses"]).optional(),
});

export const updateWorld = base
  .use(requiredAuthMiddleware)
  .route({
    method: "PUT",
    path: "/space-station/:stationId/world",
    summary: "Create or update the Space Station world config",
  })
  .input(
    z.object({
      stationId: z.string(),
      planetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      ambientTheme: z.string().optional(),
      avatarConfig: avatarConfigSchema.optional(),
      meetingPoints: z.array(z.object({ x: z.number(), y: z.number(), label: z.string() })).optional(),
      npcConfig: z.unknown().optional(),
      mapData: z.unknown().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { stationId, planetColor, ambientTheme, avatarConfig, meetingPoints, npcConfig, mapData } = input;
    const orgId = context.session.activeOrganizationId;
    const userId = context.user.id;

    const station = await prisma.spaceStation.findUnique({ where: { id: stationId } });
    if (!station) throw errors.NOT_FOUND({ message: "Space Station não encontrada" });

    const isOwner =
      (station.type === "USER" && station.userId === userId) ||
      (station.type === "ORG" && (station.orgId === orgId || station.userId === userId));

    if (!isOwner) throw errors.FORBIDDEN({ message: "Sem permissão para configurar esta station" });

    const data: Prisma.SpaceStationWorldUpdateInput = {};
    if (planetColor !== undefined) data.planetColor = planetColor;
    if (ambientTheme !== undefined) data.ambientTheme = ambientTheme;
    if (avatarConfig !== undefined) data.avatarConfig = avatarConfig as Prisma.InputJsonValue;
    if (meetingPoints !== undefined) data.meetingPoints = meetingPoints as Prisma.InputJsonValue;
    if (npcConfig !== undefined) data.npcConfig = npcConfig as Prisma.InputJsonValue;
    if (mapData !== undefined) data.mapData = mapData as Prisma.InputJsonValue;

    try {
      const world = await prisma.spaceStationWorld.upsert({
        where: { stationId },
        create: { stationId, ...data },
        update: data,
      });
      return { world };
    } catch (err) {
      console.error("[updateWorld] Prisma error:", err);
      throw err;
    }
  });
