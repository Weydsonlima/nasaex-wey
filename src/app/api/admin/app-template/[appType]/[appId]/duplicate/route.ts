import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ appType: string; appId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const org = await auth.api.getFullOrganization({ headers: request.headers });
    if (!org?.id) return NextResponse.json({ error: "Organização não encontrada" }, { status: 400 });

    const { appType, appId } = await params;

    switch (appType) {
      case "tracking": {
        const template = await prisma.tracking.findUnique({
          where: { id: appId },
          include: {
            status: { select: { name: true, color: true, order: true } },
            winLossReasons: { select: { name: true, type: true } },
            aiSettings: { select: { assistantName: true, prompt: true, finishSentence: true } },
          },
        });
        if (!template) return NextResponse.json({ error: "Padrão não encontrado" }, { status: 404 });

        const created = await prisma.tracking.create({
          data: {
            name: template.name,
            description: template.description,
            organizationId: org.id,
            participants: { create: { userId: user.id, role: "OWNER" } },
            status: {
              createMany: {
                data: template.status.map((s) => ({ name: s.name, color: s.color ?? "#1447e6", order: s.order })),
              },
            },
            ...(template.winLossReasons.length > 0 && {
              winLossReasons: { createMany: { data: template.winLossReasons.map((r) => ({ name: r.name, type: r.type })) } },
            }),
            ...(template.aiSettings && {
              aiSettings: { create: { assistantName: template.aiSettings.assistantName, prompt: template.aiSettings.prompt, finishSentence: template.aiSettings.finishSentence } },
            }),
          },
        });
        return NextResponse.json({ id: created.id, name: created.name });
      }

      case "workspace": {
        const template = await prisma.workspace.findUnique({
          where: { id: appId },
          include: { columns: { select: { name: true, color: true, order: true } } },
        });
        if (!template) return NextResponse.json({ error: "Padrão não encontrado" }, { status: 404 });

        const members = await prisma.member.findMany({ where: { organizationId: org.id } });

        const created = await prisma.workspace.create({
          data: {
            name: template.name,
            description: template.description,
            color: template.color,
            icon: template.icon,
            organizationId: org.id,
            createdBy: user.id,
            members: {
              createMany: {
                data: members.map((m) => ({ userId: m.userId, role: m.userId === user.id ? "OWNER" : "MEMBER" })),
              },
            },
            columns: {
              createMany: {
                data: template.columns.length > 0
                  ? template.columns.map((c) => ({ name: c.name, color: c.color ?? "#1447e6", order: c.order }))
                  : [{ name: "Para fazer", order: 0 }, { name: "Em progresso", order: 1 }, { name: "Concluído", order: 2 }],
              },
            },
          },
        });
        return NextResponse.json({ id: created.id, name: created.name });
      }

      default:
        return NextResponse.json({ error: "Tipo não suportado" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro ao duplicar padrão:", error);
    return NextResponse.json({ error: "Erro ao duplicar padrão" }, { status: 500 });
  }
}
