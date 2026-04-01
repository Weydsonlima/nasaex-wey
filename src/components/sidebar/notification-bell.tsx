"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const TYPE_ICON: Record<string, string> = {
  NEW_LEAD:             "🎯",
  AI_TOKEN_ALERT:       "🤖",
  STARS_ALERT:          "⭐",
  CARD_EDIT:            "📝",
  APPOINTMENT_REMINDER: "📅",
  INSIGHTS_MOVEMENT:    "📊",
  PLAN_EXPIRY:          "⚠️",
  ADMIN_MESSAGE:        "📢",
  CUSTOM:               "🔔",
};

const TYPE_COLOR: Record<string, string> = {
  AI_TOKEN_ALERT:  "text-purple-400",
  STARS_ALERT:     "text-yellow-400",
  PLAN_EXPIRY:     "text-red-400",
  ADMIN_MESSAGE:   "text-violet-400",
  NEW_LEAD:        "text-emerald-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "agora";
  if (mins  < 60)  return `${mins}m`;
  if (hours < 24)  return `${hours}h`;
  return `${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { isMobile } = useSidebar();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-notifications"],
    queryFn: () => orpc.userNotifications.list.call({ limit: 20 }),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => orpc.userNotifications.markRead.call({ notificationId: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => orpc.userNotifications.markAllRead.call({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  const unread = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  const handleNotifClick = useCallback((n: typeof notifications[0]) => {
    if (!n.isRead) markReadMut.mutate(n.id);
    if (n.actionUrl) {
      setOpen(false);
      router.push(n.actionUrl);
    }
  }, [markReadMut, router]);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="default"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "relative",
              open && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            tooltip="Notificações"
          >
            {/* Bell icon with badge */}
            <span className="relative shrink-0">
              <Bell
                className={cn(
                  "size-4",
                  unread > 0 && "[animation:wiggle_1.5s_ease-in-out_infinite]",
                )}
              />
              {unread > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none pointer-events-none">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>

            <span>Notificações</span>

            {isLoading && (
              <Loader2 className="ml-auto size-3 animate-spin opacity-40 shrink-0" />
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "fixed z-50 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden",
              "bottom-24 left-2",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unread}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={() => markAllMut.mutate()}
                    disabled={markAllMut.isPending}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Ler todas
                  </button>
                )}
                <button
                  onClick={() => { setOpen(false); router.push("/settings/notifications"); }}
                  className="text-sm text-zinc-500 hover:text-violet-400 transition-colors"
                  title="Configurar notificações"
                >
                  ⚙
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                  <p className="text-xs text-zinc-500">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors hover:bg-zinc-800",
                      !n.isRead && "bg-zinc-800/40",
                    )}
                  >
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-xs font-semibold leading-tight",
                          TYPE_COLOR[n.type] ?? "text-white",
                          n.isRead && "text-zinc-300",
                        )}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-zinc-600 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {!n.isRead && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />}
                        {n.actionUrl && (
                          <span className="text-[10px] text-violet-400 flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> Ver →
                          </span>
                        )}
                        {n.isRead && <Check className="w-3 h-3 text-zinc-700" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-zinc-800 text-center">
              <button
                onClick={() => { setOpen(false); router.push("/settings/notifications"); }}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Configurar notificações →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
