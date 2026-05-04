import { NextRequest, NextResponse } from "next/server";

const REF_COOKIE = "nasa_ref";
const REF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

/**
 * Middleware Edge para capturar `?ref=<code>` na rota de signup e persistir
 * em cookie httpOnly. O cookie é lido no momento do POST de signup pelo
 * formulário e enviado para `partner.attachReferralOnSignup`.
 *
 * NÃO registramos a visita aqui (lookups de DB são caros no edge runtime).
 * O log da visita é feito server-side via uma procedure pública chamada
 * pelo cliente após o cookie ser setado, ou por uma rota API leve.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const ref = url.searchParams.get("ref");

  if (!ref) return NextResponse.next();

  // Sanitiza: apenas alfanumérico, comprimento esperado (8 chars)
  const safe = ref.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  if (!safe) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set({
    name: REF_COOKIE,
    value: safe,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REF_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  // Sinaliza para o client (via header) que houve referral capturado, útil para
  // disparar o registro de visita assíncrono via fetch interno.
  res.headers.set("x-nasa-ref-captured", safe);

  return res;
}

export const config = {
  matcher: ["/sign-up", "/sign-in", "/"],
};
