import { Star } from "lucide-react";

interface StarTransaction {
  description: string;
  appSlug?: string | null;
  amount: number;
  createdAt: Date | string;
}

interface StarsHistoryProps {
  transactions: StarTransaction[];
}

export function StarsHistory({ transactions }: StarsHistoryProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2">
        <Star className="size-4 text-yellow-500" /> Consumo de Stars (últimas
        200 transações)
      </h3>
      <div className="rounded-xl border overflow-hidden divide-y max-h-52 overflow-y-auto">
        {transactions.map((tx, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/10"
          >
            <div>
              <p className="text-xs font-medium">{tx.description}</p>
              {tx.appSlug && (
                <p className="text-[10px] text-muted-foreground">{tx.appSlug}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-red-500">
                {tx.amount.toLocaleString("pt-BR")} ⭐
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
