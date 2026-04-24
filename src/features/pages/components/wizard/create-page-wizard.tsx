"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/lib/orpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Layers, Layers2, Sparkles, Palette } from "lucide-react";
import type { PageIntent } from "../../types";
import {
  DEFAULT_PALETTES,
  INTENT_DESCRIPTIONS,
  INTENT_LABELS,
  STARS_COST,
} from "../../constants";
import { usePagesCost } from "../../hooks/use-pages";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

type Step = "intent" | "layers" | "palette" | "details" | "confirm";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const STEPS: Step[] = ["intent", "layers", "palette", "details", "confirm"];

const PALETTE_KEYS: { key: string; label: string }[] = [
  { key: "primary", label: "Primária" },
  { key: "accent",  label: "Destaque" },
  { key: "bg",      label: "Fundo" },
  { key: "fg",      label: "Texto" },
  { key: "muted",   label: "Secundário" },
];

function PaletteStep({
  palette,
  onChange,
}: {
  palette: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
}) {
  const isCustom = !DEFAULT_PALETTES.some(
    (p) => JSON.stringify(p) === JSON.stringify(palette),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DEFAULT_PALETTES.map((p, idx) => {
          const active = JSON.stringify(p) === JSON.stringify(palette);
          return (
            <Card
              key={idx}
              className={cn(
                "cursor-pointer transition-all hover:border-indigo-500",
                active && "border-indigo-500 ring-1 ring-indigo-500",
              )}
              onClick={() => onChange(p)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  {Object.values(p).map((c, i) => (
                    <span
                      key={i}
                      className="size-6 rounded-full border"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Palette className="size-4" />
                  Paleta {idx + 1}
                </div>
                {active && <Check className="size-4 ml-auto text-indigo-500" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Palette className="size-4 text-indigo-500" />
            Paleta personalizada
          </p>
          {isCustom && (
            <span className="text-xs text-indigo-500 font-medium">Ativa</span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PALETTE_KEYS.map(({ key, label }) => (
            <label key={key} className="flex flex-col gap-1 cursor-pointer">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={palette[key] ?? "#000000"}
                  onChange={(e) =>
                    onChange({ ...palette, [key]: e.target.value })
                  }
                  className="size-8 rounded border cursor-pointer p-0.5 bg-transparent"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {palette[key] ?? "#000000"}
                </span>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {PALETTE_KEYS.map(({ key }) => (
            <span
              key={key}
              className="h-5 flex-1 rounded"
              style={{ background: palette[key] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreatePageWizard({ open, onOpenChange }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: cost } = usePagesCost();

  const [step, setStep] = useState<Step>("intent");
  const [intent, setIntent] = useState<PageIntent>("LANDING");
  const [layerCount, setLayerCount] = useState<1 | 2>(1);
  const [palette, setPalette] = useState<Record<string, string>>(DEFAULT_PALETTES[0]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("intent");
      setIntent("LANDING");
      setLayerCount(1);
      setPalette(DEFAULT_PALETTES[0]);
      setTitle("");
      setSlug("");
      setDescription("");
    }
  }, [open]);

  useEffect(() => {
    if (title && !slug) setSlug(slugify(title));
  }, [title, slug]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      client.pages.createPage({
        title,
        slug: slug || slugify(title),
        description: description || undefined,
        intent,
        layerCount,
        palette,
      }),
    onSuccess: (res) => {
      toast.success("Site criado — 2.000 Stars debitadas");
      qc.invalidateQueries({ queryKey: orpc.pages.listPages.queryKey() });
      qc.invalidateQueries({ queryKey: orpc.pages.getCost.queryKey() });
      qc.invalidateQueries({ queryKey: orpc.stars.getBalance.queryKey() });
      onOpenChange(false);
      router.push(`/pages/${res.page.id}`);
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar"),
  });

  const stepIndex = STEPS.indexOf(step);
  const canAfford = cost ? cost.canAfford : true;

  const canAdvance = useMemo(() => {
    if (step === "intent") return !!intent;
    if (step === "layers") return !!layerCount;
    if (step === "palette") return !!palette;
    if (step === "details") return title.trim().length > 0 && slug.trim().length >= 2;
    return true;
  }, [step, intent, layerCount, palette, title, slug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-500" />
            Novo site NASA Pages
          </DialogTitle>
          <DialogDescription>
            Etapa {stepIndex + 1} de {STEPS.length} — {STEPS[stepIndex]}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 min-h-[320px]">
          {step === "intent" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(INTENT_LABELS) as PageIntent[]).map((i) => (
                <Card
                  key={i}
                  className={cn(
                    "cursor-pointer transition-all hover:border-indigo-500",
                    intent === i && "border-indigo-500 ring-1 ring-indigo-500",
                  )}
                  onClick={() => setIntent(i)}
                >
                  <CardContent className="p-4">
                    <p className="font-medium">{INTENT_LABELS[i]}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {INTENT_DESCRIPTIONS[i]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === "layers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:border-indigo-500",
                  layerCount === 1 && "border-indigo-500 ring-1 ring-indigo-500",
                )}
                onClick={() => setLayerCount(1)}
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  <Layers className="size-8 text-indigo-500" />
                  <p className="font-semibold">1 camada (estático)</p>
                  <p className="text-xs text-muted-foreground">
                    Rolagem normal. Ideal para sites institucionais com conteúdo
                    sequencial.
                  </p>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:border-indigo-500",
                  layerCount === 2 && "border-indigo-500 ring-1 ring-indigo-500",
                )}
                onClick={() => setLayerCount(2)}
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  <Layers2 className="size-8 text-indigo-500" />
                  <p className="font-semibold">2 camadas (parallax)</p>
                  <p className="text-xs text-muted-foreground">
                    Uma camada ao fundo e outra na frente com efeito de slide ao
                    scroll do mouse.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "palette" && (
            <PaletteStep palette={palette} onChange={setPalette} />
          )}

          {step === "details" && (
            <div className="flex flex-col gap-3">
              <div>
                <Label>Nome do site</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Lançamento primavera"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/s/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="meu-site"
                  />
                </div>
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="flex flex-col gap-3">
              <Card>
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Intenção</span>
                    <span className="font-medium">{INTENT_LABELS[intent]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Camadas</span>
                    <span className="font-medium">
                      {layerCount === 2 ? "2 camadas (parallax)" : "1 camada"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Slug</span>
                    <span className="font-mono text-xs">/{slug}</span>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={cn(
                  canAfford ? "border-indigo-500" : "border-destructive",
                )}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Custo: {STARS_COST.toLocaleString("pt-BR")} ★
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo atual:{" "}
                      {(cost?.balance ?? 0).toLocaleString("pt-BR")} ★ · Após:{" "}
                      {((cost?.balance ?? 0) - STARS_COST).toLocaleString("pt-BR")} ★
                    </p>
                  </div>
                  {!canAfford && (
                    <Button asChild variant="outline" size="sm">
                      <a href="/stars">Comprar Stars</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {stepIndex > 0 && (
            <Button
              variant="ghost"
              onClick={() => setStep(STEPS[stepIndex - 1])}
              disabled={isPending}
            >
              Voltar
            </Button>
          )}
          {step !== "confirm" ? (
            <Button
              onClick={() => setStep(STEPS[stepIndex + 1])}
              disabled={!canAdvance}
            >
              Avançar
            </Button>
          ) : (
            <Button
              onClick={() => mutate()}
              disabled={!canAfford || isPending}
              className="gap-1"
            >
              <Sparkles className="size-4" />
              Criar ({STARS_COST.toLocaleString("pt-BR")} ★)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
