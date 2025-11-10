import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getUserSearchCount } from "@/app/actions/search-buyers"
import { SNOV_SEARCH_LIMITS } from "@/lib/types"
import { SearchBuyersForm } from "@/components/search-buyers-form"

export default async function SearchBuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const searchesUsed = await getUserSearchCount((user as any).id)
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
    </div>
  )
}
