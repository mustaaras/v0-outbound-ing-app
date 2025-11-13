import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wand2, Zap, Crown, Sparkles, Target, Users, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logos/logo-o-new.svg"
              alt="Outbound.ing Logo"
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold">Outbound.ing</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</Link>
            <Button asChild variant="ghost">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Fully Centered */}
        <section className="container flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-20 text-center">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>100+ AI-Powered Sales Strategies</span>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Generate Perfect Cold Emails
              <br />
              <span className="text-primary">Across Every Industry</span>
            </h1>

            <p className="text-balance max-w-2xl text-lg text-muted-foreground sm:text-xl">
              AI-powered cold outreach emails for SaaS, domains, real estate, freelancing, affiliate marketing, B2B
              services, recruiting, and more. Choose from 100+ proven strategies.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/signup">
                  <Wand2 className="h-4 w-4" />
                  Start Free - 30 Emails/Month
                </Link>
              </Button>
                            <Button asChild variant="outline" size="lg">
                <a href="#pricing">See Pricing</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>9 Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>101 Strategies</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Custom Tone & Goals</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Centered */}
        <section className="border-t bg-muted/50 py-20">
          <div className="container">
            <div className="mx-auto max-w-5xl space-y-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything You Need to Close Deals</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Professional cold emails powered by AI, customized for your industry
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Wand2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">AI-Powered Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Leverage GPT-4 to create compelling, personalized cold emails that get responses and close deals
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">101 Sales Strategies</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from proven strategies across 9 categories: SaaS, Affiliate Marketing, Real Estate,
                    Recruiting, and more
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Fully Customizable</h3>
                  <p className="text-sm text-muted-foreground">
                    Control tone, length, goal, and personalization level to craft emails that match your style
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Multi-Industry Support</h3>
                  <p className="text-sm text-muted-foreground">
                    B2B services, freelancing, investment, domain sales - whatever you sell, we have strategies for it
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Direct Email Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    One click to open your email client with everything pre-filled and ready to send
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                                    <h3 className="text-xl font-semibold">Flexible Pricing Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Start free with 30 emails/month. Upgrade to Light for 300 emails at $15/month, Pro for unlimited emails
                    at $39/month. 20% off annual billing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Centered */}
        <section className="container py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-lg border bg-card p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Close More Deals?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of professionals using AI to craft perfect cold emails
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/signup">
                <Wand2 className="h-4 w-4" />
                Get Started Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#pricing">See Pricing</Link>
            </Button>
          </div>
        </section>

        {/* Public Pricing Section */}
  <section id="pricing" className="border-t bg-muted/50 py-20">
          <div className="container">
            <div className="mx-auto max-w-5xl space-y-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
              <p className="text-muted-foreground">Compare plans and pick what fits your outreach needs</p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {/* Free Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Perfect for trying out Outbound.ing</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-left">
                    {[
                      "30 emails per month",
                      "Pick 1 strategy at a time",
                      "9 industry categories",
                      "Basic customization",
                      "Email support",
                      "Email Finder – 60 searches/month",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href="/auth/signup">Start Free</Link>
                  </Button>
                </CardFooter>
              </Card>

              {PRODUCTS.filter(p => p.billingCycle === "monthly").map((product) => (
                <Card key={product.id} className={product.tier === "pro" ? "border-primary shadow-lg" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{product.name}</CardTitle>
                      {product.tier === "pro" && (
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                          Popular
                        </span>
                      )}
                    </div>
                    <CardDescription>{product.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{product.priceLabel}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">or save 20% with annual billing</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-left">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/auth/signup">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Quick comparison bullets */}
            <div className="mx-auto mt-10 max-w-4xl rounded-lg border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="text-left">
                  <h3 className="font-semibold">What’s included</h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>101 premium strategies across 9 industries</li>
                    <li>Archive access and full customization</li>
                    <li>Direct email handoff—ready to send</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Search Contacts</h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>Free: 60 searches per month</li>
                    <li>Light: Unlimited searches</li>
                    <li>Pro: Unlimited + advanced enrichment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-wrap items-center justify-center gap-4 text-center text-sm text-muted-foreground">
          <span>© 2025 Outbound.ing. All rights reserved.</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <a href="mailto:support@outbound.ing" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
