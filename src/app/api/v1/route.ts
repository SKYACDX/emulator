import { corsJson, corsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return corsJson({
    name: "RomHack Hub API",
    version: "1.0",
    description:
      "API pública de solo lectura. Sirve únicamente archivos de parche " +
      "(IPS/BPS/UPS/xdelta), nunca ROMs. Aplica el parche del lado del " +
      "cliente sobre tu propia copia legal del juego.",
    endpoints: {
      platforms: `${origin}/api/v1/platforms`,
      games: `${origin}/api/v1/games?platform=<slug>&q=<texto>&limit=&offset=`,
      hacks: `${origin}/api/v1/hacks?game=<slug>&platform=<slug>&q=<texto>&limit=&offset=`,
      hackDetail: `${origin}/api/v1/hacks/<slug>`,
      patchDownload: `${origin}/api/patches/<id>/download`,
      files: `${origin}/api/v1/files?platform=<slug>&q=<texto>&limit=&offset=`,
      fileDetail: `${origin}/api/v1/files/<id>`,
      fileDownload: `${origin}/api/files/<id>/download`,
    },
    accountLinking: {
      description:
        "Endpoints autenticados con Bearer token (no cookies) para que la " +
        "app del emulador vincule la cuenta del usuario y sincronice sus " +
        "partidas guardadas en la nube.",
      login: `${origin}/api/auth/token`,
      loginVerifyTotp: `${origin}/api/auth/token/verify`,
      savesPresign: `${origin}/api/saves/presign`,
      savesCreate: `${origin}/api/saves`,
      savesList: `${origin}/api/saves`,
      saveDownload: `${origin}/api/saves/<id>/download`,
      saveDelete: `${origin}/api/saves/<id>`,
    },
  });
}
