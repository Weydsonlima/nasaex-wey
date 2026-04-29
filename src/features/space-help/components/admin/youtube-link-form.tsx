"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import { toast } from "sonner";

interface Props {
  target: "feature" | "lesson";
  id: string;
  currentUrl: string | null;
  onSaved?: () => void;
}

export function YoutubeLinkForm({ target, id, currentUrl, onSaved }: Props) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const mut = useMutation({
    ...orpc.spaceHelp.setYoutubeUrl.mutationOptions(),
    onSuccess: () => {
      toast.success("Link do YouTube atualizado");
      onSaved?.();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  return (
    <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
        <Youtube className="size-4" />
        Modo Moderador — link YouTube
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1"
        />
        <Button
          onClick={() => mut.mutate({ target, id, youtubeUrl: url })}
          disabled={mut.isPending}
        >
          Salvar
        </Button>
        {currentUrl && (
          <Button
            variant="outline"
            onClick={() => {
              setUrl("");
              mut.mutate({ target, id, youtubeUrl: "" });
            }}
            disabled={mut.isPending}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
