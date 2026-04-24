import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { PublicPageRenderer } from "@/features/pages/components/public/public-page-renderer";
import type { PageLayout } from "@/features/pages/types";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

interface Params {
  id: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await prisma.nasaPage.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: page ? `Prévia — ${page.title}` : "Prévia" };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const page = await prisma.nasaPage.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      layout: true,
      palette: true,
      fontFamily: true,
    },
  });

  if (!page || !page.layout) notFound();

  return (
    <>
      {/* Barra flutuante de preview */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 16px",
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Link
          href={`/pages/${id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#94a3b8",
            textDecoration: "none",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <ArrowLeft size={14} />
          Voltar ao editor
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          <Eye size={13} />
          <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{page.title}</span>
          <span
            style={{
              background: "rgba(139,92,246,0.2)",
              color: "#a78bfa",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "4px",
              padding: "1px 7px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Rascunho
          </span>
        </div>
      </div>

      {/* Espaço para a barra não cobrir conteúdo */}
      <div style={{ paddingTop: "41px" }}>
        <PublicPageRenderer
          layout={page.layout as unknown as PageLayout}
          palette={(page.palette as Record<string, string>) ?? {}}
          fontFamily={page.fontFamily}
        />
      </div>
    </>
  );
}
