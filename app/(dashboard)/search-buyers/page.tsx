import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LocationSearchForm } from "@/components/location-search-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin } from "lucide-react"
import { SavedContactsList } from "@/components/saved-contacts-list"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SearchBuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

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

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location-Based Business Search
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Find businesses in any city worldwide using Google Maps. Results will be processed for contact information.
          </p>
        </div>
        <LocationSearchForm />
      </div>

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
