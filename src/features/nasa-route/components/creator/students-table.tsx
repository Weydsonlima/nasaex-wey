"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { CheckCircle2, ChevronLeft, Sparkles, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function StudentsTable() {
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const { data: coursesData } = useQuery({
    ...orpc.nasaRoute.creatorListCourses.queryOptions(),
  });

  const { data, isLoading } = useQuery({
    ...orpc.nasaRoute.creatorListStudents.queryOptions({
      input: courseFilter === "all" ? {} : { courseId: courseFilter },
    }),
  });

  const enrollments = data?.enrollments ?? [];
  const completed = enrollments.filter((e) => e.completedAt).length;
  const totalEarnings = enrollments.reduce((acc, e) => acc + Math.floor(e.paidStars * 0.9), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/nasa-route/criador"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Voltar para o painel
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Veja quem está matriculado nos seus cursos.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Matrículas"
          value={enrollments.length}
          icon={<Users className="size-5 text-violet-600" />}
        />
        <Stat
          label="Concluídos"
          value={completed}
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />
        <Stat
          label="Recebido (90%)"
          value={`${totalEarnings.toLocaleString("pt-BR")} ★`}
          icon={<Sparkles className="size-5 text-amber-600" />}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {coursesData?.courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Aluno</th>
              <th className="px-4 py-3 text-left font-semibold">Curso</th>
              <th className="px-4 py-3 text-left font-semibold">Origem</th>
              <th className="px-4 py-3 text-right font-semibold">Pago</th>
              <th className="px-4 py-3 text-left font-semibold">Matrícula</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {e.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={e.user.image}
                            alt={e.user.name ?? ""}
                            className="size-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-7 rounded-full bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{e.user.name ?? "Sem nome"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {e.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {e.course.title}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {e.source === "free_access" ? (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                          Acesso livre
                        </Badge>
                      ) : e.source === "gift" ? (
                        <Badge variant="outline">Presente</Badge>
                      ) : (
                        <Badge variant="secondary">Compra</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {e.paidStars > 0 ? (
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          {e.paidStars.toLocaleString("pt-BR")} ★
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(e.enrolledAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      {e.completedAt ? (
                        <Badge className="bg-amber-500 hover:bg-amber-500">
                          <CheckCircle2 className="mr-1 size-3" />
                          Concluído
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Em andamento</Badge>
                      )}
                    </td>
                  </tr>
                ))}
            {!isLoading && enrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma matrícula ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}
