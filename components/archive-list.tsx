"use client"

import { useState, useEffect } from "react"
import type { Template } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Search, Copy, Trash2, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deleteTemplate } from "@/app/actions/delete-template"
import { getTemplatesAction } from "@/app/actions/templates"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ArchiveListProps {
  initialTemplates: Template[]
  initialTotal: number
}

export function ArchiveList({ initialTemplates, initialTotal }: ArchiveListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [totalTemplates, setTotalTemplates] = useState(initialTotal)
  const [searchQuery, setSearchQuery] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadTemplates()
  }, [pageSize, currentPage, searchQuery])

  async function loadTemplates() {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const result = await getTemplatesAction({
        limit: pageSize,
        offset: offset,
        search: searchQuery || undefined,
      })

      if (result.success) {
        setTemplates(result.templates)
        setTotalTemplates(result.total)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load templates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
  description: "Email copied to clipboard",
    })
  }

  const handleOpenEmail = (template: Template) => {
    if (!template.recipient_email) {
      toast({
        title: "No recipient email",
  description: "This email doesn't have a recipient email",
        variant: "destructive",
      })
      return
    }

    const mailtoSubject = template.subject
    const mailtoBody = template.result_text

    // Create mailto URL with both subject and body
    const mailtoUrl = `mailto:${template.recipient_email}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`

    // Check URL length - mailto has practical limits around 2000-8000 chars depending on browser/OS
    if (mailtoUrl.length > 2000) {
      // If too long, just use subject and copy body to clipboard
      const shortMailtoUrl = `mailto:${template.recipient_email}?subject=${encodeURIComponent(mailtoSubject)}`
      navigator.clipboard.writeText(template.result_text)
      window.location.href = shortMailtoUrl

      toast({
        title: "Email client opened",
        description: "Email was too long for direct insert. Content copied - paste it into the message body.",
      })
    } else {
      // URL is short enough, include everything
      window.location.href = mailtoUrl

      toast({
        title: "Email ready to send",
        description: "Your email client opened with the message pre-filled.",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      await deleteTemplate(id)
      toast({
        title: "Deleted",
        description: "Template deleted successfully",
      })
      // Reload templates after deletion
      loadTemplates()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  if (initialTotal === 0 && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start generating cold outreach templates to see them appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by subject, recipient, category, or content..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {totalTemplates > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalTemplates)} of ${totalTemplates}` : '0 templates'}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * pageSize >= totalTemplates || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </CardContent>
        </Card>
      ) : templates.length === 0 && searchQuery ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No templates found matching your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.subject}</h3>
                    {template.category && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{template.category}</span>
                    )}
                  </div>
                  {template.recipient && <p className="text-sm text-muted-foreground">To: {template.recipient}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(template.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(template.result_text)}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                  {template.recipient_email && (
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEmail(template)}>
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Open Email</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4">
                  <pre className="whitespace-pre-wrap text-sm font-sans">{template.result_text}</pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
