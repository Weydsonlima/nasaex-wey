/**
 * Script: set-system-admin.ts
 *
 * Define weydsonlima@gmail.com como System Admin (isSystemAdmin = true)
 * no banco de produção — https://orbita.nasaex.com/admin
 *
 * O System Admin pode acessar /admin e adicionar outros moderadores
 * através do painel em /admin/moderators.
 *
 * Uso (produção):
 *   DATABASE_URL="postgresql://..." npx tsx prisma/set-system-admin.ts
 *
 * Uso (local):
 *   npx tsx prisma/set-system-admin.ts
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "weydsonlima@gmail.com";

async function main() {
  console.log(`\n🚀  NASA.ex — Setup de System Admin`);
  console.log(`    Ambiente: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`    Email:    ${ADMIN_EMAIL}\n`);

  // Localiza o usuário
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, name: true, email: true, isSystemAdmin: true },
  });

  if (!user) {
    console.error(`❌  Usuário "${ADMIN_EMAIL}" não encontrado no banco.`);
    console.error(`    Certifique-se de que o usuário criou a conta antes de rodar este script.`);
    process.exit(1);
  }

  if (user.isSystemAdmin) {
    console.log(`✅  ${user.name ?? user.email} já é System Admin. Nada a fazer.`);
    return;
  }

  // Eleva para System Admin
  await prisma.user.update({
    where: { id: user.id },
    data:  { isSystemAdmin: true },
  });

  console.log(`🌟  ${user.name ?? user.email} (${user.id}) agora é System Admin!`);
  console.log(`    Acesse: https://orbita.nasaex.com/admin`);
  console.log(`    A partir daí, adicione outros moderadores em /admin/moderators.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
