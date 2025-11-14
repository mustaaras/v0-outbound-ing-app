import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle, Users, Mail, Archive, Crown, Zap, Coins, BookOpen, Target, TrendingUp, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "User Guide - Outbound.ing",
  description: "Complete guide to generating high-converting cold outreach emails with AI-powered strategies and contact search tools.",
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                View Pricing
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="mr-1 h-3 w-3" />
            Complete User Guide
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Master Cold Outreach with AI-Powered Email Generation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how to generate personalized, high-converting cold outreach emails using proven strategies,
            advanced AI technology, and intelligent contact search tools.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">🚀 Quick Start Guide</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create your account and choose a plan that fits your needs. Start with our free tier to explore features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">2. Find Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use our contact search to find businesses in your target market with verified email addresses.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Generate Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose from 150+ proven strategies across 14 industries to create personalized outreach emails.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">4. Track Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your email performance and refine your approach based on response rates and conversions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">✨ Key Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  AI-Powered Email Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    150+ proven sales strategies across 14 industries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Vercel's advanced AI SDK picks the best model for your needs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    A/B testing variants (Light & Pro plans)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Multi-language support (Pro plan)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Intelligent Contact Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Google Places API integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced prospect enrichment tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Location-based business search
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email verification and validation
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-primary" />
                  Email Archive & Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited email storage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced search and filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    One-click email copying
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Direct email client integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Usage tracking and limits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Performance metrics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Monthly usage reports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Tier-based feature access
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">💰 Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Free Plan</CardTitle>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    30 emails per month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    60 public email searches
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Basic strategies access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email archive
                  </li>
                </ul>
                <Link href="/auth/signup">
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <CardTitle>Light Plan</CardTitle>
                </div>
                <CardDescription>Ideal for growing businesses</CardDescription>
                <div className="text-3xl font-bold">$15<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    300 emails per month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited public searches
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    All strategies access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    A/B testing variants
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button className="w-full">Upgrade to Light</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle>Pro Plan</CardTitle>
                </div>
                <CardDescription>For serious outbound teams</CardDescription>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited emails
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Advanced prospect search capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Multi-language support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">Upgrade to Pro</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Success Stories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">📈 Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SaaS Founder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  "Outbound.ing helped me go from 2 to 15 demo calls per month. The AI-generated emails sound natural and get 3x better response rates than my old emails."
                </p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">750% increase in demos</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Director</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  "Our team generates 200+ personalized emails per week. The contact search saves hours of manual research, and the A/B testing helps us optimize for conversions."
                </p>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">200+ emails/week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Freelance Consultant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  "As a solo consultant, Outbound.ing levels the playing field. I can now compete with big agencies using professional-grade outreach automation."
                </p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Agency-level results</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Getting Started CTA */}
        <section className="text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Supercharge Your Outreach?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of sales professionals who are already using Outbound.ing to generate more leads and close more deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="px-8">
                    View All Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Outbound.ing. Helping you close more deals with AI-powered outreach.</p>
        </div>
      </footer>
    </div>
  )
}