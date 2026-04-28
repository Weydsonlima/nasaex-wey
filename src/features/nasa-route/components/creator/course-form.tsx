"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Uploader } from "@/components/file-uploader/uploader";

interface Props {
  courseId?: string;
  initial?: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    coverUrl: string | null;
    trailerUrl: string | null;
    level: string;
    format: string;
    durationMin: number | null;
    priceStars: number;
    categoryId: string | null;
    rewardSpOnComplete: number;
  };
  onSaved?: (courseId: string) => void;
}

export function CourseForm({ courseId, initial, onSaved }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!courseId;

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [trailerUrl, setTrailerUrl] = useState(initial?.trailerUrl ?? "");
  const [level, setLevel] = useState(initial?.level ?? "beginner");
  const [format, setFormat] = useState(initial?.format ?? "course");
  const [durationMin, setDurationMin] = useState(
    initial?.durationMin?.toString() ?? "",
  );
  const [priceStars, setPriceStars] = useState(initial?.priceStars?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [rewardSpOnComplete, setRewardSpOnComplete] = useState(
    initial?.rewardSpOnComplete?.toString() ?? "0",
  );

  const { data: searchData } = useQuery({
    ...orpc.nasaRoute.publicSearch.queryOptions({ input: { limit: 1 } }),
  });
  const categories = searchData?.categories ?? [];

  const upsert = useMutation({
    ...orpc.nasaRoute.creatorUpsertCourse.mutationOptions(),
    onSuccess: (res) => {
      const newId = res?.course?.id;
      toast.success(isEdit ? "Curso atualizado!" : "Curso criado!");
      queryClient.invalidateQueries({
        queryKey: orpc.nasaRoute.creatorListCourses.queryKey(),
      });
      if (onSaved && newId) {
        onSaved(newId);
        return;
      }
      if (!isEdit) {
        if (!newId) {
          toast.error("Curso criado, mas não foi possível abrir o editor automaticamente.");
          router.push("/nasa-route/criador");
          return;
        }
        const target = `/nasa-route/criador/curso/${newId}/editar`;
        router.replace(target);
        // Fallback caso o router não navegue (Next 16 + state batching)
        setTimeout(() => {
          if (typeof window !== "undefined" && !window.location.pathname.includes(newId)) {
            window.location.href = target;
          }
        }, 250);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Não foi possível salvar.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !title.trim()) {
      toast.error("Slug e título são obrigatórios.");
      return;
    }
    upsert.mutate({
      id: courseId,
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      coverUrl: coverUrl.trim() || null,
      trailerUrl: trailerUrl.trim() || null,
      level: level as "beginner" | "intermediate" | "advanced",
      format: format as "course" | "training" | "mentoring",
      durationMin: durationMin ? Number(durationMin) : null,
      priceStars: Number(priceStars) || 0,
      categoryId: categoryId || null,
      rewardSpOnComplete: Number(rewardSpOnComplete) || 0,
    });
  }

  function autoSlug() {
    if (slug || !title) return;
    setSlug(
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 60),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Capa do curso</Label>
        <p className="text-xs text-muted-foreground">
          Recomendado: 1280×720 (16:9). PNG/JPG até 5MB.
        </p>
        <Uploader
          value={coverUrl}
          onUpload={(url) => setCoverUrl(url)}
          fileTypeAccepted="image"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={autoSlug}
            placeholder="Ex.: Vendas com STARs"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="vendas-com-stars"
            required
          />
          <p className="text-xs text-muted-foreground">
            Apenas letras minúsculas, números e hífens.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtítulo</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Uma frase curta que descreve o curso"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição completa</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o que o aluno vai aprender, para quem é o curso, pré-requisitos…"
          rows={6}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="format">Formato</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course">Curso</SelectItem>
              <SelectItem value="training">Treinamento</SelectItem>
              <SelectItem value="mentoring">Mentoria</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Nível</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Iniciante</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priceStars">Preço (STARs)</Label>
          <Input
            id="priceStars"
            type="number"
            min={0}
            value={priceStars}
            onChange={(e) => setPriceStars(e.target.value)}
            placeholder="0 = gratuito"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Duração total (min)</Label>
          <Input
            id="durationMin"
            type="number"
            min={0}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reward">Bônus SP ao concluir</Label>
          <Input
            id="reward"
            type="number"
            min={0}
            value={rewardSpOnComplete}
            onChange={(e) => setRewardSpOnComplete(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trailer">URL do trailer (YouTube ou Vimeo)</Label>
        <Input
          id="trailer"
          value={trailerUrl}
          onChange={(e) => setTrailerUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=… ou https://vimeo.com/…"
        />
        <p className="text-xs text-muted-foreground">
          Aparece no preview público. Opcional.
        </p>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-800/40 dark:bg-violet-900/20">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 text-violet-600" />
          <p className="text-violet-900 dark:text-violet-200">
            Você recebe <strong>90% do valor pago</strong> — a plataforma retém 10% como
            taxa. Ex.: curso de 500★ → você recebe 450★.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={upsert.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={upsert.isPending} className="gap-1.5">
          {upsert.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEdit ? "Salvar alterações" : "Criar curso"}
        </Button>
      </div>
    </form>
  );
}
