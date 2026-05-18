/**
 * Seed do WorldTemplate "Convention Hall — MVP".
 *
 * Cria um template público de mapa pré-feito pro primeiro evento de
 * convenção: hall central, 4 estandes, 1 auditório (stage zone), portais
 * de entrada/saída.
 *
 * Roda assim:
 *   pnpm exec tsx prisma/seed-world-event-templates.ts
 *
 * Idempotente: upsert por id estável.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const TEMPLATE_ID = "convention-hall-mvp-v1";
const SYSTEM_AUTHOR_NICK = "nasa-system"; // user de seed; precisa existir

// ─── Mapa estilizado ────────────────────────────────────────────────────────
// Dimensões: 128×128 tiles (4096×4096 px com T=32).
// Estrutura: hall central (0,0)–(127,127) com elementos:
//   - Stage (auditório) no centro-norte
//   - 4 estandes nas paredes
//   - Portais nas bordas

const MAP_WIDTH = 128;
const MAP_HEIGHT = 128;
const TILE = 32;

const mapData = {
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tileSize: TILE,
  spawnPoint: { x: 64 * TILE, y: 120 * TILE }, // entrada sul
  background: { color: "#1a1f2e" },
  // Tilemap: floor uniforme + paredes nas bordas.
  // Cada layer é uma matriz [y][x] de IDs (0 = vazio).
  layers: {
    floor: Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => 1),
    ),
    walls: buildWallsLayer(),
  },
  // Pontos de interesse (renderizados como objetos decorativos).
  objects: [
    {
      kind: "label",
      text: "Auditório Principal",
      x: 64 * TILE,
      y: 30 * TILE,
    },
    { kind: "label", text: "Estande A", x: 24 * TILE, y: 60 * TILE },
    { kind: "label", text: "Estande B", x: 104 * TILE, y: 60 * TILE },
    { kind: "label", text: "Estande C", x: 24 * TILE, y: 90 * TILE },
    { kind: "label", text: "Estande D", x: 104 * TILE, y: 90 * TILE },
  ],
};

// Zones do evento — copiar pra `WorldEvent.zones` ao criar evento a partir
// desse template via UI ou via apply-world-template (a tela de criação
// gera o `mapData` mas o evento ganha as `zones` separadamente).
export const CONVENTION_HALL_ZONES = [
  {
    name: "stage_main",
    kind: "stage" as const,
    x: 48 * TILE,
    y: 16 * TILE,
    w: 32 * TILE,
    h: 28 * TILE,
    sfuRoomId: undefined, // setado em runtime: `event:<id>:stage`
    label: "Auditório Principal",
  },
  {
    name: "booth_a",
    kind: "booth" as const,
    x: 12 * TILE,
    y: 52 * TILE,
    w: 24 * TILE,
    h: 16 * TILE,
    label: "Estande A",
  },
  {
    name: "booth_b",
    kind: "booth" as const,
    x: 92 * TILE,
    y: 52 * TILE,
    w: 24 * TILE,
    h: 16 * TILE,
    label: "Estande B",
  },
  {
    name: "booth_c",
    kind: "booth" as const,
    x: 12 * TILE,
    y: 82 * TILE,
    w: 24 * TILE,
    h: 16 * TILE,
    label: "Estande C",
  },
  {
    name: "booth_d",
    kind: "booth" as const,
    x: 92 * TILE,
    y: 82 * TILE,
    w: 24 * TILE,
    h: 16 * TILE,
    label: "Estande D",
  },
  {
    name: "exit_south",
    kind: "portal" as const,
    x: 60 * TILE,
    y: 124 * TILE,
    w: 8 * TILE,
    h: 4 * TILE,
    destination: "home",
    label: "Saída",
  },
];

function buildWallsLayer(): number[][] {
  const grid = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 0),
  );
  // Parede em toda borda
  for (let x = 0; x < MAP_WIDTH; x++) {
    grid[0][x] = 2;
    grid[MAP_HEIGHT - 1][x] = 2;
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    grid[y][0] = 2;
    grid[y][MAP_WIDTH - 1] = 2;
  }
  return grid;
}

async function main() {
  // Acha author válido (qualquer User; idealmente um "nasa-system").
  const author =
    (await prisma.user.findFirst({
      where: { OR: [{ email: { contains: SYSTEM_AUTHOR_NICK } }] },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ select: { id: true } }));

  if (!author) {
    console.error(
      "❌ Nenhum User encontrado pra atribuir como author do template.",
    );
    process.exit(1);
  }

  await prisma.worldTemplate.upsert({
    where: { id: TEMPLATE_ID },
    update: {
      name: "Convention Hall — MVP",
      description:
        "Hall central com 4 estandes + auditório (stage zone) — template inicial pra WorldEvents.",
      mapData,
      category: "OTHER",
      isPublic: true,
    },
    create: {
      id: TEMPLATE_ID,
      name: "Convention Hall — MVP",
      description:
        "Hall central com 4 estandes + auditório (stage zone) — template inicial pra WorldEvents.",
      authorId: author.id,
      mapData,
      category: "OTHER",
      isPublic: true,
    },
  });

  console.log(
    `✅ WorldTemplate seed concluído: ${TEMPLATE_ID}\n` +
      `   Zones embarcadas (pra copiar em WorldEvent.zones): ${CONVENTION_HALL_ZONES.length}`,
  );
  console.log(JSON.stringify(CONVENTION_HALL_ZONES, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
