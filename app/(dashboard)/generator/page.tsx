export const dynamic = "force-dynamic"

import { GeneratorForm } from "@/components/generator-form"
import { getCurrentUser, getUserUsage } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { TIER_LIMITS } from "@/lib/types"
import type { User } from "@/lib/types"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import Link from "next/link"
import { errorLog } from "@/lib/logger"

export default async function GeneratorPage() {
  let user: User | null = null
  let strategies = []
  let usage = 0

  try {
    user = await getCurrentUser()

    if (!user) {
      redirect("/auth/login")
      return null
    }

    const supabase = await createClient()

    const { data: strategiesData, error: strategiesError } = await supabase
      .from("strategies")
      .select("*")
      .order("tier", { ascending: true })
      .order("name", { ascending: true })

    if (strategiesError) {
      errorLog("Error fetching strategies:", strategiesError)
    }

    strategies = Array.isArray(strategiesData) ? strategiesData.filter((s) => s && typeof s.tier !== "undefined") : []

    usage = await getUserUsage(user.id)
  } catch (error) {
     errorLog("Error in GeneratorPage:", error)
  }

  if (!user) return null

  const limit = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS] || 5
  const canGenerate = usage < limit

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Generator</h1>
          <p className="mt-2 text-muted-foreground">AI-powered professional outreach emails in seconds</p>
        </div>
      </div>

      <div>
        {user.tier !== "pro" && (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Monthly Usage</div>
                <div className="text-2xl font-bold">
                  {usage} / {limit}
                </div>
              </div>
              {user.tier === "free" && !canGenerate && (
                <Button asChild>
                  <Link href="/upgrade">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {strategies.length === 0 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm">
          <p className="font-medium">No strategies available</p>
          <p className="text-muted-foreground mt-1">
            Strategies are being loaded. Please refresh the page in a moment.
          </p>
        </div>
      )}

      <GeneratorForm
        user={user}
        usage={usage}
        strategies={strategies}
        userTier={user.tier}
        userId={user.id}
        canGenerate={canGenerate}
      />
    </div>
  )
}
