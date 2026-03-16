// import { PrismaClient, TagType, Temperature } from "@/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { faker } from "@faker-js/faker";

// import "dotenv/config";
// import z from "zod";

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL,
// });

// const prisma = new PrismaClient({
//   adapter,
// });

// const userId = "8vapWpBAEoPSaRsYPW6sbhnyfEyXcL3A";

// async function main() {
//   const user = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//   });

//   if (!user) {
//     throw new Error("User not found");
//   }

//   const organization = await prisma.organization.findMany();

//   if (!organization.length) {
//     throw new Error("Organization not found");
//   }

//   await prisma.member.createMany({
//     data: organization.map((org) => ({
//       userId,
//       organizationId: org.id,
//       role: "admin",
//       createdAt: new Date(),
//     })),
//     skipDuplicates: true,
//   });

//   const trackings = await prisma.tracking.findMany({
//     where: {
//       organizationId: {
//         in: organization.map((org) => org.id),
//       },
//     },
//   });

//   await prisma.trackingParticipant.createMany({
//     data: trackings.map((tracking) => ({
//       trackingId: tracking.id,
//       userId,
//       createdAt: new Date(),
//       role: "ADMIN",
//     })),
//     skipDuplicates: true,
//   });
// }

// main();
