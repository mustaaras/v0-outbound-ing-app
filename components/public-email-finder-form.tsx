"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Globe, Link as LinkIcon, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { findPublicEmails } from "@/app/actions/public-email-finder"
import { saveBuyer } from "@/app/actions/save-buyer"
import Link from "next/link"

interface Props {
  userId: string
  userTier: string
  searchesUsed: number
  searchLimit: number
}

export function PublicEmailFinderForm({ userId, userTier, searchesUsed, searchLimit }: Props) {
  const { toast } = useToast()
  const [keyword, setKeyword] = useState("")
  const [domains, setDomains] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Array<{ domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }>>([])
  const [searchesRemainingLocal, setSearchesRemainingLocal] = useState(searchLimit - searchesUsed)
  const handleSendEmail = (r: { domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }) => {
    sessionStorage.setItem(
      "selectedBuyer",
      JSON.stringify({
        name: r.email.split("@")[0], // fallback
        email: r.email,
        company: r.domain,
        title: r.type === 'generic' ? 'Generic Inbox' : 'Public Email',
      })
    )
    window.location.href = '/generator'
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResults([])
    try {
      const res = await findPublicEmails({ userId, userTier, keyword: keyword || undefined, domains: domains || undefined, perDomainCap: 5, totalCap: 50 })
      if (!res.success) {
        toast({ title: "Search failed", description: res.error || "Unknown error", variant: "destructive" })
        return
      }
      setResults(res.data.results)
      setSearchesRemainingLocal(res.data.searchesRemaining)
      
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

  if (searchLimit === 0 || searchesRemainingLocal < 0) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-yellow-600">Public Email Finder Unavailable</p>
            <p className="text-sm text-yellow-600">
              You've reached your monthly limit of {searchLimit} searches.{" "}
              <Link href="/upgrade" className="font-semibold underline underline-offset-2">
                Upgrade for unlimited searches
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    )
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
         Extract publicly listed emails from company websites. Search from 3000+ industry keywords including: ai, crypto, blockchain, web3, nft, defi, saas, fintech, devops, machine learning, cloud, and hundreds more across tech, finance, marketing, and other industries.
        </CardDescription>
        <div className="text-sm text-muted-foreground pt-2">
          Searches remaining this month: <span className="font-bold">{searchesRemainingLocal}</span> / {searchLimit}
          {searchLimit > 900000 && <span className="text-green-600 font-semibold ml-2">✓ Unlimited</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pef-keyword">Keyword (optional)</Label>
              <Input id="pef-keyword" placeholder="ai, crypto, web3, saas, fintech..." value={keyword} onChange={(e) => setKeyword(e.target.value)} disabled={isLoading} />
              <p className="text-xs text-muted-foreground">3000+ tech, crypto, and industry keywords</p>
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
            <div className="text-sm text-muted-foreground">{results.length} results from {new Set(results.map(r => r.domain)).size} domains</div>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {results.map((r, idx) => (
                <div
                  key={`${r.email}-${idx}`}
                  className="rounded border p-3 flex items-center justify-between gap-3 bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={r.type === 'personal' ? 'default' : 'secondary'}>{r.type}</Badge>
                      <span className="font-medium truncate">{r.email}</span>
                      <span className="text-muted-foreground truncate">@ {r.domain}</span>
                    </div>
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" />View source
                    </a>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded border border-transparent px-2 py-1 text-xs hover:bg-primary/10"
                    title="Send email"
                    onClick={() => handleSendEmail(r)}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" /> Send
                  </button>
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
