"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  FileText,
  LayoutDashboard,
  LineChart,
  Loader2,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { HeaderTracking } from "@/features/leads/components/header-tracking";
import { PaymentDashboard } from "./dashboard/payment-dashboard";
import { EntriesTable } from "./entries/entries-table";
import { EntryForm } from "./entries/entry-form";
import { CashflowTab } from "./cashflow/cashflow-tab";
import { ContactsTab } from "./contacts/contacts-tab";
import { ContractsTab } from "./contracts/contracts-tab";
import { PaymentSettings } from "./settings/payment-settings";
import { ApprovalsTab } from "./approvals/approvals-tab";
import { GovernanceSettingsTab } from "./governance/governance-settings-tab";
import { DunningRulesTab } from "./dunning/dunning-rules-tab";
import { NerpFinancialToggle } from "./governance/nerp-financial-toggle";
import {
  PaymentPeriodPicker,
  currentMonthRange,
} from "./shared/payment-period-picker";
import {
  usePendingApprovals,
  useCanApprovePayments,
} from "../hooks/use-payment-approvals";
import { useCreatePaymentEntry } from "../hooks/use-payment";
import { usePaymentEntriesExport } from "../hooks/use-payment-export";
import { PANEL_BACKGROUND, PANEL_MUTED } from "../lib/ui";
import type { PaymentTab } from "../lib/tabs";

const TAB_ITEMS: { value: PaymentTab; label: string; icon: React.ElementType }[] = [
  { value: "dashboard", label: "Painel", icon: LayoutDashboard },
  { value: "receivables", label: "A Receber", icon: ArrowDownCircle },
  { value: "payables", label: "A Pagar", icon: ArrowUpCircle },
  { value: "cashflow", label: "Fluxo de Caixa", icon: LineChart },
  { value: "contacts", label: "Contatos", icon: Users },
  { value: "contracts", label: "Contratos Ativos", icon: FileText },
];

const TAB_TRIGGER_CLASS =
  "gap-1.5 rounded-lg px-3 text-[13px] font-medium text-[#667085] data-[state=active]:bg-white data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:bg-card dark:data-[state=active]:text-blue-400";

export function PaymentPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PaymentTab>("dashboard");
  const [period, setPeriod] = useState<{ from?: Date; to?: Date }>(currentMonthRange());
  const [newEntryType, setNewEntryType] = useState<"RECEIVABLE" | "PAYABLE">("RECEIVABLE");
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const canApproveQuery = useCanApprovePayments();
  const pendingApprovals = usePendingApprovals();
  const showApprovalsTab = canApproveQuery.data?.canApprove ?? false;
  const pendingCount = pendingApprovals.data?.count ?? 0;

  const createEntry = useCreatePaymentEntry();
  const { exportEntries, isExporting } = usePaymentEntriesExport();

  const dateFrom = period.from?.toISOString();
  const dateTo = period.to?.toISOString();

  async function handleExport() {
    try {
      const { exported } = await exportEntries({ dateFrom, dateTo });
      if (exported === 0) toast.info("Nenhum lançamento no período selecionado");
      else toast.success(`${exported} lançamentos exportados`);
    } catch {
      toast.error("Erro ao exportar lançamentos");
    }
  }

  async function handleCreateEntry(
    payload: Parameters<typeof createEntry.mutateAsync>[0],
  ) {
    try {
      await createEntry.mutateAsync(payload);
      setNewEntryOpen(false);
      toast.success(
        payload.type === "RECEIVABLE"
          ? "Conta a receber criada!"
          : "Conta a pagar criada!",
      );
    } catch {
      toast.error("Erro ao criar lançamento");
    }
  }

  return (
    <div className={`flex h-full w-full flex-col ${PANEL_BACKGROUND}`}>
      <HeaderTracking title="Payment" />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#101828] dark:text-foreground">
            Painel Financeiro
          </h1>
          <p className={`text-[13px] ${PANEL_MUTED}`}>
            Visão geral da saúde financeira da empresa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PaymentPeriodPicker
            from={period.from}
            to={period.to}
            onChange={setPeriod}
            hideTime
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Exportar
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[#2563EB] text-xs text-white hover:bg-[#1D4ED8]"
            onClick={() => setNewEntryOpen(true)}
          >
            <Plus className="size-3.5" />
            Nova Transação
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setSettingsOpen(true)}
            title="Configurações do Payment"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PaymentTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="w-full shrink-0 overflow-x-auto px-6">
          <TabsList className="h-10 gap-1 rounded-xl bg-[#EDF1F7] p-1 dark:bg-muted">
            {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className={TAB_TRIGGER_CLASS}>
                <Icon className="size-3.5" />
                {label}
              </TabsTrigger>
            ))}
            {showApprovalsTab && (
              <TabsTrigger value="approvals" className={TAB_TRIGGER_CLASS}>
                <ShieldCheck className="size-3.5" />
                Aprovações
                {pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="dashboard" className="mt-0 px-6 py-5">
            <PaymentDashboard
              dateFrom={dateFrom}
              dateTo={dateTo}
              onNavigate={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="receivables" className="mt-0 px-6 py-5">
            <EntriesTable type="RECEIVABLE" />
          </TabsContent>
          <TabsContent value="payables" className="mt-0 px-6 py-5">
            <EntriesTable type="PAYABLE" />
          </TabsContent>
          <TabsContent value="cashflow" className="mt-0 px-6 py-5">
            <CashflowTab />
          </TabsContent>
          <TabsContent value="contacts" className="mt-0 px-6 py-5">
            <ContactsTab />
          </TabsContent>
          <TabsContent value="contracts" className="mt-0 px-6 py-5">
            <ContractsTab />
          </TabsContent>
          {showApprovalsTab && (
            <TabsContent value="approvals" className="mt-0 px-6 py-5">
              <ApprovalsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>

      <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pb-1">
            <Button
              type="button"
              variant={newEntryType === "RECEIVABLE" ? "default" : "outline"}
              className={
                newEntryType === "RECEIVABLE"
                  ? "bg-[#16A34A] text-white hover:bg-[#15803D]"
                  : ""
              }
              onClick={() => setNewEntryType("RECEIVABLE")}
            >
              <ArrowDownCircle className="size-4" />
              A Receber
            </Button>
            <Button
              type="button"
              variant={newEntryType === "PAYABLE" ? "default" : "outline"}
              className={
                newEntryType === "PAYABLE"
                  ? "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                  : ""
              }
              onClick={() => setNewEntryType("PAYABLE")}
            >
              <ArrowUpCircle className="size-4" />
              A Pagar
            </Button>
          </div>
          <EntryForm
            key={newEntryType}
            type={newEntryType}
            onSubmit={handleCreateEntry}
            onCancel={() => setNewEntryOpen(false)}
            isLoading={createEntry.isPending}
          />
        </DialogContent>
      </Dialog>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-lg"
        >
          <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 pb-4 pt-6">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="size-4" /> Configurações do Payment
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-10 px-6 py-6">
            <section className="space-y-4">
              <h3 className="border-b border-border/40 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Governança e Aprovações
              </h3>
              <GovernanceSettingsTab />
            </section>
            <section className="space-y-4">
              <h3 className="border-b border-border/40 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Régua de Cobrança
              </h3>
              <DunningRulesTab />
            </section>
            <section className="space-y-4">
              <h3 className="border-b border-border/40 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Integrações
              </h3>
              <NerpFinancialToggle />
            </section>
            <section className="space-y-4">
              <h3 className="border-b border-border/40 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Outras configurações
              </h3>
              <PaymentSettings />
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
