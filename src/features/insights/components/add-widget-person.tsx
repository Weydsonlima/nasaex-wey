import { CirclePlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryTags } from "@/features/tags/hooks/use-tags";
import { useMutationCreateWidget } from "../hooks/use-widget";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { WidgetType } from "@/generated/prisma/enums";
import { useState } from "react";

interface AddWidgetPersonProps {
  lastWidgetOrder: number;
}

export function AddWidgetPerson({ lastWidgetOrder }: AddWidgetPersonProps) {
  const { tags } = useQueryTags({ trackingId: "ALL" });
  const mutation = useMutationCreateWidget();
  const [open, setOpen] = useState(false);

  const onClick = (type: WidgetType, tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    mutation.mutate(
      {
        title: tag.name,
        type: type,
        config: JSON.stringify({ tagid: tagId }),
        organizationId: tag.organizationId,
        order: lastWidgetOrder + 1,
      },
      {
        onSuccess: () => {
          toast.success("Insight adicionado com sucesso");
        },
        onError: () => {
          toast.error("Erro ao adicionar insight");
        },
      },
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 hover:bg-foreground/10 rounded-md cursor-pointer transition-all duration-100 py-10"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <div className="flex flex-col items-center justify-center gap-2">
            {mutation.isPending ? (
              <Spinner className="size-10" />
            ) : (
              <CirclePlusIcon className="size-10" />
            )}
            Adicionar Insight
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right">
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Por Tags</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-40 overflow-y-auto">
                  {tags.map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => onClick(WidgetType.LEADS_BY_TAG, tag.id)}
                    >
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
