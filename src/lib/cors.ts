import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type CorsJsonInit = ResponseInit & {
  /**
   * Whether to let CDNs/clients cache this response for a short time.
   * Defaults to true for 2xx responses; error responses should pass false.
   */
  cache?: boolean;
};

export function corsJson(data: unknown, init?: CorsJsonInit): NextResponse {
  const status = init?.status ?? 200;
  const shouldCache = init?.cache ?? (status >= 200 && status < 300);

  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": shouldCache
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Parses `limit`/`offset` query params with sane, clamped defaults. */
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 20, maxLimit = 50 } = {}
): { limit: number; offset: number } {
  const rawLimit = Number(searchParams.get("limit"));
  const rawOffset = Number(searchParams.get("offset"));

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : defaultLimit;
  const offset =
    Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  return { limit, offset };
}
