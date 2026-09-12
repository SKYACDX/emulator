// RP ID must be "emulatornds.online" (not "www.emulatornds.online") — WebAuthn
// allows an RP ID that's a registrable suffix of the actual origin, and the
// apex redirects to www anyway (see layout.tsx's metadataBase comment).
// Locally there's no real domain, so both fall back to localhost.
export const RP_NAME = "RomHack Hub";
export const RP_ID = process.env.NODE_ENV === "production" ? "emulatornds.online" : "localhost";
export const ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://www.emulatornds.online"
    : "http://localhost:3000";
