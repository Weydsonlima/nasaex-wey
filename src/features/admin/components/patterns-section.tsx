"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type AppType = "tracking" | "workspace";

interface Template {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface PatternsSectionProps {
  appType: AppType;
  redirectPath?: (id: string) => string;
}

export function PatternsSection({ appType, redirectPath }: PatternsSectionProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/app-templates?appType=${appType}`)
      .then((r) => r.json())
      .then((data) => setTemplates(data[appType] ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [appType]);

  if (isLoading || templates.length === 0) return null;

  const handleUse = async (templateId: string, templateName: string) => {
    setDuplicating(templateId);
    try {
      const res = await fetch(`/api/admin/app-template/${appType}/${templateId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao usar padrão");
      }
      const created = await res.json();
      toast.success(`"${templateName}" adicionado com sucesso!`);
      if (redirectPath) router.push(redirectPath(created.id));
      else router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao usar padrão");
    } finally {
      setDuplicating(null);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Padrões NASA disponíveis
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {t.color && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.name || t.title || "Sem nome"}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleUse(t.id, t.name || t.title || "Padrão")}
              disabled={duplicating === t.id}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500 disabled:opacity-50"
            >
              {duplicating === t.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Usar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
