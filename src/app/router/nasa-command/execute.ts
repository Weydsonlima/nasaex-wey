import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { debitStars } from "@/lib/star-service";
import { StarTransactionType } from "@/generated/prisma/enums";
import {
  parseDate,
  parseTime,
  buildDateTime,
  parseParsedVars,
  STAR_COSTS,
  resolveContact,
  resolveUser,
  resolveProduct,
  extractTitle,
  extractTrackingName,
  generateWithAI,
  type ExecuteOutput,
} from "./execute-helpers";

// ─── Handler ──────────────────────────────────────────────────────────────────

export const execute = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({ method: "POST", summary: "Execute NASA Command", tags: ["NASA Command"] })
  .input(z.object({
    command: z.string().min(1),
    model: z.string().optional(),
    appContext: z.string().optional(),
  }))
  .output(
    z.object({
      type: z.enum(["created", "query_result", "error", "needs_input", "post_generated"]),
      title: z.string(),
      description: z.string(),
      url: z.string().optional(),
      appName: z.string(),
      extraData: z.any().optional(),
      missingFields: z.array(z.object({ key: z.string(), label: z.string() })).optional(),
      partialContext: z.record(z.string(), z.string()).optional(),
      content: z.string().optional(),
      starsSpent: z.number().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { command, appContext } = input;
    const cmd = command.toLowerCase();
    const orgId = context.org.id;

    // ── Parse "key"="value" pairs ─────────────────────────────────────────────
    const parsedVars = parseParsedVars(command);

    // ── Detect app ────────────────────────────────────────────────────────────
    const app = cmd.includes("#forge")
      ? "forge"
      : cmd.includes("#agenda")
        ? "agenda"
        : cmd.includes("#nasa-planner")
          ? "nasa-planner"
          : cmd.includes("#tracking")
            ? "tracking"
            : cmd.includes("#nbox")
              ? "nbox"
              : cmd.includes("#contatos")
                ? "contatos"
                : appContext
                  ? appContext
                  : /\b(tracking|pipeline|funil|add_tracking)\b/.test(cmd) &&
                      /\b(crie|criar|novo|nova|adicione|add)\b/.test(cmd)
                    ? "tracking"
                    : null;

    // ── Detect action type ────────────────────────────────────────────────────
    const isCreate =
      /\b(crie|cria|criar|gere|gera|gerar|fa[çc]a|fazer|agende|agendar|marque|marcar|adicione|adicionar|nova|novo|add)\b/.test(cmd);
    const isList = /\b(liste|listar|mostrar|mostre|quais|quem|ver)\b/.test(cmd);
    const isCount = /\b(quantos|quantas|total|count)\b/.test(cmd);
    const isQuery = isList || isCount;

    // ── Extract /Variables from command ───────────────────────────────────────
    const variableRegex = /\/([A-Za-zÀ-ÿ0-9_\.]+)/g;
    const variables: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = variableRegex.exec(command)) !== null) {
      variables.push(match[1]);
    }

    const dateKeywords = ["hoje", "amanhã", "amanha", "semana_que_vem"];
    const dateVars = variables.filter(
      (v) => dateKeywords.some((k) => v.toLowerCase() === k) || /^\d{2}\.\d{2}\.\d{4}$/.test(v),
    );
    const nameVars = variables.filter(
      (v) =>
        !dateKeywords.some((k) => v.toLowerCase() === k) &&
        !/^\d{2}\.\d{2}\.\d{4}$/.test(v) &&
        !v.startsWith("link_"),
    );

    // ── Resolve entities ──────────────────────────────────────────────────────
    let resolvedContact: { id: string; name: string } | null = null;
    let resolvedUser: { id: string; name: string } | null = null;
    let resolvedProduct: { id: string; name: string } | null = null;

    for (const name of nameVars) {
      if (!resolvedContact) resolvedContact = await resolveContact(name, orgId);
      if (!resolvedUser) resolvedUser = await resolveUser(name, orgId);
      if (!resolvedProduct) resolvedProduct = await resolveProduct(name, orgId);
    }

    const resolvedClientName = resolvedContact?.name ?? (nameVars[0]?.replace(/_/g, " ") ?? null);

    // ─── Helper: debit stars safely ───────────────────────────────────────────
    async function tryDebitStars(cost: number, description: string): Promise<void> {
      try {
        await debitStars(orgId, cost, StarTransactionType.APP_CHARGE, `NASA Explorer — ${description}`, "nasa-explorer");
      } catch {
        // Non-critical, don't block the response
      }
    }

    // ── STAR BALANCE ──────────────────────────────────────────────────────────
    if (cmd.includes("saldo") || cmd.includes("estrelas") || cmd.includes("stars")) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { starsBalance: true, plan: { select: { name: true } } },
      });
      const balance = org?.starsBalance ?? 0;
      const planName = org?.plan?.name ?? "FREE";
      return {
        type: "query_result" as const,
        title: "Saldo de Estrelas",
        description: `Você tem ${balance.toLocaleString("pt-BR")} estrelas disponíveis. Plano: ${planName}.`,
        appName: "NASA",
        extraData: { balance, planName },
      } satisfies ExecuteOutput;
    }

    // ── FORGE — Create proposal (enhanced) ───────────────────────────────────
    if (
      (app === "forge" || (!app && (cmd.includes("proposta") || cmd.includes("proposal")))) &&
      isCreate &&
      (cmd.includes("proposta") || cmd.includes("proposal"))
    ) {
      try {
        // Resolve productName: parsedVars first, then regex, then resolvedProduct
        let productName: string | null =
          parsedVars["produto"] ?? parsedVars["product"] ?? parsedVars["productnome"] ?? null;
        if (!productName) {
          const prodMatch = command.match(/(?:produto|serviço|product|service)\s+["']?([^"',\n]+)["']?/i);
          if (prodMatch) productName = prodMatch[1].trim();
        }
        if (!productName && resolvedProduct) productName = resolvedProduct.name;

        // Resolve clientName: parsedVars first, then resolvedContact
        let clientName: string | null =
          parsedVars["cliente"] ?? parsedVars["client"] ?? parsedVars["lead"] ?? null;
        if (!clientName && resolvedContact) clientName = resolvedContact.name;
        if (!clientName) {
          const clientMatch = command.match(/(?:para|for|cliente|lead)\s+["']?([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÀÜ][a-záéíóúâêîôûãõçàü]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÀÜa-záéíóúâêîôûãõçàü]+)*)["']?/);
          if (clientMatch) clientName = clientMatch[1].trim();
        }

        // Check required fields
        if (!productName) {
          return {
            type: "needs_input" as const,
            title: "Informação necessária",
            description: "Qual é o nome do produto ou serviço da proposta?",
            appName: "Forge",
            missingFields: [{ key: "productName", label: "Nome do produto ou serviço" }],
            partialContext: clientName ? ({ clientName } as Record<string, string>) : {},
          };
        }

        if (!clientName) {
          return {
            type: "needs_input" as const,
            title: "Informação necessária",
            description: `Para quem é a proposta do produto "${productName}"?`,
            appName: "Forge",
            missingFields: [{ key: "clientName", label: "Nome do cliente (lead)" }],
            partialContext: { productName } as Record<string, string>,
          };
        }

        // Look up product and lead
        const foundProduct = resolvedProduct ?? await resolveProduct(productName, orgId);
        const foundContact = resolvedContact ?? await resolveContact(clientName, orgId);

        const last = await prisma.forgeProposal.findFirst({
          where: { organizationId: orgId },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        const number = (last?.number ?? 0) + 1;

        // Parse validUntil
        const validUntilRaw = parsedVars["validade"] ?? parsedVars["validuntil"] ?? null;
        let validUntil: Date | null = null;
        if (validUntilRaw) validUntil = parseDate(validUntilRaw);
        else if (dateVars.length > 0) validUntil = parseDate(cmd);

        const proposalTitle = `Proposta - ${clientName}`;

        const proposal = await prisma.forgeProposal.create({
          data: {
            organizationId: orgId,
            title: proposalTitle,
            number,
            clientId: foundContact?.id ?? null,
            responsibleId: resolvedUser?.id ?? context.user.id,
            participants: [],
            validUntil,
            status: "RASCUNHO" as never,
            description: foundProduct ? `Produto: ${foundProduct.name}\n\n${command}` : command,
            headerConfig: {},
            createdById: context.user.id,
          },
          select: { id: true, number: true },
        });

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Proposta criada — ${proposalTitle}`);

        return {
          type: "created" as const,
          title: "Proposta criada!",
          description: `Proposta "${proposalTitle}" criada no Forge.${foundProduct ? ` Produto: ${foundProduct.name}.` : ""}`,
          url: `/forge?tab=proposals&id=${proposal.id}`,
          appName: "Forge",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute forge proposal enhanced]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── FORGE — Create contract ───────────────────────────────────────────────
    if (app === "forge" && isCreate && cmd.includes("contrato")) {
      try {
        const lastContract = await prisma.forgeContract.findFirst({
          where: { organizationId: orgId },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        const number = (lastContract?.number ?? 0) + 1;
        const startDate = new Date();
        const endDate = dateVars.length > 0
          ? parseDate(cmd)
          : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

        const contract = await prisma.forgeContract.create({
          data: {
            organizationId: orgId,
            number,
            startDate,
            endDate,
            value: 0,
            status: "PENDENTE_ASSINATURA" as never,
            signers: [],
            content: command,
            createdById: context.user.id,
          },
          select: { id: true, number: true },
        });

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Contrato #${contract.number} criado`);

        return {
          type: "created" as const,
          title: "Contrato criado!",
          description: `Contrato #${contract.number} criado no Forge aguardando assinatura.`,
          url: `/forge?tab=contracts&id=${contract.id}`,
          appName: "Forge",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute forge contract]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── FORGE — List proposals ────────────────────────────────────────────────
    if (app === "forge" && isQuery) {
      try {
        const proposals = await prisma.forgeProposal.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, status: true, number: true },
        });
        const list = proposals.map((p) => `#${p.number} — ${p.title} (${p.status})`).join("\n");
        return {
          type: "query_result" as const,
          title: `${proposals.length} propostas encontradas`,
          description: proposals.length > 0 ? list : "Nenhuma proposta encontrada.",
          url: "/forge",
          appName: "Forge",
          extraData: { proposals },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute forge list]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── TRACKING — Move lead ──────────────────────────────────────────────────
    if (
      (app === "tracking" || !app) &&
      /\b(mov|mova|mover)\b/.test(cmd) &&
      cmd.includes("lead")
    ) {
      try {
        // Extract leadName
        let leadName: string | null =
          parsedVars["lead"] ?? parsedVars["nome"] ?? null;
        if (!leadName && resolvedContact) leadName = resolvedContact.name;
        if (!leadName) {
          const leadMatch = command.match(/lead\s+["']?([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇÀÜ][a-záéíóúâêîôûãõçàü\s]+)["']?/i);
          if (leadMatch) leadName = leadMatch[1].trim();
        }

        // Extract statusName
        let statusName: string | null =
          parsedVars["status"] ?? parsedVars["etapa"] ?? null;
        if (!statusName) {
          const statusMatch = command.match(/(?:para|to|status)\s+["']?([^"',\n]+)["']?/i);
          if (statusMatch) statusName = statusMatch[1].trim();
        }

        // Extract trackingName (optional)
        const trackingName: string | null =
          parsedVars["tracking"] ?? parsedVars["pipeline"] ?? null;

        if (!statusName) {
          return {
            type: "needs_input" as const,
            title: "Informação necessária",
            description: `Para qual status mover o lead${leadName ? ` "${leadName}"` : ""}?`,
            appName: "Tracking",
            missingFields: [{ key: "statusName", label: `Para qual status mover o lead${leadName ? ` ${leadName}` : ""}?` }],
            partialContext: leadName ? ({ leadName } as Record<string, string>) : {},
          };
        }

        // Find lead
        const lead = leadName
          ? await prisma.lead.findFirst({
              where: {
                name: { contains: leadName, mode: "insensitive" },
                tracking: { organizationId: orgId },
              },
              select: { id: true, name: true, trackingId: true },
            })
          : null;

        if (!lead) {
          return {
            type: "error" as const,
            title: "Lead não encontrado",
            description: `Não foi possível encontrar o lead "${leadName ?? "informado"}". Verifique o nome e tente novamente.`,
            appName: "Tracking",
          } satisfies ExecuteOutput;
        }

        // Find tracking
        let trackingId = lead.trackingId;
        if (trackingName) {
          const tracking = await prisma.tracking.findFirst({
            where: { organizationId: orgId, name: { contains: trackingName, mode: "insensitive" } },
            select: { id: true },
          });
          if (tracking) trackingId = tracking.id;
        }

        // Find status
        const status = await prisma.status.findFirst({
          where: {
            trackingId,
            name: { contains: statusName, mode: "insensitive" },
          },
          select: { id: true, name: true },
        });

        if (!status) {
          return {
            type: "error" as const,
            title: "Status não encontrado",
            description: `Status "${statusName}" não encontrado no tracking. Verifique o nome da etapa.`,
            appName: "Tracking",
          } satisfies ExecuteOutput;
        }

        await prisma.lead.update({
          where: { id: lead.id },
          data: { statusId: status.id, trackingId },
        });

        const cost = STAR_COSTS.move;
        await tryDebitStars(cost, `Lead "${lead.name}" movido para "${status.name}"`);

        return {
          type: "created" as const,
          title: "Lead movido!",
          description: `Lead "${lead.name}" movido para a etapa "${status.name}".`,
          url: "/tracking",
          appName: "Tracking",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute move lead]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── NASA PLANNER — Generate post with AI ──────────────────────────────────
    if (
      (app === "nasa-planner" || cmd.includes("#nasa-planner")) &&
      (cmd.includes("post") || cmd.includes("crie um post") || cmd.includes("gere um post"))
    ) {
      try {
        // Extract topic
        const topic =
          parsedVars["tema"] ??
          parsedVars["assunto"] ??
          parsedVars["topic"] ??
          extractTitle(command);

        const postType = cmd.includes("carrossel") || cmd.includes("carousel")
          ? "carousel"
          : cmd.includes("reel") || cmd.includes("vídeo") || cmd.includes("video")
            ? "reel"
            : cmd.includes("story")
              ? "story"
              : "static";

        const network = cmd.includes("linkedin")
          ? "LinkedIn"
          : cmd.includes("twitter") || cmd.includes("thread")
            ? "Twitter/X"
            : cmd.includes("tiktok")
              ? "TikTok"
              : "Instagram";

        const postSystemPrompt = `Você é um especialista em marketing de conteúdo. Crie conteúdo para redes sociais em português do Brasil.
Responda com o seguinte formato exato (sem markdown extra):

TÍTULO: [título chamativo]
LEGENDA: [legenda completa para o post]
HASHTAGS: [lista de hashtags relevantes]
CTA: [chamada para ação]`;

        const postUserPrompt = `Crie um ${postType === "carousel" ? "carrossel" : postType === "reel" ? "reel" : postType === "story" ? "story" : "post"} para ${network} sobre: ${topic}`;

        const aiContent = await generateWithAI(orgId, postSystemPrompt, postUserPrompt);

        if (!aiContent) {
          // Fallback: create draft without AI content
          let planner = await prisma.nasaPlanner.findFirst({
            where: { organizationId: orgId },
            orderBy: { createdAt: "asc" },
          });
          if (!planner) {
            planner = await prisma.nasaPlanner.create({
              data: { organizationId: orgId, name: "Planner Principal" },
            });
          }
          await prisma.nasaPlannerPost.create({
            data: {
              plannerId: planner.id,
              organizationId: orgId,
              createdById: context.user.id,
              type: postType.toUpperCase() as never,
              title: topic,
              targetNetworks: [network.toLowerCase()],
              aiPrompt: command,
              status: "DRAFT" as never,
              hashtags: [],
            },
          });
          return {
            type: "created" as const,
            title: "Post criado!",
            description: `Rascunho criado no NASA Planner. Conecte uma IA para gerar o conteúdo automaticamente.`,
            url: "/nasa-planner",
            appName: "NASA Planner",
          } satisfies ExecuteOutput;
        }

        // Parse AI response into structured content
        const content = aiContent;
        const titleMatch = content.match(/TÍTULO:\s*(.+)/i);
        const captionMatch = content.match(/LEGENDA:\s*([\s\S]+?)(?=HASHTAGS:|$)/i);
        const hashtagsMatch = content.match(/HASHTAGS:\s*(.+)/i);
        const ctaMatch = content.match(/CTA:\s*(.+)/i);

        const postTitle = titleMatch?.[1]?.trim() ?? topic;
        const caption = captionMatch?.[1]?.trim() ?? "";
        const hashtags = hashtagsMatch?.[1]?.trim() ?? "";
        const cta = ctaMatch?.[1]?.trim() ?? "";

        const formattedContent = `**${postTitle}**\n\n${caption}\n\n${hashtags}\n\n📣 ${cta}`;

        // Save draft to NASA Planner
        let planner = await prisma.nasaPlanner.findFirst({
          where: { organizationId: orgId },
          orderBy: { createdAt: "asc" },
        });
        if (!planner) {
          planner = await prisma.nasaPlanner.create({
            data: { organizationId: orgId, name: "Planner Principal" },
          });
        }
        await prisma.nasaPlannerPost.create({
          data: {
            plannerId: planner.id,
            organizationId: orgId,
            createdById: context.user.id,
            type: postType.toUpperCase() as never,
            title: postTitle,
            targetNetworks: [network.toLowerCase()],
            aiPrompt: command,
            status: "DRAFT" as never,
            hashtags: hashtags ? hashtags.split(/\s+/).filter((h) => h.startsWith("#")) : [],
          },
        });

        const cost = STAR_COSTS.ai_generate;
        await tryDebitStars(cost, `Post gerado com IA — ${topic}`);

        return {
          type: "post_generated" as const,
          title: "Post gerado!",
          description: caption.slice(0, 150) + (caption.length > 150 ? "..." : ""),
          url: "/nasa-planner",
          appName: "NASA Planner",
          content: formattedContent,
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute generate post]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── NASA PLANNER — Create post (existing handler) ──────────────────────────
    if (app === "nasa-planner" && isCreate) {
      try {
        const postType = cmd.includes("carrossel")
          ? "CAROUSEL"
          : cmd.includes("reel") || cmd.includes("vídeo") || cmd.includes("video")
            ? "REEL"
            : cmd.includes("story")
              ? "STORY"
              : "STATIC";

        const networks = cmd.includes("linkedin")
          ? ["linkedin"]
          : cmd.includes("twitter") || cmd.includes("thread")
            ? ["twitter"]
            : ["instagram"];

        let planner = await prisma.nasaPlanner.findFirst({
          where: { organizationId: orgId },
          orderBy: { createdAt: "asc" },
        });
        if (!planner) {
          planner = await prisma.nasaPlanner.create({
            data: { organizationId: orgId, name: "Planner Principal" },
          });
        }

        const post = await prisma.nasaPlannerPost.create({
          data: {
            plannerId: planner.id,
            organizationId: orgId,
            createdById: context.user.id,
            type: postType as never,
            title: extractTitle(command),
            targetNetworks: networks,
            aiPrompt: command,
            status: "DRAFT" as never,
            hashtags: [],
          },
          select: { id: true },
        });

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Post criado no NASA Planner`);

        return {
          type: "created" as const,
          title: "Post criado no NASA Planner!",
          description: `${postType === "CAROUSEL" ? "Carrossel" : postType === "REEL" ? "Reel" : postType === "STORY" ? "Story" : "Post"} criado como rascunho para ${networks.join(", ")}.`,
          url: `/nasa-planner`,
          appName: "NASA Planner",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute nasa-planner]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── AGENDA — Create appointment ───────────────────────────────────────────
    if (app === "agenda" && isCreate) {
      try {
        const agenda = await prisma.agenda.findFirst({
          where: { organizationId: orgId, isActive: true },
        });
        if (!agenda) {
          throw errors.BAD_REQUEST;
        }

        const appointmentDate = parseDate(cmd);
        const timeStr = parseTime(cmd) ?? "09:00";
        const startsAt = buildDateTime(appointmentDate, timeStr);
        const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

        await prisma.appointment.create({
          data: {
            agendaId: agenda.id,
            title: `Reunião - ${resolvedClientName ?? "Cliente"}`,
            status: "PENDING" as never,
            notes: command,
            startsAt,
            endsAt,
            leadId: resolvedContact?.id ?? null,
            userId: resolvedUser?.id ?? context.user.id,
            trackingId: agenda.trackingId,
          },
          select: { id: true },
        });

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Agendamento criado`);

        return {
          type: "created" as const,
          title: "Agendamento criado!",
          description: `Reunião com ${resolvedClientName ?? "cliente"} agendada para ${startsAt.toLocaleDateString("pt-BR")} às ${timeStr}.`,
          url: `/agendas`,
          appName: "Agenda",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e?.code === "BAD_REQUEST") throw err;
        console.error("[nasa-command/execute agenda appointment]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── AGENDA — Query today's appointments ───────────────────────────────────
    if (
      (app === "agenda" && isQuery) ||
      (cmd.includes("reuniões") && cmd.includes("hoje")) ||
      (cmd.includes("compromissos") && cmd.includes("hoje"))
    ) {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const agendas = await prisma.agenda.findMany({
          where: { organizationId: orgId },
          select: { id: true },
        });
        const agendaIds = agendas.map((a) => a.id);

        const appointments = await prisma.appointment.findMany({
          where: {
            agendaId: { in: agendaIds },
            startsAt: { gte: todayStart, lt: todayEnd },
          },
          orderBy: { startsAt: "asc" },
          select: { title: true, startsAt: true, status: true },
        });

        const list = appointments
          .map(
            (a) =>
              `${a.startsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — ${a.title ?? "Reunião"} (${a.status})`,
          )
          .join("\n");

        return {
          type: "query_result" as const,
          title: `${appointments.length} compromisso(s) hoje`,
          description: appointments.length > 0 ? list : "Nenhum compromisso para hoje.",
          url: "/agendas",
          appName: "Agenda",
          extraData: { appointments },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute agenda query]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── TRACKING — Create tracking ────────────────────────────────────────────
    if (
      app === "tracking" &&
      isCreate &&
      !cmd.includes("lead") &&
      !cmd.includes("/novo_lead")
    ) {
      try {
        const trackingName = extractTrackingName(command);
        const tracking = await prisma.tracking.create({
          data: {
            organizationId: orgId,
            name: trackingName,
            description: command,
          },
          select: { id: true, name: true },
        });

        await prisma.trackingParticipant.create({
          data: { trackingId: tracking.id, userId: context.user.id, role: "OWNER" },
        });

        const defaultStatuses = ["Prospecção", "Contato", "Proposta", "Fechado"];
        try {
          await Promise.all(
            defaultStatuses.map((statusName, i) =>
              prisma.status.create({ data: { name: statusName, trackingId: tracking.id, order: i } }),
            ),
          );
        } catch (statusErr) {
          console.error("[nasa-command/execute create tracking statuses]", statusErr);
        }

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Tracking "${tracking.name}" criado`);

        return {
          type: "created" as const,
          title: `Tracking "${tracking.name}" criado!`,
          description: `Pipeline criado com as etapas: Prospecção, Contato, Proposta, Fechado. Acesse o app para personalizar.`,
          url: `/tracking`,
          appName: "Tracking",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute create tracking]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── TRACKING — Create lead ────────────────────────────────────────────────
    if (app === "tracking" && isCreate && cmd.includes("lead")) {
      try {
        const firstTracking = await prisma.tracking.findFirst({
          where: { organizationId: orgId },
        });
        if (!firstTracking) {
          throw errors.BAD_REQUEST;
        }

        const firstStatus = await prisma.status.findFirst({
          where: { trackingId: firstTracking.id },
          orderBy: { order: "asc" },
        });
        if (!firstStatus) {
          throw errors.BAD_REQUEST;
        }

        const leadName =
          parsedVars["lead"] ??
          parsedVars["nome"] ??
          resolvedClientName ??
          nameVars[0]?.replace(/_/g, " ") ??
          "Novo Lead";

        const lead = await prisma.lead.create({
          data: { name: leadName, trackingId: firstTracking.id, statusId: firstStatus.id },
          select: { id: true, name: true },
        });

        const cost = STAR_COSTS.create;
        await tryDebitStars(cost, `Lead "${lead.name}" criado`);

        return {
          type: "created" as const,
          title: "Lead criado!",
          description: `Lead "${lead.name}" adicionado ao tracking "${firstTracking.name}".`,
          url: `/tracking`,
          appName: "Tracking",
          starsSpent: cost,
        } satisfies ExecuteOutput;
      } catch (err: unknown) {
        const e = err as { code?: string };
        if (e?.code === "BAD_REQUEST") throw err;
        console.error("[nasa-command/execute create lead]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── TRACKING — Count leads ────────────────────────────────────────────────
    if (app === "tracking" && isCount) {
      try {
        const count = await prisma.lead.count({
          where: { isActive: true, tracking: { organizationId: orgId } },
        });
        return {
          type: "query_result" as const,
          title: "Total de leads",
          description: `Você tem ${count.toLocaleString("pt-BR")} lead(s) ativo(s) no total.`,
          appName: "Tracking",
          extraData: { count },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute count leads]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── Generic count leads (no app prefix) ──────────────────────────────────
    if (isCount && cmd.includes("lead")) {
      try {
        const count = await prisma.lead.count({
          where: { isActive: true, tracking: { organizationId: orgId } },
        });
        return {
          type: "query_result" as const,
          title: "Total de leads",
          description: `Você tem ${count.toLocaleString("pt-BR")} lead(s) ativo(s) no total.`,
          appName: "Tracking",
          extraData: { count },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute count leads generic]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── QUERY DATA — resultado, campanha, relatório, performance, dados de ─────
    if (
      cmd.includes("resultado") ||
      cmd.includes("campanha") ||
      cmd.includes("relatório") ||
      cmd.includes("relatorio") ||
      cmd.includes("performance") ||
      /\bdados de\b/.test(cmd)
    ) {
      try {
        const [leadCount, trackings] = await Promise.all([
          prisma.lead.count({ where: { isActive: true, tracking: { organizationId: orgId } } }),
          prisma.tracking.findMany({
            where: { organizationId: orgId },
            take: 5,
            select: { id: true, name: true, _count: { select: { leads: true } } },
          }),
        ]);

        const trackingLines = trackings.map((t) => `• ${t.name}: ${t._count.leads} leads`).join("\n");
        const description = `Total de leads ativos: ${leadCount.toLocaleString("pt-BR")}\n\nTrackings:\n${trackingLines || "Nenhum tracking encontrado."}`;

        return {
          type: "query_result" as const,
          title: "Dados da organização",
          description,
          appName: "NASA",
          extraData: { leadCount, trackings },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute query data]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── /pesquisar — Busca universal ──────────────────────────────────────────
    if (
      cmd.includes("/pesquisar") ||
      cmd.includes("pesquise") ||
      cmd.includes("pesquisar") ||
      cmd.includes("busque") ||
      cmd.includes("buscar") ||
      cmd.includes("encontre")
    ) {
      try {
        const searchTermMatch =
          command.match(/\/pesquisar\s+(.+)/i) ??
          command.match(/(?:pesquise|busque|buscar|encontre|pesquisar)\s+(.+)/i);
        const term = searchTermMatch?.[1]?.replace(/[#/]/g, "").trim() ?? "";
        const termNorm = term.replace(/_/g, " ").trim();

        if (!termNorm) {
          return {
            type: "query_result" as const,
            title: "Pesquisa",
            description: "Informe o que deseja pesquisar. Ex: /pesquisar Francisco ou /pesquisar Clientes 2026",
            appName: "NASA",
          } satisfies ExecuteOutput;
        }

        const [leads, users, trackings, products] = await Promise.all([
          prisma.lead.findMany({
            where: {
              isActive: true,
              tracking: { organizationId: orgId },
              OR: [
                { name: { contains: termNorm, mode: "insensitive" } },
                { email: { contains: termNorm, mode: "insensitive" } },
              ],
            },
            take: 5,
            select: { id: true, name: true, email: true },
          }),
          prisma.member.findMany({
            where: {
              organizationId: orgId,
              user: {
                OR: [
                  { name: { contains: termNorm, mode: "insensitive" } },
                  { email: { contains: termNorm, mode: "insensitive" } },
                ],
              },
            },
            take: 5,
            include: { user: { select: { id: true, name: true, email: true } } },
          }),
          prisma.tracking.findMany({
            where: { organizationId: orgId, name: { contains: termNorm, mode: "insensitive" } },
            take: 5,
            select: { id: true, name: true },
          }),
          prisma.forgeProduct.findMany({
            where: { organizationId: orgId, name: { contains: termNorm, mode: "insensitive" } },
            take: 5,
            select: { id: true, name: true },
          }),
        ]);

        const lines: string[] = [];
        if (leads.length > 0) lines.push(`👤 Leads: ${leads.map((l) => `${l.name}${l.email ? ` (${l.email})` : ""}`).join(", ")}`);
        if (users.length > 0) lines.push(`🧑‍💼 Usuários: ${users.map((m) => m.user.name ?? m.user.email).join(", ")}`);
        if (trackings.length > 0) lines.push(`📊 Trackings: ${trackings.map((t) => t.name).join(", ")}`);
        if (products.length > 0) lines.push(`📦 Produtos: ${products.map((p) => p.name).join(", ")}`);

        const total = leads.length + users.length + trackings.length + products.length;

        return {
          type: "query_result" as const,
          title: total > 0 ? `${total} resultado(s) para "${termNorm}"` : `Nenhum resultado para "${termNorm}"`,
          description: total > 0 ? lines.join("\n") : "Tente outro termo. A busca cobre: leads, usuários, trackings e produtos.",
          url: total > 0 ? "/tracking" : undefined,
          appName: "NASA",
          extraData: { leads, users: users.map((m) => m.user), trackings, products },
        } satisfies ExecuteOutput;
      } catch (err) {
        console.error("[nasa-command/execute pesquisar]", err);
        throw errors.INTERNAL_SERVER_ERROR;
      }
    }

    // ── DEFAULT FALLBACK ──────────────────────────────────────────────────────
    return {
      type: "query_result" as const,
      title: "Comando processado",
      description:
        "Não foi possível identificar uma ação específica. Tente usar #app para especificar o destino (ex: #forge, #agenda, #nasa-planner, #tracking).",
      appName: "NASA",
    } satisfies ExecuteOutput;
  });
