import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { LocationSearchForm } from "@/components/location-search-form"
import { MapPin } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SearchBuyersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

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
        <LocationSearchForm userId={(user as any).id} />
      </div>
    </div>
  )
}
