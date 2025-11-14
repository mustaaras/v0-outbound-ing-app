import { NextResponse } from "next/server"

// The server-side callback previously attempted a server-side PKCE exchange, which fails
// when the PKCE code verifier is stored in client-side storage. We now redirect to a
// client-side callback page that completes the PKCE flow in the browser.
export async function GET(request: Request) {
  // Build an absolute URL to satisfy NextResponse.redirect requirements.
  const redirectUrl = new URL("/auth/callback/client", request.url)
  return NextResponse.redirect(redirectUrl)
}
