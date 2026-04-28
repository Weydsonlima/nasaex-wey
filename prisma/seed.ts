import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

/**
 * CONFIGURAÇÃO DO SEED
 * Altere os valores abaixo conforme sua necessidade.
 */
const CONFIG = {
  userEmail: "arthur.fabricyo@gmail.com", // Email do usuário que será o criador/responsável
  workspaceName: "teste", // Nome do workspace alvo
  statuses: ["To Do", "In Progress", "Review", "Done"], // Status (colunas) que você deseja
  actionsPerStatus: 500, // Quantidade de eventos por status
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando seed de ações...");

  // 1. Buscar o usuário
  const user = await prisma.user.findFirst({
    where: { email: CONFIG.userEmail },
  });

  if (!user) {
    // Se não achar o admin, pega o primeiro usuário do sistema
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error(
        "Nenhum usuário encontrado no banco de dados. Crie um usuário primeiro.",
      );
    }
    console.log(
      `⚠️ Usuário ${CONFIG.userEmail} não encontrado. Usando ${firstUser.email}.`,
    );
    CONFIG.userEmail = firstUser.email;
  }

  const targetUser = user || (await prisma.user.findFirst())!;

  // 2. Buscar ou Criar o Workspace
  let tracking = await prisma.tracking.findFirst({
    where: { name: CONFIG.workspaceName },
  });

  if (!tracking) {
    console.log(
      `📦 Workspace "${CONFIG.workspaceName}" não encontrado. Buscando o primeiro disponível...`,
    );
    tracking = await prisma.tracking.findFirst();

    if (!tracking) {
      throw new Error(
        "Nenhum workspace encontrado. Crie um workspace primeiro.",
      );
    }
    console.log(`✅ Usando workspace: ${tracking.name} (${tracking.id})`);
  } else {
    console.log(`✅ Workspace encontrado: ${tracking.name} (${tracking.id})`);
  }

  // 3. Processar Status (Colunas) e Criar Ações
  let totalCreated = 0;

  for (const statusName of CONFIG.statuses) {
    console.log(`\n📂 Processando status: ${statusName}...`);

    // Buscar ou criar a coluna
    let column = await prisma.status.findFirst({
      where: {
        trackingId: tracking.id,
        name: { equals: statusName, mode: "insensitive" },
      },
    });

    if (!column) {
      console.log(`  ➕ Criando coluna "${statusName}"...`);
      column = await prisma.status.create({
        data: {
          name: statusName,
          trackingId: tracking.id,
          order: totalCreated, // Ordem simplificada
        },
      });
    }

    // Criar ações para esta coluna
    for (let i = 0; i < CONFIG.actionsPerStatus; i++) {
      const type = faker.helpers.arrayElement([
        "TASK",
        "ACTION",
        "MEETING",
        "NOTE",
      ]);
      const priority = faker.helpers.arrayElement([
        "NONE",
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ]);

      await prisma.lead.create({
        data: {
          name: faker.hacker.phrase(),
          phone: faker.string.numeric(11),
          email: faker.internet.email(),
          trackingId: tracking.id,
          statusId: column.id,
        },
      });
      totalCreated++;
    }
    console.log(
      `  ✨ Criadas ${CONFIG.actionsPerStatus} ações em "${statusName}".`,
    );
  }

  console.log(
    `\n🏁 Seed finalizado com sucesso! Total de ações criadas: ${totalCreated}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
