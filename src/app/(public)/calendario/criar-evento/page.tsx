import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Página de redirecionamento: pega o workspace do usuário logado
// e manda para a tela de workspace com ?create=event-public,
// que abre o CreateActionModal com presetPublic=true.
export const dynamic = "force-dynamic";

export default async function CriarEventoRedirect() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/calendario/criar-evento");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { members: { some: { userId: session.user.id } } },
        { createdBy: session.user.id },
      ],
      isArchived: false,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!workspace) {
    // Sem workspace: manda para o wizard de criação de workspace
    redirect("/workspaces?create=event-public");
  }

  redirect(`/workspaces/${workspace.id}?create=event-public`);
}
