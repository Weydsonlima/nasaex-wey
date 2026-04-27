import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const ASTRO_BAT_ORG_ID = "CCJpQR5dBVr2ipHE1KgAfKSENXnx6RQ7";
const TEST_PASSWORD = "senha123";

const TEST_USERS = [
  {
    id:    "test-beta-user-001",
    name:  "Astronauta Beta",
    email: "beta@astronasa.test",
    image: "https://api.dicebear.com/9.x/pixel-art/svg?seed=beta&backgroundColor=6366f1",
    nick:  "beta",
  },
  {
    id:    "test-gamma-user-002",
    name:  "Astronauta Gamma",
    email: "gamma@astronasa.test",
    image: "https://api.dicebear.com/9.x/pixel-art/svg?seed=gamma&backgroundColor=06b6d4",
    nick:  "gamma",
  },
  {
    id:    "test-delta-user-003",
    name:  "Astronauta Delta",
    email: "delta@astronasa.test",
    image: "https://api.dicebear.com/9.x/pixel-art/svg?seed=delta&backgroundColor=f59e0b",
    nick:  "delta",
  },
];

async function main() {
  console.log("👾 Criando usuários de teste para Space Station...\n");
  const pwHash = await hashPassword(TEST_PASSWORD);

  for (const u of TEST_USERS) {
    // 1. User
    await prisma.user.upsert({
      where:  { email: u.email },
      create: {
        id:            u.id,
        name:          u.name,
        email:         u.email,
        emailVerified: true,
        image:         u.image,
        isActive:      true,
      },
      update: {
        name:  u.name,
        image: u.image,
      },
    });

    // Buscar ID real (pode diferir se já existia com outro id)
    const user = await prisma.user.findUniqueOrThrow({ where: { email: u.email } });

    // 2. Account (credential login)
    const accountId = `account-${user.id}`;
    await prisma.account.upsert({
      where:  { id: accountId },
      create: {
        id:         accountId,
        accountId:  u.email,
        providerId: "credential",
        userId:     user.id,
        password:   pwHash,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      },
      update: { password: pwHash },
    });

    // 3. Member of ASTRO BAT org
    await prisma.member.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: ASTRO_BAT_ORG_ID } },
      create: {
        id:             `member-${user.id}`,
        organizationId: ASTRO_BAT_ORG_ID,
        userId:         user.id,
        role:           "member",
        createdAt:      new Date(),
      },
      update: {},
    });

    // 4. SpaceStation (user-type so they appear in worlds)
    await prisma.spaceStation.upsert({
      where:  { nick: u.nick },
      create: {
        id:       `station-${user.id}`,
        type:     "USER",
        userId:   user.id,
        nick:     u.nick,
        isPublic: true,
      },
      update: {},
    });

    console.log(`  ✓ ${u.name}`);
    console.log(`    Email : ${u.email}`);
    console.log(`    Senha : ${TEST_PASSWORD}`);
    console.log(`    Nick  : ${u.nick}\n`);
  }

  console.log("✅ Usuários de teste criados com sucesso!");
  console.log("\n📌 Para testar a bolha de comunicação:");
  console.log("   Abra 2+ abas e faça login com contas diferentes,");
  console.log("   entre em /station/astronasa/world e aproxime os personagens.\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
