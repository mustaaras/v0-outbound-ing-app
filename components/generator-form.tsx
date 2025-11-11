"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Strategy } from "@/lib/types"
import { generateTemplate } from "@/app/actions/generate"
import { Loader2, Copy, Crown, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { User } from "@/lib/types"

interface GeneratorFormProps {
  user: User | null
  usage: number
  strategies: Strategy[]
  userTier: string
  userId: string
  canGenerate: boolean
}

export function GeneratorForm({ user, usage, strategies, userTier, userId, canGenerate }: GeneratorFormProps) {
  const [subject, setSubject] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [sellerSignature, setSellerSignature] = useState("")
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("SaaS & Startup")

  const [tone, setTone] = useState<string>("Professional")
  const [emailLength, setEmailLength] = useState<string>("Medium")
  const [goal, setGoal] = useState<string>("Get a reply")
  const [personalization, setPersonalization] = useState<string>("Medium")
  
  // Premium features
  const [generateVariants, setGenerateVariants] = useState<boolean>(false)
  const [generateMultiChannel, setGenerateMultiChannel] = useState<boolean>(false)
  const [variants, setVariants] = useState<Array<{label: string, content: string}> | null>(null)
  const [multiChannelResults, setMultiChannelResults] = useState<Record<string, string> | null>(null)

  const { toast } = useToast()

  // Prefill recipient fields if a buyer was selected from Search Buyers
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("selectedBuyer")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.name) setRecipientName(parsed.name)
        if (parsed?.email) setRecipientEmail(parsed.email)
        // Keep the selection in sessionStorage in case user wants to switch; do not remove automatically
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Group strategies by category
  const categorizedStrategies = useMemo(() => {
    const grouped: Record<string, Strategy[]> = {}
    strategies.forEach((strategy) => {
      if (!grouped[strategy.category]) {
        grouped[strategy.category] = []
      }
      grouped[strategy.category].push(strategy)
    })
    return grouped
  }, [strategies])

  const categories = Object.keys(categorizedStrategies).sort()

  const handleStrategyToggle = (strategyId: string, tier: string) => {
    if (tier === "pro" && userTier === "free") {
      toast({
        title: "Pro Strategy",
        description: "Upgrade to Pro to use this strategy",
        variant: "destructive",
      })
      return
    }

    setSelectedStrategies((prev) => {
      if (prev.includes(strategyId)) {
        return prev.filter((id) => id !== strategyId)
      } else {
        const maxStrategies = userTier === "free" ? 1 : 999
        if (prev.length >= maxStrategies) {
          toast({
            title: "Maximum strategies selected",
            description:
              userTier === "free"
                ? "Free tier can only select 1 strategy. Upgrade to Pro for unlimited selections."
                : "You've selected the maximum number of strategies",
            variant: "destructive",
          })
          return prev
        }
        return [...prev, strategyId]
      }
    })
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      toast({
        title: "Copied!",
        description: "Email copied to clipboard",
      })
    }
  }

  const handleOpenEmail = () => {
    if (!recipientEmail) {
      toast({
        title: "No recipient email",
        description: "Please enter a recipient email address first",
        variant: "destructive",
      })
      return
    }

    if (!result) {
      toast({
        title: "No email content",
        description: "Please generate an email first",
        variant: "destructive",
      })
      return
    }

    const mailtoSubject = `Regarding ${subject}`
    const mailtoBody = result

    // Create mailto URL with both subject and body
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`

    // Check URL length - mailto has practical limits around 2000-8000 chars depending on browser/OS
    if (mailtoUrl.length > 2000) {
      // If too long, just use subject and copy body to clipboard
      const shortMailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(mailtoSubject)}`
      navigator.clipboard.writeText(result)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canGenerate) {
      toast({
        title: "Usage limit reached",
        description: "Upgrade to Pro for unlimited emails",
        variant: "destructive",
      })
      return
    }

    if (selectedStrategies.length === 0) {
      toast({
        title: "No strategies selected",
        description: "Please select at least one strategy",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)
    setVariants(null)
    setMultiChannelResults(null)

    try {
      const data = await generateTemplate({
        subject,
        category: activeCategory,
        recipientName: recipientName || undefined,
        recipientEmail: recipientEmail || undefined,
        sellerSignature: sellerSignature || undefined,
        strategyIds: selectedStrategies,
        userId,
        inputData: {},
        tone,
        emailLength,
        goal,
        personalization,
        generateVariants,
        generateMultiChannel,
      })

      setResult(data.result)
      
      if (data.variants) {
        setVariants(data.variants)
      }
      
      if (data.multiChannelResults) {
        setMultiChannelResults(data.multiChannelResults)
      }
      
      toast({
        title: "Email generated!",
        description: data.variants ? "3 A/B test variants created" : data.multiChannelResults ? "Multi-channel variants created" : "Your cold outreach email is ready",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get label for subject field based on category
  const getSubjectLabel = () => {
    switch (activeCategory) {
      case "Domain Sellers":
        return "Domain Name"
      case "SaaS & Startup":
      case "Affiliate Marketing":
      case "E-commerce & Dropshipping":
        return "Product Name"
      case "Real Estate":
        return "Property Address"
      case "Freelancers & Agencies":
      case "B2B Services":
        return "Service Type"
      case "Recruiting":
        return "Job Title / Service"
      case "Investment":
        return "Business / Opportunity"
      default:
        return "Topic / Subject"
    }
  }

  const getSubjectPlaceholder = () => {
    switch (activeCategory) {
      case "Domain Sellers":
        return "example.com"
      case "SaaS & Startup":
      case "Affiliate Marketing":
      case "E-commerce & Dropshipping":
        return "My Product Name"
      case "Real Estate":
        return "123 Main Street, New York"
      case "Freelancers & Agencies":
        return "Web Development"
      case "B2B Services":
        return "Marketing Consulting"
      case "Recruiting":
        return "Senior Software Engineer"
      case "Investment":
        return "TechCo Inc."
      default:
        return "Your topic here"
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="subject">{getSubjectLabel()} *</Label>
          <Input
            id="subject"
            placeholder={getSubjectPlaceholder()}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-name">Recipient Name</Label>
          <Input
            id="recipient-name"
            placeholder="John Smith"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-email">Recipient Email</Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="john@company.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signature">Your Signature</Label>
          <Input
            id="signature"
            placeholder="Your Name | your@email.com | +1-555-0123"
            value={sellerSignature}
            onChange={(e) => setSellerSignature(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Your contact information added at the end</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>{userTier === "free" ? "Select 1 Strategy *" : "Select Strategies *"}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {userTier === "free"
                ? `Choose 1 ${activeCategory} strategy (Pro: unlimited)`
                : `Choose from ${activeCategory} strategies (unlimited)`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categorizedStrategies[activeCategory]?.map((strategy) => {
              const isProStrategy = strategy.tier === "pro"
              const isLocked = isProStrategy && userTier === "free"
              const isSelected = selectedStrategies.includes(strategy.id)

              return (
                <div
                  key={strategy.id}
                  className={`relative flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                    isLocked
                      ? "cursor-not-allowed opacity-50"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : "cursor-pointer hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    id={strategy.id}
                    checked={isSelected}
                    disabled={isLocked}
                    onCheckedChange={() => handleStrategyToggle(strategy.id, strategy.tier)}
                  />
                  <div
                    className="flex-1 space-y-1"
                    onClick={() => !isLocked && handleStrategyToggle(strategy.id, strategy.tier)}
                  >
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={strategy.id}
                        className={`font-medium ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {strategy.name}
                      </Label>
                      {isProStrategy && (
                        <Badge variant="secondary" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {userTier === "free" && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              Want access to all strategies?{" "}
              <Link href="/upgrade" className="font-medium underline underline-offset-4">
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

        {selectedStrategies.length > 0 && (
          <div className="space-y-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">🎯 Customize Your Email</Label>
              <p className="text-sm text-muted-foreground">Fine-tune how your email is generated for better results</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tone</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {["Professional", "Friendly", "Persuasive", "Casual", "Enthusiastic", "Consultative", "Direct", "Empathetic"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTone(option)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        tone === option
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Length</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "Short", label: "Short (2-3 sentences)" },
                    { value: "Medium", label: "Medium (4-6 sentences)" },
                    { value: "Long", label: "Long (Full paragraph)" }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEmailLength(value)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        emailLength === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Goal</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Book a call", "Get a reply", "Make a sale", "Introduce product", "Schedule demo", "Request feedback", "Propose partnership", "Follow-up"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGoal(option)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        goal === option
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Personalization Level</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Low", "Medium", "High"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPersonalization(option)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        personalization === option
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher personalization uses more recipient details in the email
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Premium Features */}
        {(userTier === "pro" || userTier === "ultra") && selectedStrategies.length > 0 && (
          <div className="space-y-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5 p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                <Label className="text-base font-semibold">Premium Features</Label>
              </div>
              <p className="text-sm text-muted-foreground">Unlock advanced generation options</p>
            </div>

            <div className="space-y-4">
              {userTier === "pro" || userTier === "ultra" ? (
                <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                  <Checkbox
                    id="generate-variants"
                    checked={generateVariants}
                    onCheckedChange={(checked) => setGenerateVariants(checked as boolean)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="generate-variants" className="cursor-pointer font-medium">
                        A/B Test Variants
                      </Label>
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Pro
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate 3 different versions with varied subject lines, CTAs, and tones for testing
                    </p>
                  </div>
                </div>
              ) : null}

              {userTier === "ultra" && (
                <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                  <Checkbox
                    id="generate-multichannel"
                    checked={generateMultiChannel}
                    onCheckedChange={(checked) => setGenerateMultiChannel(checked as boolean)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="generate-multichannel" className="cursor-pointer font-medium">
                        Multi-Channel Variants
                      </Label>
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Ultra
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate versions for Email, LinkedIn, Twitter DM, SMS, and Cold Call script
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !canGenerate}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Email"
          )}
        </Button>

        {!canGenerate && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            You&apos;ve reached your monthly limit.{" "}
            <Link href="/upgrade" className="font-medium underline underline-offset-4">
              Upgrade to Pro
            </Link>{" "}
            for unlimited emails.
          </div>
        )}
      </form>

      {result && !variants && !multiChannelResults && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Outreach Email</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              {recipientEmail && (
                <Button variant="outline" size="sm" onClick={handleOpenEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Open Email
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">{result}</pre>
          </div>
        </div>
      )}

      {/* A/B Test Variants Display */}
      {variants && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">A/B Test Variants</h3>
            <Badge variant="secondary">Pro Feature</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {variants.map((variant, index) => (
              <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{variant.label}</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(variant.content)
                        toast({ title: "Copied!", description: `${variant.label} copied to clipboard` })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {recipientEmail && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const mailtoSubject = `Regarding ${subject}`
                          const mailtoBody = variant.content
                          const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`
                          
                          if (mailtoUrl.length > 2000) {
                            const shortMailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(mailtoSubject)}`
                            navigator.clipboard.writeText(variant.content)
                            window.location.href = shortMailtoUrl
                            toast({
                              title: "Email client opened",
                              description: "Content copied - paste it into the message body.",
                            })
                          } else {
                            window.location.href = mailtoUrl
                            toast({
                              title: "Email ready to send",
                              description: `${variant.label} loaded in your email client.`,
                            })
                          }
                        }}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs font-mono">{variant.content}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Channel Variants Display */}
      {multiChannelResults && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Multi-Channel Variants</h3>
            <Badge variant="secondary">Ultra Feature</Badge>
          </div>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="linkedin_request">Connection</TabsTrigger>
              <TabsTrigger value="twitter">Twitter</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
            </TabsList>
            {Object.entries(multiChannelResults).map(([channel, content]) => (
              <div key={channel} className={channel === "email" ? "" : "hidden"} data-state={channel}>
                <div className="rounded-lg border bg-card p-6 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold capitalize">{channel.replace("_", " ")}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(content)
                        toast({ title: "Copied!", description: `${channel} version copied` })
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {channel === "linkedin" && "Max 500 characters for LinkedIn InMail"}
                    {channel === "linkedin_request" && "Max 300 characters for connection requests"}
                    {channel === "twitter" && "Max 280 characters for Twitter/X DMs"}
                    {channel === "sms" && "Max 160 characters for SMS"}
                    {channel === "voicemail" && "30-second script for cold call voicemail"}
                  </div>
                </div>
              </div>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
}
