import {
  LeadSource,
  PrismaClient,
  Temperature,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const TARGET_TRACKING_ID = "cmnhg7dll000r98vakdsqn7rp"; // 1. Variável para o Tracking
const STATUS_A_ID = "cmnhg7dlo000t98va424ld2t7"; // 2. Coluna A
const STATUS_B_ID = "cmnhg7dlo000u98vakcontg82"; // 3. Coluna B
const STATUS_C_ID = "cmnhg7dlo000v98va98zvacq3"; // 4. Coluna C

const statusList = [STATUS_A_ID, STATUS_B_ID, STATUS_C_ID];

async function main() {
  console.log("🚀 Iniciando seed de 1000 leads...");

  const leadsData = [];

  for (let i = 0; i < 1000; i++) {
    const randomStatus =
      statusList[Math.floor(Math.random() * statusList.length)];

    const uniquePhone = `55${faker.string.numeric(8)}${i.toString().padStart(4, "0")}`;

    leadsData.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      phone: uniquePhone,
      description: faker.lorem.sentence(),
      trackingId: TARGET_TRACKING_ID,
      statusId: randomStatus,
      order: i,
      amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
      source: LeadSource.DEFAULT,
      temperature: Temperature.COLD,
      isActive: true,
    });
  }

  // Uso do createMany para performance com 1000 registros
  const result = await prisma.lead.createMany({
    data: leadsData,
    skipDuplicates: true,
  });

  console.log(`✅ Seed finalizada! ${result.count} leads foram criados.`);
  console.log(`📍 Tracking: ${TARGET_TRACKING_ID}`);
  console.log(`📊 Distribuídos entre os status: ${statusList.join(", ")}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
