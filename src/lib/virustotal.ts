// VirusTotal integration for the /files upload flow. Free-tier limits that
// shape this design: ~4 requests/min, and the direct /files upload endpoint
// caps at 32MB (bigger files need a separate upload-URL flow we don't use
// here — see maxScannableSizeBytes()).

const API_BASE = "https://www.virustotal.com/api/v3";

export type ScanVerdict = "clean" | "malicious" | "pending" | "error" | "skipped";

function apiKey(): string | null {
  return process.env.VIRUSTOTAL_API_KEY || null;
}

export function virusScanningEnabled(): boolean {
  return !!apiKey();
}

export function maxScannableSizeBytes(): number {
  return 32_000_000; // VirusTotal free-tier direct upload cap
}

function headers(): HeadersInit {
  return { "x-apikey": apiKey()! };
}

type AnalysisStats = {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
};

function verdictFromStats(stats: AnalysisStats): "clean" | "malicious" {
  return stats.malicious > 0 || stats.suspicious > 1 ? "malicious" : "clean";
}

/** Looks up a file VirusTotal has already scanned before, by its SHA-256. */
async function lookupByHash(
  sha256: string
): Promise<{ verdict: "clean" | "malicious"; stats: AnalysisStats } | null> {
  const res = await fetch(`${API_BASE}/files/${sha256}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`VirusTotal lookup failed: ${res.status}`);

  const json = await res.json();
  const stats: AnalysisStats = json.data.attributes.last_analysis_stats;
  return { verdict: verdictFromStats(stats), stats };
}

async function pollAnalysis(
  analysisId: string,
  { attempts = 4, delayMs = 3000 } = {}
): Promise<{ verdict: "clean" | "malicious"; stats: AnalysisStats } | null> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetch(`${API_BASE}/analyses/${analysisId}`, { headers: headers() });
    if (!res.ok) continue;
    const json = await res.json();
    const status = json.data.attributes.status;
    if (status === "completed") {
      const stats: AnalysisStats = json.data.attributes.stats;
      return { verdict: verdictFromStats(stats), stats };
    }
  }
  return null; // still queued after our budget — treated as "pending"
}

async function submitForScan(
  buffer: Buffer,
  filename: string
): Promise<{ verdict: "clean" | "malicious" | "pending"; stats?: AnalysisStats }> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(buffer)]), filename);

  const res = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: headers(),
    body: formData,
  });
  if (!res.ok) throw new Error(`VirusTotal upload failed: ${res.status}`);

  const json = await res.json();
  const analysisId = json.data.id;

  const result = await pollAnalysis(analysisId);
  if (!result) return { verdict: "pending" };
  return result;
}

/**
 * Scans a file buffer against VirusTotal. Never throws — a scanning
 * failure (network error, quota, oversized file) degrades to "error" or
 * "skipped" rather than blocking the whole upload flow, since this is a
 * defense-in-depth layer on top of the extension blocklist and community
 * reports, not the only line of defense.
 */
export async function scanFile(
  buffer: Buffer,
  sha256: string,
  filename: string
): Promise<ScanVerdict> {
  if (!virusScanningEnabled()) return "skipped";
  if (buffer.byteLength > maxScannableSizeBytes()) return "skipped";

  try {
    const known = await lookupByHash(sha256);
    if (known) return known.verdict;

    const submitted = await submitForScan(buffer, filename);
    return submitted.verdict;
  } catch {
    return "error";
  }
}
