"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Plus,
  MoreHorizontal,
  ShieldOff,
  RefreshCw,
  ChevronDown,
  Crown,
} from "lucide-react";
import {
  usePaymentAccessList,
  useGrantPaymentAccess,
  useRevokePaymentAccess,
  useUpdatePaymentRole,
  useUpdatePaymentPermissions,
} from "../../hooks/use-payment";
import { toast } from "sonner";
import {
  PAYMENT_RESOURCES,
  PAYMENT_ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_DEFAULTS,
  resolveEffectivePermissions,
  type PaymentResource,
  type PaymentAction,
  type PaymentPermissionMatrix,
} from "../../lib/permissions";

type Role = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";
const ROLES: Role[] = ["VIEWER", "EDITOR", "ADMIN", "OWNER"];

function roleBadgeClass(role: Role): string {
  switch (role) {
    case "OWNER":
      return "text-amber-400 border-amber-400/30 bg-amber-400/10";
    case "ADMIN":
      return "text-purple-400 border-purple-400/30 bg-purple-400/10";
    case "EDITOR":
      return "text-blue-400 border-blue-400/30 bg-blue-400/10";
    case "VIEWER":
      return "text-zinc-400 border-zinc-400/30 bg-zinc-400/10";
  }
}

export function AccessPanel({ readonly = false }: { readonly?: boolean } = {}) {
  const { data, isLoading } = usePaymentAccessList();
  const grant = useGrantPaymentAccess();
  const revoke = useRevokePaymentAccess();
  const updateRole = useUpdatePaymentRole();
  const updatePermissions = useUpdatePaymentPermissions();

  const [showDialog, setShowDialog] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantPhone, setGrantPhone] = useState("");
  const [grantRole, setGrantRole] = useState<Role>("VIEWER");
  const [grantSendVia, setGrantSendVia] = useState<"email" | "whatsapp">("whatsapp");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const records = data?.records ?? [];

  async function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    if (!grantUserId) return toast.error("Informe o ID/email do usuário");
    try {
      const result = await grant.mutateAsync({
        userId: grantUserId,
        role: grantRole,
        sendVia: grantSendVia,
        phone: grantPhone || undefined,
      });
      if (result.deliveryWarning) toast.warning(result.deliveryWarning);
      else
        toast.success(
          `Acesso liberado — avisamos via ${grantSendVia === "email" ? "e-mail" : "WhatsApp"}`,
        );
      setShowDialog(false);
      setGrantUserId("");
      setGrantPhone("");
      setGrantRole("VIEWER");
    } catch (err) {
      const message = (err as { message?: string })?.message ?? "Erro ao liberar acesso";
      toast.error(message);
    }
  }

  async function handleRevoke(userId: string) {
    try {
      await revoke.mutateAsync({ userId });
      toast.success("Acesso revogado");
    } catch {
      toast.error("Erro ao revogar acesso");
    }
  }

  async function handleResendNotice(
    userId: string,
    role: Role,
    via: "email" | "whatsapp",
    phone?: string | null,
  ) {
    try {
      const result = await grant.mutateAsync({
        userId,
        role,
        sendVia: via,
        phone: phone || undefined,
      });
      if (result.deliveryWarning) toast.warning(result.deliveryWarning);
      else toast.success("Aviso de acesso reenviado");
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Erro ao reenviar aviso";
      toast.error(message);
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast.success(`Role atualizada para ${ROLE_LABELS[role]}`);
    } catch {
      toast.error("Erro ao mudar role");
    }
  }

  async function handlePermissionToggle(
    userId: string,
    role: Role,
    currentOverride: unknown,
    resource: PaymentResource,
    action: PaymentAction,
    value: boolean,
  ) {
    const effective = resolveEffectivePermissions(role, currentOverride);
    const next: PaymentPermissionMatrix = {
      ...effective,
      [resource]: { ...effective[resource], [action]: value },
    };
    try {
      await updatePermissions.mutateAsync({ userId, permissions: next });
    } catch {
      toast.error("Erro ao atualizar permissões");
    }
  }

  async function handleResetPermissions(userId: string) {
    try {
      await updatePermissions.mutateAsync({ userId, permissions: null });
      toast.success("Permissões resetadas pro default da role");
    } catch {
      toast.error("Erro ao resetar permissões");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="size-4 text-[#1E90FF]" />
          Acesso Financeiro
        </div>
        {!readonly && (
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="gap-1.5 bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
          >
            <Plus className="size-3.5" /> Liberar Acesso
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Apenas as pessoas abaixo conseguem entrar no NASA Payment — nem mesmo o
        owner da organização vê dados financeiros sem registro aqui. Não há
        senha separada: cada pessoa entra com a própria conta e o que vale é a
        autorização concedida nesta tela.
      </p>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">Usuário</th>
              <th className="text-left px-4 py-2.5 font-medium">Role</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Recursos</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                  Carregando...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                  Nenhum acesso liberado ainda. Clique em &quot;Liberar Acesso&quot; para começar.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const role = record.role as Role;
                const expanded = expandedUserId === record.userId;
                const effective = resolveEffectivePermissions(role, record.permissions);
                const hasOverride = !!record.permissions;
                return (
                  <>
                    <tr
                      key={record.id}
                      className="border-b border-border/30 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium flex items-center gap-1.5">
                          {role === "OWNER" && (
                            <Crown className="size-3.5 text-amber-400" />
                          )}
                          {record.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{record.user.email}</p>
                        {record.user.phone && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            📱 {record.user.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={role}
                          onValueChange={(value) =>
                            handleRoleChange(record.userId, value as Role)
                          }
                          disabled={!record.isAuthorized || readonly}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((roleOption) => (
                              <SelectItem
                                key={roleOption}
                                value={roleOption}
                                className="text-xs"
                              >
                                {ROLE_LABELS[roleOption]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            record.isAuthorized
                              ? roleBadgeClass(role)
                              : "text-red-400 border-red-400/30 bg-red-400/10"
                          }
                        >
                          {record.isAuthorized ? "Autorizado" : "Revogado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Collapsible
                          open={expanded}
                          onOpenChange={(open) =>
                            setExpandedUserId(open ? record.userId : null)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                            >
                              {hasOverride ? "Customizada" : "Default"}
                              <ChevronDown
                                className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              disabled={readonly}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2 text-xs"
                              onClick={() =>
                                handleResendNotice(
                                  record.userId,
                                  role,
                                  "whatsapp",
                                  record.phone ?? record.user.phone,
                                )
                              }
                            >
                              <RefreshCw className="size-3.5" /> Reenviar aviso
                              (WhatsApp)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-xs"
                              onClick={() =>
                                handleResendNotice(record.userId, role, "email")
                              }
                            >
                              <RefreshCw className="size-3.5" /> Reenviar aviso
                              (e-mail)
                            </DropdownMenuItem>
                            {hasOverride && (
                              <DropdownMenuItem
                                className="gap-2 text-xs"
                                onClick={() => handleResetPermissions(record.userId)}
                              >
                                <RefreshCw className="size-3.5" /> Resetar permissões
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="gap-2 text-xs text-red-400"
                              onClick={() => handleRevoke(record.userId)}
                            >
                              <ShieldOff className="size-3.5" /> Revogar acesso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${record.id}-matrix`} className="bg-muted/10">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role]} Desmarque/marque pra customizar.
                            </p>
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-muted/30 text-muted-foreground">
                                    <th className="text-left px-3 py-1.5">Recurso</th>
                                    {PAYMENT_ACTIONS.map((action) => (
                                      <th key={action} className="px-2 py-1.5 w-14">
                                        {ACTION_LABELS[action]}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {PAYMENT_RESOURCES.map((resource) => (
                                    <tr
                                      key={resource}
                                      className="border-t border-border/30"
                                    >
                                      <td className="px-3 py-2">
                                        {RESOURCE_LABELS[resource]}
                                      </td>
                                      {PAYMENT_ACTIONS.map((action) => {
                                        const checked = effective[resource][action];
                                        const isDefault =
                                          ROLE_DEFAULTS[role][resource][action] === checked;
                                        return (
                                          <td
                                            key={action}
                                            className="px-2 py-2 text-center"
                                          >
                                            <Checkbox
                                              checked={checked}
                                              disabled={readonly}
                                              onCheckedChange={(value) =>
                                                handlePermissionToggle(
                                                  record.userId,
                                                  role,
                                                  record.permissions,
                                                  resource,
                                                  action,
                                                  value === true,
                                                )
                                              }
                                              className={
                                                isDefault ? "" : "ring-1 ring-amber-400/50"
                                              }
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Liberar Acesso Financeiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGrant} className="space-y-4">
            <div className="space-y-2">
              <Label>ID ou e-mail do usuário</Label>
              <Input
                placeholder="user_xyz ou email@exemplo.com"
                value={grantUserId}
                onChange={(event) => setGrantUserId(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={grantRole} onValueChange={(value) => setGrantRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      <div className="flex flex-col items-start">
                        <span>{ROLE_LABELS[roleOption]}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {ROLE_DESCRIPTIONS[roleOption]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Avisar via</Label>
              <Select
                value={grantSendVia}
                onValueChange={(value) =>
                  setGrantSendVia(value as "email" | "whatsapp")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {grantSendVia === "whatsapp" && (
              <div className="space-y-2">
                <Label>Número WhatsApp (opcional)</Label>
                <Input
                  placeholder="Deixe vazio para usar o de Geral &gt; Telefone"
                  value={grantPhone}
                  onChange={(event) => setGrantPhone(event.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Se vazio, o sistema usa o telefone cadastrado em Settings &gt;
                  Geral &gt; Telefone do usuário.
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setShowDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={grant.isPending}
                className="flex-1 bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
              >
                {grant.isPending ? "Liberando..." : "Liberar acesso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
