import { getCurrentUser } from "@/lib/auth-utils"
import { NextResponse } from "next/server"
import { errorLog } from "@/lib/logger"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      tier: user.tier,
      stripe_customer_id: user.stripe_customer_id,
    })
  } catch (error) {
    errorLog("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
