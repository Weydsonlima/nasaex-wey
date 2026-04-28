"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Settings2,
  GripVertical,
  Lock,
  Play,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CourseForm } from "./course-form";
import { LessonForm } from "./lesson-form";
import { ModuleForm } from "./module-form";
import { PlansManager } from "./plans-manager";
import { useRouter } from "next/navigation";

interface Props {
  courseId: string;
}

export function CourseEditor({ courseId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"info" | "lessons" | "plans">("lessons");
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isLoading } = useQuery({
    ...orpc.nasaRoute.creatorGetCourse.queryOptions({ input: { courseId } }),
  });

  const publish = useMutation({
    ...orpc.nasaRoute.creatorPublishCourse.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: orpc.nasaRoute.creatorGetCourse.queryKey({ input: { courseId } }),
      });
      qc.invalidateQueries({
        queryKey: orpc.nasaRoute.creatorListCourses.queryKey(),
      });
    },
    onError: (err: any) => toast.error(err?.message ?? "Falha ao publicar."),
  });

  const remove = useMutation({
    ...orpc.nasaRoute.creatorDeleteCourse.mutationOptions(),
    onSuccess: () => {
      toast.success("Curso excluído");
      qc.invalidateQueries({
        queryKey: orpc.nasaRoute.creatorListCourses.queryKey(),
      });
      router.push("/nasa-route/criador");
    },
    onError: (err: any) => toast.error(err?.message ?? "Falha ao excluir."),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Curso não encontrado</h1>
      </div>
    );
  }

  const { course } = data;
  const grouped = groupLessons(course.modules, course.lessons);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/nasa-route/criador"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar para o painel
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={course.isPublished ? "default" : "secondary"}>
              {course.isPublished ? (
                <>
                  <Eye className="mr-1 size-3" />
                  Publicado
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 size-3" />
                  Rascunho
                </>
              )}
            </Badge>
            {course.creatorOrg && (
              <span className="text-xs text-muted-foreground">
                Por {course.creatorOrg.name}
              </span>
            )}
          </div>
          <h1 className="mt-2 truncate text-3xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {course.lessons.length} aulas · {course.modules.length} módulos ·{" "}
            {course.enrollmentCount} alunos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {course.isPublished && course.creatorOrg && (
            <Button asChild variant="outline" className="gap-1.5">
              <Link
                href={`/c/${course.creatorOrg.slug}/${course.slug}`}
                target="_blank"
              >
                <Eye className="size-4" />
                Ver pública
              </Link>
            </Button>
          )}
          <Button
            variant={course.isPublished ? "outline" : "default"}
            disabled={publish.isPending}
            onClick={() =>
              publish.mutate({ courseId, isPublished: !course.isPublished })
            }
            className="gap-1.5"
          >
            {course.isPublished ? (
              <>
                <EyeOff className="size-4" />
                Despublicar
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Publicar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4 text-rose-600" />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex border-b border-border">
        <button
          type="button"
          onClick={() => setTab("lessons")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "lessons"
              ? "border-violet-600 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Aulas e módulos
        </button>
        <button
          type="button"
          onClick={() => setTab("plans")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "plans"
              ? "border-violet-600 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Planos e entregas
        </button>
        <button
          type="button"
          onClick={() => setTab("info")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === "info"
              ? "border-violet-600 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Informações do curso
        </button>
      </div>

      <div className="mt-6">
        {tab === "info" ? (
          <CourseForm
            courseId={course.id}
            initial={{
              id: course.id,
              slug: course.slug,
              title: course.title,
              subtitle: course.subtitle,
              description: course.description,
              coverUrl: course.coverUrl,
              trailerUrl: course.trailerUrl,
              level: course.level,
              format: course.format,
              durationMin: course.durationMin,
              priceStars: course.priceStars,
              categoryId: course.categoryId,
              rewardSpOnComplete: course.rewardSpOnComplete,
            }}
          />
        ) : tab === "plans" ? (
          <PlansManager
            courseId={course.id}
            lessons={course.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              moduleId: l.moduleId,
              order: l.order,
            }))}
            modules={course.modules.map((m) => ({ id: m.id, title: m.title }))}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setEditingLesson(null);
                  setShowLessonForm(true);
                }}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Nova aula
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingModule(null);
                  setShowModuleForm(true);
                }}
                className="gap-1.5"
              >
                <Folder className="size-4" />
                Novo módulo
              </Button>
            </div>

            {grouped.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <p className="text-sm font-medium">
                  Adicione sua primeira aula para começar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você pode agrupar aulas em módulos opcionais.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map((group) => (
                  <div
                    key={group.id ?? "no-module"}
                    className="rounded-2xl border border-border bg-card"
                  >
                    {group.title && (
                      <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Módulo
                          </p>
                          <p className="truncate text-sm font-semibold">
                            {group.title}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingModule({
                              id: group.id,
                              title: group.title,
                              summary: group.summary,
                            });
                            setShowModuleForm(true);
                          }}
                        >
                          <Settings2 className="size-4" />
                        </Button>
                      </div>
                    )}
                    {!group.title && (
                      <div className="border-b border-border px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Aulas avulsas
                        </p>
                      </div>
                    )}
                    <ul className="divide-y divide-border">
                      {group.lessons.map((l, i) => (
                        <li
                          key={l.id}
                          className="flex items-center gap-3 px-5 py-3"
                        >
                          <GripVertical className="size-4 text-muted-foreground/40" />
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {l.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {l.isFreePreview ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                  <Play className="size-2.5" />
                                  Preview
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5">
                                  <Lock className="size-2.5" />
                                  Bloqueada
                                </span>
                              )}
                              {l.video.provider && (
                                <span className="capitalize">
                                  · {l.video.provider}
                                </span>
                              )}
                              {l.durationMin && <span>· {l.durationMin}min</span>}
                              <span>· {l.awardSp} SP</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingLesson(l);
                              setShowLessonForm(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showLessonForm && (
        <LessonForm
          open={showLessonForm}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
          courseId={courseId}
          modules={course.modules.map((m) => ({ id: m.id, title: m.title }))}
          initial={editingLesson ?? undefined}
        />
      )}

      {showModuleForm && (
        <ModuleForm
          open={showModuleForm}
          onClose={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
          courseId={courseId}
          initial={editingModule ?? undefined}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todas as aulas, módulos, matrículas e
              progresso serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate({ courseId })}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function groupLessons(
  modules: Array<{ id: string; title: string; summary: string | null; order: number }>,
  lessons: Array<any>,
) {
  const byModule = new Map<string | null, any[]>();
  for (const l of lessons) {
    const arr = byModule.get(l.moduleId) ?? [];
    arr.push(l);
    byModule.set(l.moduleId, arr);
  }
  for (const arr of byModule.values()) {
    arr.sort((a, b) => a.order - b.order);
  }

  const groups: Array<{
    id: string | null;
    title: string | null;
    summary: string | null;
    lessons: any[];
  }> = [];

  const noModule = byModule.get(null) ?? [];
  if (noModule.length > 0) {
    groups.push({ id: null, title: null, summary: null, lessons: noModule });
  }

  for (const m of [...modules].sort((a, b) => a.order - b.order)) {
    const ms = byModule.get(m.id) ?? [];
    if (ms.length > 0) {
      groups.push({ id: m.id, title: m.title, summary: m.summary, lessons: ms });
    }
  }

  return groups;
}
