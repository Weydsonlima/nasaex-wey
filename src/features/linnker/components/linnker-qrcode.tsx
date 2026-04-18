"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import type { LinnkerPage } from "../types";

interface Props {
  page: LinnkerPage;
}

export function LinnkerQRCode({ page }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/l/${page.slug}`
      : `/l/${page.slug}`;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // Converte para PNG via canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `linnker-${page.slug}.png`;
        a.click();
        toast.success("QR Code baixado!");
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6 p-6 border rounded-xl bg-muted/20">
        <div ref={qrRef} className="p-4 bg-white rounded-xl shadow-sm">
          <QRCodeSVG
            value={publicUrl}
            size={220}
            fgColor={page.coverColor}
            bgColor="#ffffff"
            level="M"
            includeMargin
          />
        </div>

        <div className="text-center">
          <p className="font-semibold">{page.title}</p>
          <p className="text-sm text-muted-foreground">{publicUrl}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={copyUrl}>
            <Copy className="size-4 mr-2" /> Copiar link
          </Button>
          <Button onClick={downloadQR}>
            <Download className="size-4 mr-2" /> Baixar QR Code
          </Button>
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <QrCode className="size-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Captura automática de leads</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando alguém escaneia este QR Code e abre sua página Linnker, os dados
              são capturados. Se a pessoa preencher nome, e-mail ou telefone em qualquer
              link de formulário vinculado, um lead é criado automaticamente no seu Tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
