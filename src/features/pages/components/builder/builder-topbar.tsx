"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Undo2,
  Redo2,
  Save,
  Rocket,
  ArrowLeft,
  ExternalLink,
  Eye,
  Layers,
  Globe,
} from "lucide-react";
import { usePagesBuilderStore } from "../../context/pages-builder-store";
import { useState } from "react";
import { PublishDialog } from "../publish-dialog/publish-dialog";

interface Props {
  page: {
    id: string;
    slug: string;
    title: string;
    status: string;
    layerCount: number;
    customDomain: string | null;
  };
  onPublish: () => void;
  publishing: boolean;
}

export function BuilderTopbar({ page, onPublish, publishing }: Props) {
  const undo = usePagesBuilderStore((s) => s.undo);
  const redo = usePagesBuilderStore((s) => s.redo);
  const canUndo = usePagesBuilderStore((s) => s.canUndo());
  const canRedo = usePagesBuilderStore((s) => s.canRedo());
  const activeLayer = usePagesBuilderStore((s) => s.activeLayer);
  const setActiveLayer = usePagesBuilderStore((s) => s.setActiveLayer);
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b bg-card px-3 flex items-center gap-2 shrink-0">
        <Button asChild size="sm" variant="ghost" className="gap-1">
          <Link href="/pages">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <div className="min-w-0 flex flex-col">
          <span className="text-sm font-semibold truncate max-w-[220px]">
            {page.title}
          </span>
          <span className="text-[10px] text-muted-foreground">/{page.slug}</span>
        </div>
        <div className="h-5 w-px bg-border mx-1" />
        <Button size="icon" variant="ghost" disabled={!canUndo} onClick={undo} title="Desfazer (⌘Z)">
          <Undo2 className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={!canRedo} onClick={redo} title="Refazer (⌘⇧Z)">
          <Redo2 className="size-4" />
        </Button>

        {page.layerCount === 2 && (
          <>
            <div className="h-5 w-px bg-border mx-1" />
            <div className="flex items-center rounded-md border p-0.5">
              <Button
                size="sm"
                variant={activeLayer === "back" ? "default" : "ghost"}
                className="h-7 gap-1 text-xs"
                onClick={() => setActiveLayer("back")}
              >
                <Layers className="size-3" />
                Atrás
              </Button>
              <Button
                size="sm"
                variant={activeLayer === "front" ? "default" : "ghost"}
                className="h-7 gap-1 text-xs"
                onClick={() => setActiveLayer("front")}
              >
                <Layers className="size-3" />
                Frente
              </Button>
            </div>
          </>
        )}

        <div className="flex-1" />

        <Badge variant={page.status === "PUBLISHED" ? "default" : "secondary"}>
          <Save className="size-3 mr-1" />
          {page.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
        </Badge>

        <Button asChild size="sm" variant="outline" className="gap-1">
          <a href={`/pages/${page.id}/preview`} target="_blank" rel="noreferrer">
            <Eye className="size-3.5" />
            Prévia
          </a>
        </Button>

        {page.status === "PUBLISHED" && (
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href={`/s/${page.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Ver
            </a>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => setPublishOpen(true)}
        >
          <Globe className="size-3.5" />
          Domínio
        </Button>

        <Button
          size="sm"
          className="gap-1"
          onClick={onPublish}
          disabled={publishing}
        >
          <Rocket className="size-3.5" />
          {publishing
            ? "Publicando…"
            : page.status === "PUBLISHED"
              ? "Atualizar"
              : "Publicar"}
        </Button>
      </header>
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} pageId={page.id} />
    </>
  );
}
