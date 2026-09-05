import { PatchFormat } from "@/generated/prisma/client";

const EXTENSION_TO_FORMAT: Record<string, PatchFormat> = {
  ips: PatchFormat.IPS,
  bps: PatchFormat.BPS,
  ups: PatchFormat.UPS,
  xdelta: PatchFormat.XDELTA,
};

export function formatFromFilename(filename: string): PatchFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

export const ALLOWED_PATCH_EXTENSIONS = Object.keys(EXTENSION_TO_FORMAT);

export function formatLabel(format: PatchFormat): string {
  switch (format) {
    case PatchFormat.IPS:
      return "IPS";
    case PatchFormat.BPS:
      return "BPS";
    case PatchFormat.UPS:
      return "UPS";
    case PatchFormat.XDELTA:
      return "xdelta (VCDIFF)";
  }
}
