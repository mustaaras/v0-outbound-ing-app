import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">O</span>
            </div>
            <span className="text-lg font-semibold">Outbound.ing</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container flex-1 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: November 9, 2025</p>
          </div>

          <div className="space-y-6 text-base leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Outbound.ing (&quot;the Service&quot;), you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Description of Service</h2>
              <p>
                Outbound.ing provides AI-powered cold email generation tools for sales and outreach purposes. The
                Service includes access to 101 sales strategies across multiple industries, customizable email
                templates, location-based business search with contact extraction, support chat, and generation limits based on your subscription tier.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Subscription Plans & Pricing</h2>
              <p>We offer three subscription tiers:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Free Plan:</strong> 30 email generations per month, 60 location searches per month
                </li>
                <li>
                  <strong>Light Plan:</strong> 300 email generations per month at $15/month (or $12/month billed annually), unlimited location searches
                </li>
                <li>
                  <strong>Pro Plan:</strong> Unlimited email generations at $39/month (or $31.20/month billed annually), unlimited location searches with advanced features (up to 10 websites per search, 3 emails per website)
                </li>
              </ul>
              <p className="pt-2">
                All prices are in USD. Monthly plans are billed monthly, annual plans are billed yearly. Subscriptions automatically renew unless cancelled before the
                next billing cycle. Annual plans offer a 20% discount compared to monthly billing.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. No Refund Policy</h2>
              <p className="font-semibold text-primary">
                ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. We do not offer refunds or credits for:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Partial months of service</li>
                <li>Unused email generations</li>
                <li>Subscription downgrades or cancellations</li>
                <li>Service dissatisfaction</li>
                <li>Any other reason</li>
              </ul>
              <p className="pt-2">
                If you cancel your subscription, you will retain access to your paid plan until the end of your current
                billing period. After that, your account will automatically revert to the Free plan.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Usage Limits</h2>
              <p>
                Your monthly email generation limit resets on the same day each month as your subscription start date.
                Unused generations do not roll over to the next month. Location search limits also reset monthly and
                are tier-dependent as outlined in Section 3.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5.1 Contact Search & Data Collection</h2>
              <p>
                The contact search feature collects business information from public sources including Google Places
                and business websites. We automatically extract up to 3 email addresses per website for Pro users and
                limit searches to prevent abuse. All collected data is used solely for providing the contact search
                service and is not shared with third parties for marketing purposes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Provide accurate account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Not use the Service for spam, harassment, or illegal activities</li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
              <p>
                All content generated through the Service, including email templates and strategies, is provided
                &quot;as is&quot; for your use. You retain ownership of any content you input into the Service. We
                retain all rights to the Service platform, technology, and underlying AI models.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not
                guarantee that generated emails will achieve specific results or that the Service will be uninterrupted
                or error-free.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
              <p>
                Outbound.ing shall not be liable for any indirect, incidental, special, consequential, or punitive
                damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">10. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms of
                Service. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms of Service at any time. Continued use of the Service after
                changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">12. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us through your account dashboard or visit
                our FAQ page.
              </p>
            </section>
          </div>
        </div>
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
        </div>
      </footer>
    </div>
  )
}
