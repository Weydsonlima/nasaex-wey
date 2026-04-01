"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { useMutation } from "@tanstack/react-query";
import { Bell, Send, Users, Building2, User } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  targetType: string;
  targetId: string | null;
  createdBy: string;
  createdAt: string;
  readCount: number;
}

interface Org { id: string; name: string }

const TYPE_COLORS: Record<string, string> = {
  info:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  error:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const TARGET_ICON: Record<string, React.ElementType> = {
  all:  Users,
  org:  Building2,
  user: User,
};

export function NotificationCenter({
  notifications,
  orgs,
}: {
  notifications: Notification[];
  orgs: Org[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "info" as "info" | "warning" | "success" | "error",
    targetType: "all" as "all" | "org" | "user",
    targetId: "",
  });
  const [sent, setSent] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      orpc.admin.sendNotification.call({
        title:      form.title,
        body:       form.body,
        type:       form.type,
        targetType: form.targetType,
        targetId:   form.targetId || null,
      }),
    onSuccess: () => {
      setSent(true);
      setForm({ title: "", body: "", type: "info", targetType: "all", targetId: "" });
      setTimeout(() => {
        setSent(false);
        setShowForm(false);
        router.refresh();
      }, 1500);
    },
  });

  return (
    <div className="space-y-5">
      {/* Send button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nova Notificação"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Enviar notificação</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Título *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={100}
                placeholder="Título da notificação"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Mensagem *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                maxLength={2000}
                rows={3}
                placeholder="Conteúdo da notificação..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="info">Info</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Destinatário</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value as typeof form.targetType, targetId: "" }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="all">Todos os usuários</option>
                <option value="org">Empresa específica</option>
                <option value="user">Usuário específico (ID)</option>
              </select>
            </div>
            {form.targetType === "org" && (
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1.5">Empresa</label>
                <select
                  value={form.targetId}
                  onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Selecione...</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.targetType === "user" && (
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1.5">ID do usuário</label>
                <input
                  value={form.targetId}
                  onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                  placeholder="ID do usuário"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.title || !form.body}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            {sent ? "Enviada! ✓" : mut.isPending ? "Enviando..." : "Enviar"}
          </button>
          {mut.isError && <p className="text-xs text-red-400">Erro ao enviar.</p>}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            <Bell className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
            Nenhuma notificação enviada ainda.
          </div>
        )}
        {notifications.map((n) => {
          const TargetIcon = TARGET_ICON[n.targetType] ?? Users;
          return (
            <div key={n.id} className={`border rounded-xl p-4 ${TYPE_COLORS[n.type] ?? TYPE_COLORS.info}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{n.type}</span>
                    <span className="text-zinc-600">·</span>
                    <TargetIcon className="w-3 h-3 text-zinc-500" />
                    <span className="text-xs text-zinc-500">
                      {n.targetType === "all" ? "Todos"
                        : n.targetType === "org" ? "Empresa"
                        : "Usuário"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-zinc-300 mt-1 line-clamp-2">{n.body}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-500">{new Date(n.createdAt).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-zinc-600 mt-1">{n.readCount} leitura(s)</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
