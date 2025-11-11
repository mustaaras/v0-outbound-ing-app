"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Mail, Briefcase, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { searchBuyers } from "@/app/actions/search-buyers"
import { saveBuyer } from "@/app/actions/save-buyer"
import type { SnovBuyer } from "@/lib/snov"
import Link from "next/link"

interface SearchBuyersFormProps {
  userId: string
  userTier: string
  searchesUsed: number
  searchLimit: number
}

export function SearchBuyersForm({ userId, userTier, searchesUsed, searchLimit }: SearchBuyersFormProps) {
  const [domain, setDomain] = useState("")
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SnovBuyer[]>([])
  const [selectedBuyer, setSelectedBuyer] = useState<SnovBuyer | null>(null)
  const [searchesRemainingLocal, setSearchesRemainingLocal] = useState(searchLimit - searchesUsed)
  const [requestedCount, setRequestedCount] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setResults([])
    setSelectedBuyer(null)

    if (!domain) {
      toast({ title: 'Domain required', description: 'Enter a company domain (e.g. example.com)', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      const result = await searchBuyers({
        userId,
        userTier,
        mode: 'domain',
        domain: domain || undefined,
        title: title || undefined,
        requestedCount: requestedCount,
      })

      if (!result.success) {
        setErrorMessage(result.error || "Search failed")
        toast({
          title: "Search failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setResults(result.data.results)
      setTotalResults(result.data.total)
      setSearchesRemainingLocal(result.data.searchesRemaining)

      // Auto-save all results
      if (result.data.results.length > 0) {
        let saved = 0
        for (const buyer of result.data.results) {
          try {
            const saveRes = await saveBuyer({
              userId,
              buyer: {
                email: buyer.email,
                first_name: buyer.first_name,
                last_name: buyer.last_name,
                company: buyer.company,
                title: buyer.title,
              },
            })
            if (saveRes.success) saved++
          } catch (e) {
            // Continue with other contacts
          }
        }
        
        toast({
          title: "Search completed!",
          description: `Found ${result.data.results.length} prospects. ${saved} saved to contacts. ${result.data.searchesRemaining} searches remaining.`,
        })
      } else {
        toast({
          title: "Search completed!",
          description: `Found ${result.data.results.length} prospects. ${result.data.searchesRemaining} searches remaining.`,
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred"
      setErrorMessage(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBuyer = async (buyer: SnovBuyer) => {
    setSelectedBuyer(buyer)
  }

  const handleProceedToGenerator = () => {
    if (!selectedBuyer) return

    // Store buyer info in session storage for generator page to access
    sessionStorage.setItem(
      "selectedBuyer",
      JSON.stringify({
        name: `${selectedBuyer.first_name} ${selectedBuyer.last_name}`,
        email: selectedBuyer.email,
        company: selectedBuyer.company,
        title: selectedBuyer.title,
      }),
    )

    window.location.href = "/generator"
  }

  if (searchLimit === 0) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-yellow-600">Search Buyers Unavailable</p>
            <p className="text-sm text-yellow-600">
              Search Buyers is available on Light, Pro, and Ultra plans.{" "}
              <Link href="/upgrade" className="font-semibold underline underline-offset-2">
                Upgrade now
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Search for Prospects</h3>
          <p className="text-sm text-muted-foreground">
            Find the right people to reach out to. Searches remaining this month: <span className="font-bold">{searchesRemainingLocal}</span> / {searchLimit}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Company Domain</Label>
              <Input id="domain" placeholder="e.g., hubspot.com" value={domain} onChange={(e) => setDomain(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title (optional)</Label>
              <Input id="title" placeholder="e.g., Sales Manager" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="count">Number of buyers</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={Math.max(1, searchesRemainingLocal)}
              value={String(requestedCount)}
              onChange={(e) => setRequestedCount(Number(e.target.value))}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">Each saved email counts toward your monthly quota.</p>
          </div>
        </div>

        {errorMessage && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search By Domain
            </>
          )}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Search Results</h3>
            <Badge variant="outline">{results.length} prospects found</Badge>
          </div>

          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {results.map((buyer, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  selectedBuyer?.email === buyer.email
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleSelectBuyer(buyer)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="font-semibold">
                          {buyer.first_name} {buyer.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {buyer.title}
                        </div>
                      </div>
                      {selectedBuyer?.email === buyer.email && (
                        <Badge className="bg-primary">Selected</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{buyer.company}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">{buyer.email}</span>
                      </div>
                    </div>

                    {(buyer.industry || buyer.company_size) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {buyer.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {buyer.industry}
                          </Badge>
                        )}
                        {buyer.company_size && (
                          <Badge variant="secondary" className="text-xs">
                            {buyer.company_size}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedBuyer && (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/generator">Cancel & Go Back</Link>
              </Button>
              <Button onClick={handleProceedToGenerator} className="flex-1">
                Proceed to Generator
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && !errorMessage && results.length === 0 && totalResults === 0 && (
        <Card className="border-muted-foreground/30 bg-muted/10">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <div className="font-medium text-foreground">No prospects found</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Try a different company domain.</li>
              <li>Add a Job Title like “Affiliate Manager”, “Partnerships Manager”, or “Head of Partnerships”.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
