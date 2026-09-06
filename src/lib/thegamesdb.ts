// TheGamesDB platform IDs for the consoles this app supports, resolved once
// against the live /Platforms endpoint (see project notes) rather than
// guessed, since TGDB ids don't line up with any obvious pattern.
const TGDB_PLATFORM_IDS: Record<string, number> = {
  nes: 7,
  snes: 6,
  n64: 3,
  gb: 4,
  gbc: 41,
  gba: 5,
  nds: 8,
  "3ds": 4912,
  switch: 4971,
};

/** Only ever accept cover URLs pointing at TheGamesDB's own CDN. */
export function isAllowedCoverUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "cdn.thegamesdb.net";
  } catch {
    return false;
  }
}

function apiKey(): string {
  const key = process.env.TGDB_API_KEY;
  if (!key) throw new Error("TGDB_API_KEY is not set");
  return key;
}

export type GameCoverResult = {
  id: number;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
};

/**
 * Searches TheGamesDB for games matching `name` (optionally narrowed to one
 * of our platforms) and returns each match's front box art thumbnail URL,
 * if it has one. We only ever store/link the returned URL — the image
 * itself stays hosted on TheGamesDB's CDN.
 */
export async function searchGameCovers(
  name: string,
  platformSlug?: string
): Promise<GameCoverResult[]> {
  const params = new URLSearchParams({
    apikey: apiKey(),
    name,
    include: "boxart",
  });
  const platformId = platformSlug ? TGDB_PLATFORM_IDS[platformSlug] : undefined;
  if (platformId) {
    params.set("filter[platform]", String(platformId));
  }

  const res = await fetch(`https://api.thegamesdb.net/v1/Games/ByGameName?${params}`);
  if (!res.ok) {
    throw new Error(`TheGamesDB search failed: ${res.status}`);
  }
  const json = await res.json();

  const games: Array<{ id: number; game_title: string; release_date: string | null }> =
    json?.data?.games ?? [];
  const boxart: {
    base_url?: { thumb?: string };
    data?: Record<string, Array<{ side: string; filename: string }>>;
  } = json?.include?.boxart ?? {};

  const thumbBase = boxart.base_url?.thumb;

  return games.slice(0, 20).map((game) => {
    const images = boxart.data?.[String(game.id)] ?? [];
    const front = images.find((img) => img.side === "front");
    const coverUrl = thumbBase && front ? `${thumbBase}${front.filename}` : null;
    return {
      id: game.id,
      title: game.game_title,
      releaseDate: game.release_date,
      coverUrl,
    };
  });
}
