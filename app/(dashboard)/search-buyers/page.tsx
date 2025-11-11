import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getUserSearchCount } from "@/app/actions/search-buyers"
import { createClient } from "@/lib/supabase/server"
import { SNOV_SEARCH_LIMITS } from "@/lib/types"
import { SearchBuyersForm } from "@/components/search-buyers-form"
import { PublicEmailFinderForm } from "@/components/public-email-finder-form"

export default async function SearchBuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const searchesUsed = await getUserSearchCount((user as any).id)
  // Fetch saved buyers for display
  const supabase = await createClient()
  const { data: savedBuyers } = await supabase
    .from("saved_buyers")
    .select("id, email, first_name, last_name, company, title")
    .eq("user_id", (user as any).id)
    .order("created_at", { ascending: false })
  const searchLimit = SNOV_SEARCH_LIMITS[user!.tier as keyof typeof SNOV_SEARCH_LIMITS] || 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Buyers</h1>
          <p className="mt-2 text-muted-foreground">Find buyer prospects and add them directly into your template.</p>
        </div>
      </div>

      <SearchBuyersForm
        userId={(user as any).id}
        userTier={(user as any).tier}
        searchesUsed={searchesUsed}
        searchLimit={searchLimit}
      />

      <PublicEmailFinderForm userId={(user as any).id} />

      {savedBuyers && savedBuyers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Saved Contacts</h2>
          <div className="grid gap-3 max-h-[28rem] overflow-y-auto">
            {savedBuyers.map((b) => (
              <div
                key={b.id}
                className="rounded-lg border p-4 text-sm flex flex-col gap-1 bg-muted/40"
              >
                <div className="font-medium">
                  {b.first_name || b.last_name ? (
                    <>{b.first_name} {b.last_name}</>
                  ) : (
                    b.email
                  )}
                </div>
                <div className="text-muted-foreground text-xs">{b.company || "Company N/A"}</div>
                <div className="text-xs break-all">{b.email}</div>
                {b.title && <div className="text-xs italic text-muted-foreground">{b.title}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
