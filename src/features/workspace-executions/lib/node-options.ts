import { WorkspaceNodeType } from "@/generated/prisma/enums";
import {
  ArchiveIcon,
  ArrowLeftRightIcon,
  CheckCircle2Icon,
  FunnelIcon,
  ListChecksIcon,
  MailIcon,
  MousePointerIcon,
  MoveHorizontalIcon,
  PlusCircleIcon,
  PlusSquareIcon,
  SendIcon,
  TagIcon,
  TagsIcon,
  TimerIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
} from "lucide-react";

export type WsNodeTypeOption = {
  type: WorkspaceNodeType;
  category: "trigger" | "execution";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

export const wsTriggerNodes: WsNodeTypeOption[] = [
  {
    type: WorkspaceNodeType.WS_MANUAL_TRIGGER,
    category: "trigger",
    label: "Gatilho Manual",
    description: "Execute o fluxo manualmente",
    icon: MousePointerIcon,
  },
  {
    type: WorkspaceNodeType.WS_ACTION_CREATED,
    category: "trigger",
    label: "Ação criada",
    description: "Executa ao criar uma ação",
    icon: PlusCircleIcon,
  },
  {
    type: WorkspaceNodeType.WS_ACTION_MOVED_COLUMN,
    category: "trigger",
    label: "Ação movida",
    description: "Executa ao mover ação para coluna",
    icon: MoveHorizontalIcon,
  },
  {
    type: WorkspaceNodeType.WS_ACTION_TAGGED,
    category: "trigger",
    label: "Ação etiquetada",
    description: "Executa ao adicionar etiqueta",
    icon: TagsIcon,
  },
  {
    type: WorkspaceNodeType.WS_ACTION_COMPLETED,
    category: "trigger",
    label: "Ação concluída",
    description: "Executa ao concluir ação",
    icon: CheckCircle2Icon,
  },
  {
    type: WorkspaceNodeType.WS_ACTION_PARTICIPANT_ADDED,
    category: "trigger",
    label: "Participante adicionado",
    description: "Executa ao adicionar participante",
    icon: UserPlusIcon,
  },
];

export const wsExecutionNodes: WsNodeTypeOption[] = [
  {
    type: WorkspaceNodeType.WS_CREATE_ACTION,
    category: "execution",
    label: "Criar ação",
    description: "Cria uma nova ação",
    icon: PlusSquareIcon,
  },
  {
    type: WorkspaceNodeType.WS_MOVE_ACTION,
    category: "execution",
    label: "Mover ação",
    description: "Move ação para outra coluna",
    icon: ArrowLeftRightIcon,
  },
  {
    type: WorkspaceNodeType.WS_ADD_TAG_ACTION,
    category: "execution",
    label: "Adicionar etiqueta",
    description: "Adiciona etiqueta à ação",
    icon: TagIcon,
  },
  {
    type: WorkspaceNodeType.WS_ADD_PARTICIPANT,
    category: "execution",
    label: "Adicionar participante",
    description: "Adiciona participante à ação",
    icon: UserPlusIcon,
  },
  {
    type: WorkspaceNodeType.WS_SET_RESPONSIBLE,
    category: "execution",
    label: "Definir responsável",
    description: "Define responsável da ação",
    icon: UserRoundPlusIcon,
  },
  {
    type: WorkspaceNodeType.WS_CREATE_SUB_ACTION,
    category: "execution",
    label: "Criar sub-ação",
    description: "Cria sub-ação",
    icon: ListChecksIcon,
  },
  {
    type: WorkspaceNodeType.WS_SEND_MESSAGE_PARTICIPANTS,
    category: "execution",
    label: "Mensagem (WhatsApp)",
    description: "Envia WhatsApp aos participantes",
    icon: SendIcon,
  },
  {
    type: WorkspaceNodeType.WS_SEND_EMAIL_PARTICIPANTS,
    category: "execution",
    label: "Email/Notificação",
    description: "Envia notificação aos participantes",
    icon: MailIcon,
  },
  {
    type: WorkspaceNodeType.WS_ARCHIVE_ACTION,
    category: "execution",
    label: "Arquivar ação",
    description: "Arquiva a ação",
    icon: ArchiveIcon,
  },
  {
    type: WorkspaceNodeType.WS_WAIT,
    category: "execution",
    label: "Esperar",
    description: "Aguarda antes de continuar",
    icon: TimerIcon,
  },
  // {
  //   type: WorkspaceNodeType.WS_FILTER,
  //   category: "execution",
  //   label: "Filtrar",
  //   description: "Condição booleana sobre a ação",
  //   icon: FunnelIcon,
  // },
];
