// AdSense requires an ads.txt at the site root listing the publisher id.
// Generated dynamically so it starts working the moment ADSENSE_CLIENT_ID
// is set, without needing a manual file edit + redeploy.
export async function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!client) {
    return new Response("", { status: 404 });
  }

  // AdSense gives you "ca-pub-XXXXXXXXXXXXXXXX"; ads.txt wants "pub-XXXX...".
  const pubId = client.replace(/^ca-/, "");

  return new Response(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain" },
  });
}
