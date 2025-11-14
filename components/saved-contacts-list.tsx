"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Archive, CheckSquare, Square, X, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteBuyer, archiveBuyer, bulkArchiveBuyers, bulkDeleteBuyers, unarchiveBuyer } from "@/app/actions/manage-buyer"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  isArchivedView?: boolean
}

export function SavedContactsList({ contacts, userId, isArchivedView }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const allSelected = selected.size > 0 && contacts.every((c) => selected.has(c.id))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === contacts.length) return new Set()
      return new Set(contacts.map((c) => c.id))
    })
  }

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

  const handleUnarchive = async (id: string, email: string) => {
    try {
      const res = await unarchiveBuyer(id, userId)
      if (!res.success) {
        toast({ title: "Unarchive failed", description: res.error || "Unknown error", variant: "destructive" })
        return
      }
      toast({ title: "Unarchived", description: `${email} moved back to contacts` })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
    }
  }

  const handleSend = (contact: SavedContact) => {
    const name = `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email.split("@")[0]
    sessionStorage.setItem(
      "selectedBuyer",
      JSON.stringify({
        name,
        email: contact.email,
        company: contact.company || undefined,
        title: contact.title || undefined,
      }),
    )
    window.open("/generator", "_blank")
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No saved contacts yet. Search for buyers above to get started.
      </div>
    )
  }

  const handleBulkArchive = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const res = await bulkArchiveBuyers(ids, userId)
    if (!res.success) {
      toast({ title: "Bulk archive failed", description: res.error || "Unknown error", variant: "destructive" })
      return
    }
    toast({ title: "Archived", description: `${res.count} contact(s) archived` })
    setSelected(new Set())
    router.refresh()
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const res = await bulkDeleteBuyers(ids, userId)
    if (!res.success) {
      toast({ title: "Bulk delete failed", description: res.error || "Unknown error", variant: "destructive" })
      return
    }
    toast({ title: "Deleted", description: `${res.count} contact(s) removed` })
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 max-h-[28rem]">
      <div className="flex items-center justify-between text-xs py-1 px-1 border rounded-md bg-muted/40">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} title={allSelected ? "Clear selection" : "Select all"}>
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </Button>
          <span className="text-muted-foreground">{selected.size} selected</span>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleBulkArchive} title="Archive selected">
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" title="Delete selected">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete selected contacts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selected.size} contact(s).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} title="Clear selection">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="grid gap-3 overflow-y-auto pr-1">
      {contacts.map((b) => (
        <div
          key={b.id}
          className={`rounded-lg border p-3 text-sm flex items-center justify-between gap-3 bg-muted/40 ${selected.has(b.id) ? 'ring-2 ring-primary' : ''}`}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Checkbox checked={selected.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} />
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
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSend(b)}
              title="Send email"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            {isArchivedView ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnarchive(b.id, b.email)}
                title="Unarchive contact"
              >
                <Archive className="h-3.5 w-3.5 rotate-180" />
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleArchive(b.id, b.email)}
                title="Archive contact"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
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
    </div>
  )
}
