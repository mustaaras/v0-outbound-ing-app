"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Globe, Mail, Link as LinkIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { findPublicEmails } from "@/app/actions/public-email-finder"
import { saveBuyer } from "@/app/actions/save-buyer"

interface Props {
  userId: string
}

export function PublicEmailFinderForm({ userId }: Props) {
  const { toast } = useToast()
  const [keyword, setKeyword] = useState("")
  const [domains, setDomains] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Array<{ domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }>>([])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResults([])
    try {
      const res = await findPublicEmails({ userId, keyword: keyword || undefined, domains: domains || undefined })
      if (!res.success) {
        toast({ title: "Search failed", description: res.error || "Unknown error", variant: "destructive" })
        return
      }
      setResults(res.data.results)
      toast({ title: "Completed", description: `Found ${res.data.results.length} emails from public pages.` })
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const onSave = async (domain: string, email: string) => {
    try {
      const res = await saveBuyer({ userId, buyer: { email, first_name: null as any, last_name: null as any, company: domain, title: "Public email" } })
      if (!res.success) {
        toast({ title: "Could not save", description: res.error || "", variant: "destructive" })
      } else {
        toast({ title: "Saved", description: `${email} stored in contacts` })
      }
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Email Finder (beta)</CardTitle>
        <CardDescription>
          Extract publicly listed emails from company websites. We don’t use third-party APIs here. Results are unverified and sourced from visible pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pef-keyword">Keyword (optional)</Label>
              <Input id="pef-keyword" placeholder="e.g., affiliate" value={keyword} onChange={(e) => setKeyword(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pef-domains">Domains (comma or newline)</Label>
              <Input id="pef-domains" placeholder="acme.com, example.com" value={domains} onChange={(e) => setDomains(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Searching...</>) : (<><Globe className="mr-2 h-4 w-4"/>Find Public Emails</>)}
          </Button>
        </form>

        {results.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{results.length} results</div>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {results.map((r, idx) => (
                <div key={`${r.email}-${idx}`} className="rounded border p-3 flex items-center justify-between gap-3 bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.type === 'personal' ? 'default' : 'secondary'}>{r.type}</Badge>
                      <span className="font-medium truncate">{r.email}</span>
                      <span className="text-muted-foreground truncate">@ {r.domain}</span>
                    </div>
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <LinkIcon className="h-3 w-3"/>View source
                    </a>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onSave(r.domain, r.email)}>
                    <Mail className="h-3 w-3 mr-1"/> Save
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-start gap-2"><AlertCircle className="h-3.5 w-3.5 mt-0.5"/>We’ll search a few public pages like /contact, /about, and /partners. Some sites list only generic inboxes.</div>
        )}
      </CardContent>
    </Card>
  )
}
