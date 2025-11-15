import { getCurrentUser, getUserUsage } from "@/lib/auth-utils"
import { validateLocationSearchAccess } from "@/app/actions/location-search"
import { createClient } from "@/lib/supabase/server"
import { TIER_LIMITS } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Archive, Crown, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = await createClient()

  // Get usage stats
  const usage = await getUserUsage(user.id)
  const limit = TIER_LIMITS[user.tier]
  const remaining = limit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, limit - usage)
  const usagePercentage = limit === Number.POSITIVE_INFINITY ? 0 : (usage / limit) * 100

  // Get total templates count
  const { count: totalTemplates } = await supabase
    .from("templates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get recent templates
  const { data: recentTemplates } = await supabase
    .from("templates")
    .select("*, strategies(name, category)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  // Get remaining location/search access (optional)
  let locationAccess: { canSearch?: boolean; tier?: string; remainingSearches?: number } | null = null
  try {
    locationAccess = await validateLocationSearchAccess()
  } catch (err) {
    // ignore errors — this is optional UI
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.tier === "pro" ? (
                <>∞ Unlimited</>
              ) : (
                <>{usage} / {limit === Number.POSITIVE_INFINITY ? "∞" : limit}</>
              )}
            </div>
            {user.tier !== "pro" && (
              <>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {limit === Number.POSITIVE_INFINITY
                    ? "Unlimited generations"
                    : `${remaining} generation${remaining !== 1 ? "s" : ""} remaining`}
                </p>
                {/* Location/search remaining (if available) */}
                {locationAccess?.remainingSearches !== undefined && (
                  (() => {
                    const rem = locationAccess.remainingSearches as number
                    // choose color: green when plenty (>5), amber when low (1-5), red when 0
                    const badgeClass = rem === 0
                      ? 'bg-red-50 text-red-700'
                      : rem <= 5
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'

                    return (
                      <div className="mt-3">
                        <Badge className={`flex items-center gap-2 px-2 py-1 text-xs ${badgeClass}`}>
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">{rem}</span>
                          <span className="text-muted-foreground">search{rem !== 1 ? 'es' : ''} left</span>
                        </Badge>
                      </div>
                    )
                  })()
                )}
              </>
            )}
            {user.tier === "pro" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Generate as many emails as you need
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates || 0}</div>
            <p className="mt-2 text-xs text-muted-foreground">All time generated emails</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Account Tier</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.tier}</div>
            {user.tier === "free" && (
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                <Link href="/upgrade">Upgrade to Pro →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTemplates || recentTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No emails yet. Generate your first one!</p>
          ) : (
            <div className="space-y-3">
              {recentTemplates.map((template) => (
                <div key={template.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="space-y-1 flex-1">
                    <div className="font-medium text-sm line-clamp-1">{template.subject || "Untitled"}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                      {template.strategies && (
                        <>
                          <span>•</span>
                          <span className="line-clamp-1">{template.strategies.name}</span>
                          {template.strategies.category && (
                            <>
                              <span>•</span>
                              <span>{template.strategies.category}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentTemplates && recentTemplates.length > 0 && (
            <Button asChild variant="link" className="mt-4 h-auto p-0 text-sm">
              <Link href="/archive">View all →</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
