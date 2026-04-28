import Link from "next/link";
import Image from "next/image";

/**
 * Footer público reutilizável — presente em /calendario, /space/*,
 * /s/*, /station/*. Converte o conteúdo em um grid 4-colunas no
 * desktop e coluna única no mobile.
 */
export function NasaFooterPublic() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-nasa.svg"
              alt="N.A.S.A"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-bold">NASAEX</span>
          </div>
          <p className="text-xs text-white/60">
            © {year} NASAEX Inc. Todos os direitos reservados.
          </p>
        </div>

        <nav aria-labelledby="footer-platform">
          <h4
            id="footer-platform"
            className="mb-3 text-sm font-semibold text-white"
          >
            Plataforma
          </h4>
          <ul className="space-y-2 text-xs text-white/60">
            <li>
              <Link
                href="/"
                className="transition hover:text-white"
              >
                Nossa Space
              </Link>
            </li>
            <li>
              <Link
                href="/sign-up"
                className="transition hover:text-white"
              >
                Criar conta
              </Link>
            </li>
            <li>
              <Link
                href="/calendario"
                className="transition hover:text-white"
              >
                Calendário público
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal">
          <h4
            id="footer-legal"
            className="mb-3 text-sm font-semibold text-white"
          >
            Legal
          </h4>
          <ul className="space-y-2 text-xs text-white/60">
            <li>
              <Link
                href="/termos"
                className="transition hover:text-white"
              >
                Termos de uso
              </Link>
            </li>
            <li>
              <Link
                href="/privacidade"
                className="transition hover:text-white"
              >
                Política de Privacidade
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">
            Siga a gente
          </h4>
          <div className="flex gap-3 text-xs text-white/60">
            <a
              href="https://instagram.com/nasaagents"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com/company/nasaagents"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/nasaagents"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white"
            >
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
