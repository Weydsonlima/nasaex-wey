"use client";

import { useState } from "react";
import {
  PaperclipIcon,
  DownloadIcon,
  XIcon,
  PlusIcon,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Uploader } from "@/components/file-uploader/uploader";
import { handleDownload, handleOpen } from "@/utils/handle-files";
import { useConstructUrl } from "@/hooks/use-construct-url";

interface Attachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface Props {
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => void;
  onRemove?: (url: string) => void;
  disabled?: boolean;
}

export function AttachmentsSection({
  attachments = [],
  onUpdate,
  onRemove,
  disabled,
}: Props) {
  const [adding, setAdding] = useState(false);
  const handleAdd = (url: string) => {
    if (!url) return;
    const name = url.split("/").pop() ?? "Arquivo";
    onUpdate([...attachments, { name, url }]);
    setAdding(false);
  };

  // const handleRemove = (url: string) => {
  //   onRemove(url);
  // };
  const handleRemove = (url: string) => {
    onUpdate(attachments.filter((att) => att.url !== url));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <PaperclipIcon className="size-3.5" />
          Anexos
        </span>
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setAdding(true)}
            disabled={disabled}
          >
            <PlusIcon className="size-3 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-md border bg-background text-sm group"
            >
              <PaperclipIcon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-xs">{att.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-5"
                  onClick={() => handleOpen(useConstructUrl(att.url))}
                >
                  <EyeIcon className="size-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-5"
                  onClick={() =>
                    handleDownload(useConstructUrl(att.url), att.name)
                  }
                >
                  <DownloadIcon className="size-3" />
                </Button>

                {!disabled && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-5 text-destructive"
                    onClick={() => handleRemove(att.url)}
                  >
                    <XIcon className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="border rounded-md p-3 bg-muted/40 space-y-2">
          <Uploader
            value=""
            onConfirm={(url) => handleAdd(url || "")}
            fileTypeAccepted="outros"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => setAdding(false)}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
