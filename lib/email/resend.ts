import "server-only"

import { Resend } from "resend"

let _resend: Resend | null = null

export function getResend() {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error("Resend API key is not configured (RESEND_API_KEY)")
  }
  _resend = new Resend(key)
  return _resend
}

export default getResend
