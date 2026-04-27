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
  userEmail: "admin@example.com", // Email do usuário que será o criador/responsável
  workspaceName: "Meu Workspace de Teste", // Nome do workspace alvo
  statuses: ["To Do", "In Progress", "Review", "Done"], // Status (colunas) que você deseja
  actionsPerStatus: 5, // Quantidade de eventos por status
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
      throw new Error("Nenhum usuário encontrado no banco de dados. Crie um usuário primeiro.");
    }
    console.log(`⚠️ Usuário ${CONFIG.userEmail} não encontrado. Usando ${firstUser.email}.`);
    CONFIG.userEmail = firstUser.email;
  }

  const targetUser = user || (await prisma.user.findFirst())!;

  // 2. Buscar ou Criar o Workspace
  let workspace = await prisma.workspace.findFirst({
    where: { name: CONFIG.workspaceName },
  });

  if (!workspace) {
    console.log(`📦 Workspace "${CONFIG.workspaceName}" não encontrado. Buscando o primeiro disponível...`);
    workspace = await prisma.workspace.findFirst();
    
    if (!workspace) {
      throw new Error("Nenhum workspace encontrado. Crie um workspace primeiro.");
    }
    console.log(`✅ Usando workspace: ${workspace.name} (${workspace.id})`);
  } else {
    console.log(`✅ Workspace encontrado: ${workspace.name} (${workspace.id})`);
  }

  // 3. Processar Status (Colunas) e Criar Ações
  let totalCreated = 0;

  for (const statusName of CONFIG.statuses) {
    console.log(`\n📂 Processando status: ${statusName}...`);

    // Buscar ou criar a coluna
    let column = await prisma.workspaceColumn.findFirst({
      where: {
        workspaceId: workspace.id,
        name: { equals: statusName, mode: 'insensitive' }
      }
    });

    if (!column) {
      console.log(`  ➕ Criando coluna "${statusName}"...`);
      column = await prisma.workspaceColumn.create({
        data: {
          name: statusName,
          workspaceId: workspace.id,
          order: totalCreated, // Ordem simplificada
        }
      });
    }

    // Criar ações para esta coluna
    for (let i = 0; i < CONFIG.actionsPerStatus; i++) {
      const type = faker.helpers.arrayElement(['TASK', 'ACTION', 'MEETING', 'NOTE']);
      const priority = faker.helpers.arrayElement(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']);
      
      await prisma.action.create({
        data: {
          title: faker.hacker.phrase(),
          description: faker.lorem.paragraph(),
          type: type as any,
          priority: priority as any,
          isDone: statusName.toLowerCase() === 'done',
          workspaceId: workspace.id,
          columnId: column.id,
          createdBy: targetUser.id,
          organizationId: workspace.organizationId,
          trackingId: workspace.trackingId,
          dueDate: faker.date.soon({ days: 30 }),
          startDate: faker.date.recent({ days: 7 }),
          order: i,
        }
      });
      totalCreated++;
    }
    console.log(`  ✨ Criadas ${CONFIG.actionsPerStatus} ações em "${statusName}".`);
  }

  console.log(`\n🏁 Seed finalizado com sucesso! Total de ações criadas: ${totalCreated}`);
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
