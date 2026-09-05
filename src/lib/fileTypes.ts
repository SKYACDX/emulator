// Videos are blocked outright (bandwidth/storage abuse risk on a free tier).
const BLOCKED_VIDEO_EXTENSIONS = [
  "mp4",
  "mkv",
  "avi",
  "mov",
  "webm",
  "flv",
  "wmv",
  "m4v",
  "mpg",
  "mpeg",
  "3gp",
  "ts",
  "m2ts",
  "ogv",
];

// Full game dumps are the one category this whole platform exists to avoid
// hosting (see README "Modelo legal"). Block known ROM/ISO extensions across
// consoles even in the general-purpose file section, regardless of how the
// file is named.
const BLOCKED_ROM_EXTENSIONS = [
  // Nintendo handhelds/consoles
  "nes",
  "sfc",
  "smc",
  "gb",
  "gbc",
  "gba",
  "nds",
  "srl",
  "3ds",
  "cia",
  "cci",
  "cxi",
  "n64",
  "z64",
  "v64",
  "wad",
  "wbfs",
  "rvz",
  "wud",
  "wux",
  "nsp",
  "xci",
  // Optical-disc dumps used across many other consoles
  "iso",
  "cso",
  "chd",
  "bin",
  "cue",
  "gdi",
  "cdi",
];

export const BLOCKED_UPLOAD_EXTENSIONS = [
  ...BLOCKED_VIDEO_EXTENSIONS,
  ...BLOCKED_ROM_EXTENSIONS,
];

export function getExtension(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ext !== filename.toLowerCase() ? ext : null;
}

export function isBlockedUploadExtension(filename: string): boolean {
  const ext = getExtension(filename);
  return ext !== null && BLOCKED_UPLOAD_EXTENSIONS.includes(ext);
}
