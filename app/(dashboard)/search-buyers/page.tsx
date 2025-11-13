import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getUserSearchCount } from "@/app/actions/search-buyers"
import { getPublicEmailSearchCount } from "@/app/actions/public-email-finder"
import { createClient } from "@/lib/supabase/server"
import { SNOV_SEARCH_LIMITS, PUBLIC_EMAIL_SEARCH_LIMITS } from "@/lib/types"
import { SearchContactsForm } from "@/components/search-buyers-form"
import { PublicEmailFinderForm } from "@/components/public-email-finder-form"
import { LocationSearchForm } from "@/components/location-search-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Globe, MapPin } from "lucide-react"
import { SavedContactsList } from "@/components/saved-contacts-list"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SearchBuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const searchesUsed = await getUserSearchCount((user as any).id)
  const publicEmailSearchesUsed = await getPublicEmailSearchCount((user as any).id)
  // Fetch saved buyers for display (exclude archived by default)
  const supabase = await createClient()
  const { data: savedBuyers } = await supabase
    .from("saved_buyers")
    .select("id, email, first_name, last_name, company, title, archived, created_at")
    .eq("user_id", (user as any).id)
    .eq("archived", false)
    .order("created_at", { ascending: false })
  const { data: archivedBuyers } = await supabase
    .from("saved_buyers")
    .select("id, email, first_name, last_name, company, title, archived, created_at")
    .eq("user_id", (user as any).id)
    .eq("archived", true)
    .order("created_at", { ascending: false })
  const userTier = (user as any).tier === "ultra" ? "pro" : (user as any).tier
  const searchLimit = SNOV_SEARCH_LIMITS[userTier as keyof typeof SNOV_SEARCH_LIMITS] || 0
  const publicEmailSearchLimit = PUBLIC_EMAIL_SEARCH_LIMITS[userTier as keyof typeof PUBLIC_EMAIL_SEARCH_LIMITS] || 30

  // Domain summary for active contacts
  const domainSummary = (savedBuyers || []).reduce<Record<string, number>>((acc, c: any) => {
    const domain = (c?.email?.split("@")[1] || "").toLowerCase()
    if (!domain) return acc
    acc[domain] = (acc[domain] || 0) + 1
    return acc
  }, {})
  const uniqueDomainCount = Object.keys(domainSummary).length

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Contacts</h1>
          <p className="mt-2 text-muted-foreground">Find contact prospects and add them directly into your email generator.</p>
        </div>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api">
            <Building2 className="mr-2 h-4 w-4" />
            Verified Contacts
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="mr-2 h-4 w-4" />
            Location Search
          </TabsTrigger>
          <TabsTrigger value="public">
            <Globe className="mr-2 h-4 w-4" />
            Email Finder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6 mt-6">
          <SearchContactsForm
            userId={(user as any).id}
            userTier={(user as any).tier}
            searchesUsed={searchesUsed}
            searchLimit={searchLimit}
          />
        </TabsContent>

        <TabsContent value="location" className="space-y-6 mt-6">
          <LocationSearchForm />
        </TabsContent>

        <TabsContent value="public" className="space-y-6 mt-6">
          <PublicEmailFinderForm
            userId={(user as any).id}
            userTier={(user as any).tier}
            searchesUsed={publicEmailSearchesUsed}
            searchLimit={publicEmailSearchLimit}
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Contacts</h2>
          <div className="text-sm text-muted-foreground">
            {(savedBuyers?.length || 0) + (archivedBuyers?.length || 0)} total · {uniqueDomainCount} domains
          </div>
        </div>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {savedBuyers && savedBuyers.length > 0 ? (
              <SavedContactsList contacts={savedBuyers as any} userId={(user as any).id} />
            ) : (
              <div className="text-sm text-muted-foreground py-4">No active contacts.</div>
            )}
          </TabsContent>
          <TabsContent value="archived">
            {archivedBuyers && archivedBuyers.length > 0 ? (
              <SavedContactsList contacts={archivedBuyers as any} userId={(user as any).id} isArchivedView />
            ) : (
              <div className="text-sm text-muted-foreground py-4">No archived contacts.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
