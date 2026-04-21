"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Send,
  Lightbulb,
  Zap,
  Clock,
  ChevronRight,
  LayoutGrid,
  Columns2,
  ChevronDown,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  useSuspenseWokspaces,
  useSuspenseColumnsByWorkspace,
} from "@/features/workspace/hooks/use-workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useQueryState } from "nuqs";
import { MessageResponse } from "@/components/ai-elements/message";
import { useWorkspaceAi } from "../hooks/use-create-action-with-ai";

const SUGGESTED_PROMPTS = [
  {
    icon: Zap,
    label: "Follow-up",
    text: "Gere 3 lembretes de acompanhamento para propostas enviadas há mais de 2 dias.",
    color: "text-yellow-500",
  },
  {
    icon: Clock,
    label: "Rotina",
    text: "Planeje minha manhã com as 4 tarefas mais urgentes de gestão comercial.",
    color: "text-purple-500",
  },
];

interface CreateActionWithAiProps {
  workspaceId?: string;
  trackingId?: string;
}

export function CreateActionWithAi({
  workspaceId: initialWorkspaceId,
  trackingId: initialTrackingId,
}: CreateActionWithAiProps) {
  const [prompt, setPrompt] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [, setActionId] = useQueryState("actionId", { shallow: true });

  const { data: workspacesData } = useSuspenseWokspaces();
  const workspaces = workspacesData.workspaces;

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    initialWorkspaceId || workspaces[0]?.id,
  );

  const { data: columnsData } =
    useSuspenseColumnsByWorkspace(selectedWorkspaceId);
  const columns = columnsData.columns;

  const [selectedColumnId, setSelectedColumnId] = useState(columns[0]?.id);

  useEffect(() => {
    if (initialWorkspaceId) {
      setSelectedWorkspaceId(initialWorkspaceId);
    }
  }, [initialWorkspaceId]);

  useEffect(() => {
    if (
      columns.length > 0 &&
      (!selectedColumnId || !columns.some((c) => c.id === selectedColumnId))
    ) {
      setSelectedColumnId(columns[0].id);
    }
  }, [columns, selectedColumnId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, currentResponse]);

  const selectedWorkspace = workspaces.find(
    (w) => w.id === selectedWorkspaceId,
  );
  const selectedColumn = columns.find((c) => c.id === selectedColumnId);

  const { messages, isLoading, sendMessage } = useWorkspaceAi(
    selectedWorkspaceId,
    selectedColumnId,
  );

  const handleSuggestClick = (text: string) => {
    setPrompt(text);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    const currentPrompt = prompt;
    setPrompt(""); // Limpa o input imediatamente

    await sendMessage(currentPrompt, {
      workspaceId: selectedWorkspaceId,
      columnId: selectedColumnId,
    });
  };

  // Função para renderizar conteúdo da mensagem com suporte a markdown e botões customizados
  const renderMessageContent = (
    content: string | null,
    isStreaming = false,
  ) => {
    if (!content) return null;

    // Split por padrões de botão customizado
    const parts = content.split(/(\[VIEW_ACTION:[^|]+\|[^\]]+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[VIEW_ACTION:([^|]+)\|([^\]]+)\]/);
      if (match) {
        const [, title, id] = match;
        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => setActionId(id)}
            className="flex items-center gap-2 bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500/50 text-xs my-2 transition-all group/btn w-fit"
          >
            <Eye className="size-3.5 text-purple-400 group-hover/btn:scale-110 transition-transform" />
            <span className="font-semibold text-zinc-200">Ver Ação:</span>
            <span className="text-zinc-400 truncate max-w-[150px]">
              {title}
            </span>
          </Button>
        );
      }

      // Renderiza como Markdown utilizando o componente universal do projeto
      return (
        <MessageResponse
          key={index}
          parseIncompleteMarkdown={isStreaming}
          className="prose prose-zinc prose-invert max-w-none text-sm"
        >
          {part}
        </MessageResponse>
      );
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative overflow-hidden group border-purple-500/20 hover:border-purple-500/50 transition-all duration-300"
        >
          <Sparkles className="size-4 mr-2 text-purple-500 group-hover:animate-pulse" />
          <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">
            Criar com IA
          </span>
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="sm:max-w-md border-l border-zinc-800 px-0 flex flex-col h-full gap-0 bg-zinc-950"
      >
        <SheetHeader className="space-y-4 mb-6 px-4 pt-4 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="size-5 text-purple-500" />
            </div>
            <SheetTitle className="text-2xl font-bold tracking-tight text-zinc-100">
              Gerador de Ações
            </SheetTitle>
          </div>
          <SheetDescription className="text-sm text-zinc-400">
            Descreva suas tarefas e o ASTRO as organizará para você nos fluxos
            corretos em segundos.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea
          ref={scrollRef}
          className="flex-1 px-4 h-full overflow-y-auto"
        >
          <div className="flex flex-col gap-4 py-4">
            {messages.length === 0 && !currentResponse && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">
                    <Lightbulb className="size-3.5" />
                    Sugestões de início
                  </div>
                  <div className="grid gap-2">
                    {SUGGESTED_PROMPTS.map((item, idx) => (
                      <Card
                        key={idx}
                        className="cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 transition-all border-zinc-800 hover:border-purple-500/30 group"
                        onClick={() => handleSuggestClick(item.text)}
                      >
                        <CardContent className="p-3 flex items-start gap-3">
                          <div
                            className={cn(
                              "p-1.5 rounded-md bg-zinc-950 border border-zinc-800 shadow-sm transition-colors",
                              item.color,
                            )}
                          >
                            <item.icon className="size-3.5" />
                          </div>
                          <p className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
                            {item.text}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <Avatar className="size-8 border border-zinc-800 shrink-0">
                  {message.role === "user" ? (
                    <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                      EU
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src="/nasa-icon.png" />
                      <AvatarFallback className="bg-purple-500/20 text-purple-400">
                        <Sparkles className="size-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl max-w-[90%] text-sm shadow-sm",
                    message.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : message.role === "tool"
                        ? "bg-zinc-900/50 text-zinc-500 border border-dashed border-zinc-800 text-[11px] font-mono leading-tight rounded-tl-none italic"
                        : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none",
                  )}
                >
                  {renderMessageContent(message.content)}
                </div>
              </div>
            ))}

            {currentResponse && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <Avatar className="size-8 border border-zinc-800 shrink-0">
                  <AvatarFallback className="bg-purple-500/20 text-purple-400">
                    <Sparkles className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-2 rounded-2xl rounded-tl-none bg-zinc-900 text-zinc-200 border border-zinc-800 text-sm shadow-sm max-w-[90%]">
                  {renderMessageContent(currentResponse, true)}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
          <InputGroup className="border-zinc-800 rounded-2xl flex-col h-auto">
            <InputGroupAddon align="block-start" className="border-zinc-800/50">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 hover:bg-zinc-800 transition-all group rounded-lg"
                  >
                    <div className="flex items-center gap-2 overflow-hidden text-left">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        <LayoutGrid className="size-3 text-purple-500" />
                        <span className="truncate max-w-[100px]">
                          {selectedWorkspace?.name || "Workspace"}
                        </span>
                      </div>
                      <ChevronRight className="size-2.5 text-zinc-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <Columns2 className="size-3 text-blue-500" />
                        <span className="truncate max-w-[100px]">
                          {selectedColumn?.name || "Coluna"}
                        </span>
                      </div>
                      <ChevronDown className="size-3 text-zinc-600 ml-1" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[280px] bg-zinc-950 border-zinc-800 rounded-xl p-1 shadow-2xl"
                >
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-2 py-1.5">
                    Alternar Contexto
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />

                  {workspaces.map((w) => (
                    <DropdownMenuSub key={w.id}>
                      <DropdownMenuSubTrigger
                        className={cn(
                          "rounded-lg px-2 flex items-center justify-between transition-colors",
                          selectedWorkspaceId === w.id &&
                            "bg-purple-500/10 text-purple-400",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{w.icon || "🏢"}</span>
                          <span className="text-sm font-medium">{w.name}</span>
                        </div>
                        {selectedWorkspaceId === w.id && (
                          <Check className="size-3.5 ml-2" />
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="bg-zinc-950 border-zinc-800 rounded-xl p-1 min-w-[180px] shadow-xl">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-2 py-1.5">
                            Colunas do Fluxo
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-zinc-800" />

                          {selectedWorkspaceId === w.id ? (
                            columns.map((c) => (
                              <DropdownMenuItem
                                key={c.id}
                                onClick={() => {
                                  setSelectedWorkspaceId(w.id);
                                  setSelectedColumnId(c.id);
                                }}
                                className={cn(
                                  "rounded-lg px-3 flex items-center justify-between py-2 transition-colors",
                                  selectedColumnId === c.id &&
                                    "bg-blue-500/10 text-blue-400 font-medium",
                                )}
                              >
                                <div className="flex items-center gap-2 text-left overflow-hidden">
                                  <div
                                    className="size-2 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: c.color || "#3b82f6",
                                    }}
                                  />
                                  <span className="text-sm truncate">
                                    {c.name}
                                  </span>
                                </div>
                                {selectedColumnId === c.id && (
                                  <Check className="size-3.5" />
                                )}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-[10px] text-zinc-500 italic text-center leading-tight">
                              Clique no workspace para ver suas colunas
                            </div>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </InputGroupAddon>

            <div className="flex w-full items-end">
              <InputGroupTextarea
                placeholder="Pergunte ao ASTRO..."
                className={cn(
                  "min-h-[44px] max-h-[160px] text-sm text-zinc-100 placeholder:text-zinc-600",
                )}
                value={prompt}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <InputGroupAddon align="inline-end" className="pb-2 pr-2">
                <InputGroupButton
                  disabled={!prompt.trim() || isLoading}
                  size="icon-sm"
                  className={cn(
                    "rounded-xl transition-all shadow-lg shrink-0",
                    "bg-purple-600 hover:bg-purple-500 text-white",
                    "disabled:opacity-20 disabled:scale-95 disabled:bg-zinc-800",
                  )}
                  onClick={handleGenerate}
                >
                  <Send className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </div>
          </InputGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
