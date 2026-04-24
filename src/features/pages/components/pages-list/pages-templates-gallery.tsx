"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/lib/orpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Layers, Layers2, Sparkles } from "lucide-react";
import Link from "next/link";
import { INTENT_LABELS } from "../../constants";
import type { PageIntent } from "../../types";

export function PageTemplatesGallery() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    ...orpc.pages.listTemplates.queryOptions({ input: {} }),
    staleTime: 30_000,
  });

  const { mutate: use, isPending } = useMutation({
    mutationFn: (t: { id: string; title: string; slug: string }) => {
      const suffix = Math.random().toString(36).slice(2, 7);
      return client.pages.duplicatePage({
        id: t.id,
        newSlug: `${t.slug}-${suffix}`,
        newTitle: `${t.title} (cópia)`,
      });
    },
    onSuccess: (res) => {
      toast.success("Site criado a partir do template");
      qc.invalidateQueries({ queryKey: orpc.pages.listPages.queryKey() });
      router.push(`/pages/${res.page.id}`);
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao usar template"),
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/pages">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-6 text-indigo-500" />
            Templates NASA Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comece com um site pronto e personalize como quiser.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando templates…</div>
      ) : !data?.templates?.length ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum template disponível ainda</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Templates são criados pela equipe NASA e aparecem aqui quando aprovados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.templates.map((t) => (
            <Card key={t.id} className="flex flex-col group hover:border-indigo-400 transition-colors">
              {t.ogImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.ogImageUrl}
                  alt={t.title}
                  className="w-full h-40 object-cover rounded-t-xl"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-t-xl flex items-center justify-center">
                  <Sparkles className="size-10 text-indigo-300" />
                </div>
              )}
              <CardContent className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{t.title}</h3>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {INTENT_LABELS[t.intent as PageIntent]}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.layerCount === 2 ? (
                    <><Layers2 className="size-3.5" /> 2 camadas (parallax)</>
                  ) : (
                    <><Layers className="size-3.5" /> 1 camada</>
                  )}
                  {t.templateCategory && (
                    <Badge variant="outline" className="text-[10px] ml-auto">{t.templateCategory}</Badge>
                  )}
                </div>
                <Button
                  className="mt-auto gap-1.5"
                  onClick={() => use({ id: t.id, title: t.title, slug: t.slug })}
                  disabled={isPending}
                >
                  <Copy className="size-3.5" />
                  Usar template (2.000 ★)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
