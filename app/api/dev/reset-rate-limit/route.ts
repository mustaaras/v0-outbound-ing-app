"use server"

import { NextResponse } from "next/server"
import { getClientIP, resetRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 })
    }

    const ip = getClientIP(request as any as any)
    // clear only this IP's rate limit by default
    const result = resetRateLimit(ip)

    return NextResponse.json({ success: true, result })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
