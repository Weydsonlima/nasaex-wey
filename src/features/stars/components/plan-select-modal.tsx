"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarIcon } from "./star-icon";
import {
  Check, Loader2, ArrowRight, Sparkles, Users, ExternalLink,
} from "lucide-react";

interface PlanSelectModalProps {
  open: boolean;
  onClose: () => void;
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "/mês",
  annual:  "/ano",
  weekly:  "/sem",
};

export function PlanSelectModal({ open, onClose }: PlanSelectModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    ...orpc.stars.listPlans.queryOptions(),
    enabled: open,
  });

  const plans = data?.plans ?? [];

  const handleChoose = async (plan: typeof plans[number]) => {
    if (loadingId) return;

    // External link CTA
    if (plan.ctaLink) {
      window.open(plan.ctaLink, "_blank");
      return;
    }

    // Gateway CTA — initiate a plan checkout session
    if (plan.ctaGatewayId) {
      setLoadingId(plan.id);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId:   plan.id,
            planSlug: plan.slug,
            mode:     "subscription",
            itemType: "plan",
            itemSlug: plan.slug,
          }),
        });
        const json = await res.json();
        if (json.url) {
          window.location.href = json.url;
        } else {
          console.warn("[PlanSelectModal] Gateway não configurado:", json.error);
          alert("Gateway de pagamento não configurado. Contate o suporte.");
        }
      } finally {
        setLoadingId(null);
      }
      return;
    }

    // Fallback: contact sales
    window.open("mailto:vendas@nasaex.com.br?subject=Plano " + plan.name, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">Escolha seu plano</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Stars são creditados mensalmente e usados para manter integrações ativas
              </p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum plano disponível no momento.
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 py-2",
            plans.length === 1 ? "grid-cols-1 max-w-sm mx-auto" :
            plans.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
                                 "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {plans.map((plan) => {
              const isLoading = loadingId === plan.id;
              const billingLabel = BILLING_LABEL[plan.billingType] ?? "/mês";
              const hasCta = !!(plan.ctaLink || plan.ctaGatewayId);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-xl border-2 p-4 transition-all",
                    plan.highlighted
                      ? "border-[#7C3AED] bg-[#7C3AED]/5 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                      : "border-border hover:border-[#7C3AED]/40 hover:bg-muted/30"
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#7C3AED] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        Mais popular
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-4">
                    <p className="font-bold text-lg">{plan.name}</p>
                    {plan.slogan && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.slogan}</p>
                    )}

                    <div className="mt-2">
                      <span className="text-2xl font-extrabold">
                        R$ {plan.priceMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-muted-foreground">{billingLabel}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1 mt-2 text-[11px] font-semibold text-[#7C3AED]">
                      <StarIcon className="size-3.5" />
                      {plan.monthlyStars.toLocaleString("pt-BR")} stars/mês
                    </div>

                    <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-muted-foreground">
                      <Users className="size-3" />
                      {plan.maxUsers >= 999 ? "Usuários ilimitados" : `Até ${plan.maxUsers} usuários`}
                    </div>
                  </div>

                  {/* Benefits */}
                  {plan.benefits.length > 0 && (
                    <ul className="space-y-1.5 flex-1 mb-4">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px]">
                          <Check className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  <Button
                    size="sm"
                    disabled={!!loadingId}
                    className={cn(
                      "w-full mt-auto gap-1.5 font-semibold text-xs",
                      plan.highlighted
                        ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    )}
                    onClick={() => handleChoose(plan)}
                  >
                    {isLoading ? (
                      <><Loader2 className="size-3.5 animate-spin" /> Redirecionando...</>
                    ) : plan.ctaLink ? (
                      <><ExternalLink className="size-3.5" /> {plan.ctaLabel} <ArrowRight className="size-3" /></>
                    ) : (
                      <><Sparkles className="size-3.5" /> {plan.ctaLabel} {hasCta && <ArrowRight className="size-3" />}</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground pb-1">
          🔒 Pagamento seguro — cancele quando quiser, sem multas
        </p>
      </DialogContent>
    </Dialog>
  );
}
