"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Pencil, ExternalLink, Sparkles, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { usePages, usePagesCost } from "../../hooks/use-pages";
import { CreatePageWizard } from "../wizard/create-page-wizard";
import { INTENT_LABELS } from "../../constants";

export function PagesList() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data, isLoading } = usePages();
  const { data: cost } = usePagesCost();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-6 text-indigo-500" />
            NASA Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Construa sites e landing pages integradas ao ecossistema NASA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cost ? (
            <Badge variant="outline" className="text-xs gap-1 py-1">
              <span className="text-yellow-500">★</span>
              {cost.stars.toLocaleString("pt-BR")} / site
            </Badge>
          ) : null}
          <Button asChild variant="outline" className="gap-2">
            <Link href="/pages/templates">
              <LayoutTemplate className="size-4" />
              Templates
            </Link>
          </Button>
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Novo site
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : !data?.pages?.length ? (
        <Card>
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum site ainda</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Crie seu primeiro site NASA Pages por {cost?.stars ?? 2000} Stars. Você pode ter
              quantos sites quiser por organização.
            </p>
            <Button onClick={() => setWizardOpen(true)} className="mt-2 gap-2">
              <Plus className="size-4" />
              Começar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.pages.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">/{p.slug}</p>
                  </div>
                  <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>
                    {p.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.description ?? INTENT_LABELS[p.intent]}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {p.layerCount === 2 ? "2 camadas (parallax)" : "1 camada"}
                  </span>
                  {p.customDomain ? (
                    <span className="flex items-center gap-1">
                      <Globe className="size-3" />
                      {p.customDomain}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2 mt-auto pt-3 border-t">
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link href={`/pages/${p.id}`}>
                      <Pencil className="size-3.5" />
                      Editar
                    </Link>
                  </Button>
                  {p.status === "PUBLISHED" && (
                    <Button asChild size="sm" variant="ghost" className="gap-1">
                      <a href={`/s/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" />
                        Ver
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreatePageWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
