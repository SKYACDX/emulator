import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchGameCovers } from "@/lib/thegamesdb";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const platform = searchParams.get("platform")?.trim() || undefined;

  if (!q) {
    return NextResponse.json({ error: "Falta el nombre del juego" }, { status: 400 });
  }

  try {
    const results = await searchGameCovers(q, platform);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "No se pudo buscar la portada, intenta de nuevo" },
      { status: 502 }
    );
  }
}
