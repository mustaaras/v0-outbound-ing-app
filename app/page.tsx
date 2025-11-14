import Link from "next/link"
import { ArrowRight, CheckCircle, Mail, Zap, Users, Target, TrendingUp, Crown, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img
              src="/logos/logo-o-new.svg"
              alt="Outbound.ing Logo"
              className="h-8 w-8"
            />
            <span className="text-lg">Outbound.ing</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                Pricing
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container py-24 text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            AI-Powered Cold Outreach
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Generate High-Converting
            <span className="text-primary"> Cold Emails</span>
            <br />
            in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your sales outreach with AI-generated emails using 100+ proven strategies.
            Get 3x better response rates and close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 30 emails per month free
          </p>
        </section>

        {/* Features Section */}
        <section className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything You Need for Effective Cold Outreach
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From strategy selection to email generation, we handle the heavy lifting so you can focus on closing deals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Mail className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Email Generation</CardTitle>
                <CardDescription>
                  Generate professional cold emails using proven strategies across 10+ industries
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>100+ Strategies</CardTitle>
                <CardDescription>
                  Access battle-tested approaches from top sales professionals and agencies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Contact Discovery</CardTitle>
                <CardDescription>
                  Find prospects with our integrated search tools (Pro feature)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>A/B Testing</CardTitle>
                <CardDescription>
                  Generate multiple variants and test what works best (Light & Pro)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Crown className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Language</CardTitle>
                <CardDescription>
                  Generate emails in any language for global outreach (Pro feature)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics & Tracking</CardTitle>
                <CardDescription>
                  Track performance and optimize your outreach campaigns
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Social Proof */}
        <section className="bg-muted/50 py-24">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Trusted by Sales Professionals Worldwide
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Outbound.ing helped me go from 2 to 15 demo calls per month. The AI-generated emails sound natural and get 3x better response rates than my old emails."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">SM</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sarah Mitchell</p>
                      <p className="text-sm text-muted-foreground">Sales Director, TechCorp</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "As a solo consultant, Outbound.ing levels the playing field. I can now compete with big agencies using professional-grade outreach automation."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">MJ</span>
                    </div>
                    <div>
                      <p className="font-semibold">Mike Johnson</p>
                      <p className="text-sm text-muted-foreground">Business Consultant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to Transform Your Cold Outreach?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of sales professionals who are already using Outbound.ing to generate more leads and close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img
                src="/logos/logo-o-new.svg"
                alt="Outbound.ing Logo"
                className="h-6 w-6"
              />
              <span className="font-semibold">Outbound.ing</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/faq" className="hover:text-foreground">FAQ</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Outbound.ing. Helping you close more deals with AI-powered outreach.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
