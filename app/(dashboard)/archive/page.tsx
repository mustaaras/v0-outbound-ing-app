import { getCurrentUser } from "@/lib/auth-utils"
import { getTemplatesAction } from "@/app/actions/templates"
import { ArchiveList } from "@/components/archive-list"

export default async function ArchivePage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get initial templates with pagination
  const result = await getTemplatesAction({ limit: 10, offset: 0 })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
        <p className="mt-2 text-muted-foreground">View and manage all your generated templates</p>
      </div>

      <ArchiveList initialTemplates={result.templates || []} initialTotal={result.total || 0} />
    </div>
  )
}
