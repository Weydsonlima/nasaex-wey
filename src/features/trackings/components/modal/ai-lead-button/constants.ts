import { UserPlus, Search, ArrowRight, Zap } from "lucide-react";

export const SUGGESTED_PROMPTS = [
  {
    icon: UserPlus,
    label: "Criar lead",
    text: "Quero criar um novo lead. Me ajude com o processo.",
    color: "text-green-500",
  },
  {
    icon: Search,
    label: "Buscar leads",
    text: "Busque leads com propostas em aberto.",
    color: "text-blue-500",
  },
  {
    icon: ArrowRight,
    label: "Mover lead",
    text: "Quero mover um lead para a próxima etapa do funil.",
    color: "text-purple-500",
  },
  {
    icon: Zap,
    label: "Follow-up",
    text: "Liste os leads que precisam de acompanhamento hoje.",
    color: "text-yellow-500",
  },
];
