import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { getUserSavedContacts } from "@/lib/contacts-db"
import { errorLog } from "@/lib/logger"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const contacts = await getUserSavedContacts(user.id, { limit: 200 })

    return NextResponse.json({ success: true, contacts })
  } catch (error) {
    errorLog("[v0] Error fetching saved contacts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
