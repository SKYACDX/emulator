import type { NextConfig } from "next";

// ponytail: 'unsafe-inline' is in script-src because Next's own hydration
// bootstrap scripts are inline and Turbopack doesn't stamp them with a
// per-request nonce (tried the documented middleware+nonce pattern, built
// and tested it against a real production build — Next's scripts never
// picked up the nonce, breaking hydration entirely). That specific
// inline-script-injection defense is instead handled at the source (escape
// user content before it reaches dangerouslySetInnerHTML, e.g. the hack
// JSON-LD fix). Everything else here — no external script/frame/connect
// hosts outside the allowlist, no framing us, no arbitrary form targets —
// still holds. Revisit if Next/Turbopack ever supports nonce auto-injection.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://media.ethicalads.io https://*.google.com https://*.gstatic.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.r2.cloudflarestorage.com https://cdn.thegamesdb.net https://*.googlesyndication.com https://*.gstatic.com https://*.doubleclick.net https://*.adtrafficquality.google",
  "font-src 'self'",
  // Direct-to-R2 uploads (avatar, shared files, community post images) PUT
  // straight from the browser to a presigned R2 URL via fetch() — that's a
  // connect-src concern, not img-src, and missing it here silently broke
  // every upload flow on the site until caught.
  "connect-src 'self' https://*.r2.cloudflarestorage.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.ethicalads.io https://*.google.com https://cloudflareinsights.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.google.com https://*.adtrafficquality.google",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: CSP }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
