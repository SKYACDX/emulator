import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { RP_ID } from "@/lib/webauthn";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!(await checkRateLimit(`passkey-login-options:${clientIp(request)}`, 20, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados intentos, espera unos minutos" }, { status: 429 });
  }

  // No allowCredentials — usernameless/discoverable login, the browser
  // shows whichever passkeys it has for this site and identifies the user
  // by credential ID at verify time.
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
  });

  const cookieStore = await cookies();
  cookieStore.set("passkey_login_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return NextResponse.json(options);
}
