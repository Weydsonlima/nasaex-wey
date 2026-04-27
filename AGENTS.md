# N.A.S.A – Plataforma de Tracking de Leads
> Memória persistente do projeto para Codex. Leia este arquivo antes de qualquer mudança.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| UI | Tailwind CSS 4 + Radix UI + shadcn/ui |
| Estado global | Zustand |
| Formulários | React Hook Form + Zod |
| Dados (client) | TanStack Query + TanStack Table |
| Editor de texto | TipTap |
| Drag & Drop | @dnd-kit |
| RPC | oRPC — handler em `/api/rpc` |
| Autenticação | better-auth (email/senha + Google OAuth) |
| Banco de dados | PostgreSQL + Prisma 7 |
| Infra local | Docker Compose |
| Automações | Inngest |
| Package manager | pnpm |

## Comandos Essenciais

```bash
pnpm dev              # Iniciar projeto
pnpm inngest:dev      # Iniciar Inngest (Automações)
npm run db:generate   # Gerar cliente Prisma
npm run db:migrate    # Rodar migrações
npm run db:studio     # Abrir Prisma Studio
npm run build         # Build de produção
git add .
git commit -m "msg"
git push main
```

## Banco de Dados

- **Engine**: PostgreSQL via Docker Compose
- **Porta**: 5432
- **Database**: nasa_db
- **User / Pass**: docker / docker
- **Connection string**: `postgresql://docker:docker@localhost/nasa_db`
- **Schema**: `prisma/schema.prisma`

## Variáveis de Ambiente

Arquivo `.env.local` na raiz. Variáveis principais:
- `DATABASE_URL` — string de conexão PostgreSQL
- `BETTER_AUTH_SECRET` — chave secreta de autenticação
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` — Inngest

## Estrutura do Projeto

```
nasaex-wey/
├── src/
│   ├── app/          # Rotas Next.js (App Router)
│   ├── components/   # Componentes React
│   ├── lib/          # Utilitários e configurações
│   └── server/       # Lógica server-side + oRPC procedures
├── prisma/
│   └── schema.prisma # Schema do banco de dados
├── docker-compose.yml
└── AGENTS.md         # Este arquivo
```

## Funcionalidades Principais

- **Tracking de Leads** — pipeline de vendas com drag & drop
- **Autenticação** — email/senha + Google OAuth via better-auth
- **Editor Rico** — TipTap para notas e descrições
- **Automações** — workflows assíncronos com Inngest
- **Tabelas** — TanStack Table com filtros e paginação
- **RPC tipado** — oRPC para comunicação client/server

## Notas Importantes para o Codex

1. **Sempre** checar `prisma/schema.prisma` antes de modificar o banco
2. Procedures oRPC ficam em `src/server/`
3. Componentes UI via shadcn/ui (`npx shadcn@latest add <componente>`)
4. Lógica assíncrona vai em Inngest — nunca em routes longas
5. Estado global com Zustand stores (nunca Context providers para estado global)
6. **Sempre usar `pnpm add`** — nunca `npm install`
7. TypeScript strict mode — sem `any` implícito
8. Imports de servidor nunca dentro de Client Components

## Obsidian

Vault: `NASA Agents` em `/Users/weydsonlima/Documents/NASA Agents/`
Nota principal: `AGENTS.md` no vault (cópia desta documentação + contexto extra)
