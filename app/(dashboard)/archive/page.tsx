import { getCurrentUser } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { ArchiveList } from "@/components/archive-list"

export default async function ArchivePage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = await createClient()
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="mt-2 text-muted-foreground">View and manage all your generated templates</p>
      </div>

      <ArchiveList templates={templates || []} />
    </div>
  )
}
