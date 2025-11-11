"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteBuyer, archiveBuyer } from "@/app/actions/manage-buyer"
import { useRouter } from "next/navigation"

interface SavedContact {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  title: string | null
  archived: boolean
  created_at: string
}

interface Props {
  contacts: SavedContact[]
  userId: string
}

export function SavedContactsList({ contacts, userId }: Props) {
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (id: string, email: string) => {
    try {
      const res = await deleteBuyer(id, userId)
      if (!res.success) {
        toast({ title: "Delete failed", description: res.error || "Unknown error", variant: "destructive" })
        return
      }
      toast({ title: "Deleted", description: `${email} removed from contacts` })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
    }
  }

  const handleArchive = async (id: string, email: string) => {
    try {
      const res = await archiveBuyer(id, userId)
      if (!res.success) {
        toast({ title: "Archive failed", description: res.error || "Unknown error", variant: "destructive" })
        return
      }
      toast({ title: "Archived", description: `${email} moved to archive` })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
    }
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No saved contacts yet. Search for buyers above to get started.
      </div>
    )
  }

  return (
    <div className="grid gap-3 max-h-[28rem] overflow-y-auto">
      {contacts.map((b) => (
        <div
          key={b.id}
          className="rounded-lg border p-4 text-sm flex items-center justify-between gap-3 bg-muted/40"
        >
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="font-medium truncate">
              {b.first_name || b.last_name ? (
                <>{b.first_name} {b.last_name}</>
              ) : (
                b.email
              )}
            </div>
            <div className="text-muted-foreground text-xs truncate">{b.company || "Company N/A"}</div>
            <div className="text-xs break-all">{b.email}</div>
            {b.title && <div className="text-xs italic text-muted-foreground truncate">{b.title}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleArchive(b.id, b.email)}
              title="Archive contact"
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => handleDelete(b.id, b.email)}
              title="Delete contact"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
