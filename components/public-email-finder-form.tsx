"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Globe, Link as LinkIcon, Loader2 } from "lucide-react"
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
      
      // Auto-save all results
      if (res.data.results.length > 0) {
        let saved = 0
        for (const r of res.data.results) {
          try {
            const saveRes = await saveBuyer({ 
              userId, 
              buyer: { 
                email: r.email, 
                first_name: null as any, 
                last_name: null as any, 
                company: r.domain, 
                title: `Public email (${r.type})` 
              } 
            })
            if (saveRes.success) saved++
          } catch (e) {
            // Continue with other contacts
          }
        }
        toast({ title: "Completed", description: `Found ${res.data.results.length} emails from public pages. ${saved} saved to contacts.` })
      } else {
        toast({ title: "Completed", description: `Found ${res.data.results.length} emails from public pages.` })
      }
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
         Extract publicly listed emails from company websites. Try keywords like: affiliate, marketing, saas, crm, ecommerce, payment, analytics, ai, blockchain, healthcare, education, hr, security, design, development, and 100+ more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pef-keyword">Keyword (optional)</Label>
              <Input id="pef-keyword" placeholder="affiliate, ecommerce, marketing..." value={keyword} onChange={(e) => setKeyword(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Predefined industry keywords</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pef-domains">Domains (comma or newline)</Label>
              <Input id="pef-domains" placeholder="hubspot.com, salesforce.com" value={domains} onChange={(e) => setDomains(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">Enter any company domains directly</p>
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
