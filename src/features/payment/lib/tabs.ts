/** Abas do NASA Payment. Compartilhado entre a página e os cards do painel,
 *  que navegam pra aba correspondente pelos links "Ver todas". */
export type PaymentTab =
  | "dashboard"
  | "receivables"
  | "payables"
  | "cashflow"
  | "contacts"
  | "contracts"
  | "approvals";
