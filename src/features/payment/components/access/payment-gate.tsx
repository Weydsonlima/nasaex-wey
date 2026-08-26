"use client";

import { Landmark, Loader2, ShieldPlus, ShieldX, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useMyPaymentAccess,
  useSetupOwnerPaymentAccess,
} from "../../hooks/use-payment";

/**
 * Gate de acesso do módulo NASA Payment.
 *
 * Não existe senha separada: a autenticação é a própria sessão da conta
 * (better-auth). O que este gate faz é conferir a AUTORIZAÇÃO concedida pelo
 * owner do financeiro em Permissões → Acesso Financeiro. O owner da empresa
 * que ainda não tem registro pode se auto-provisionar como OWNER do módulo.
 */
export function PaymentGate({ children }: { children: React.ReactNode }) {
  const myAccess = useMyPaymentAccess();
  const setupOwner = useSetupOwnerPaymentAccess();

  if (myAccess.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (myAccess.data?.authorized) return <>{children}</>;

  async function handleSelfSetup() {
    try {
      const result = await setupOwner.mutateAsync({});
      if (result.ok) {
        await myAccess.refetch();
        toast.success("Acesso financeiro ativado");
      } else {
        toast.error("Não foi possível ativar o acesso");
      }
    } catch {
      toast.error("Erro ao ativar acesso");
    }
  }

  if (myAccess.data?.canSelfSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full gap-6 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-16 rounded-2xl bg-[#1E90FF]/10 border border-[#1E90FF]/20 flex items-center justify-center">
            <ShieldPlus className="size-8 text-[#1E90FF]" />
          </div>
          <h1 className="text-xl font-bold">Ative seu acesso financeiro</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Como responsável pela empresa, ative seu acesso ao módulo NASA
            Payment. Você entra com a sua própria conta e passa a liberar acesso
            a outras pessoas em Permissões → Acesso Financeiro.
          </p>
        </div>
        <Button
          onClick={handleSelfSetup}
          disabled={setupOwner.isPending}
          className="h-11 w-full max-w-xs bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
        >
          {setupOwner.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Ativando...
            </>
          ) : (
            <>
              <ShieldCheck className="size-4 mr-2" />
              Ativar acesso financeiro
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full gap-6 px-4 text-center">
      <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <ShieldX className="size-8 text-red-500" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Landmark className="size-5 text-[#1E90FF]" />
          Acesso financeiro restrito
        </h1>
        <p className="text-sm text-muted-foreground">
          Apenas pessoas autorizadas em{" "}
          <strong>Permissões → Acesso Financeiro</strong> podem entrar no módulo
          NASA Payment. Procure o responsável pelo financeiro da sua organização
          para solicitar acesso.
        </p>
      </div>
    </div>
  );
}
