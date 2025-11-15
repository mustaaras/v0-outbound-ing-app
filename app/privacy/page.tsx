import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logos/logo-o-new-48.svg" width={32} height={32} alt="Outbound.ing logo" className="rounded" />
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
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: November 15, 2025</p>
          </div>

          <div className="space-y-6 text-base leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Account Information:</strong> Name, email address, and password when you create an account
                </li>
                <li>
                  <strong>Usage Data:</strong> Email generation activity, strategy selections, and feature usage to provide and improve our service
                </li>
                <li>
                  <strong>Payment Information:</strong> Billing information processed securely through Stripe (we do not store credit card details)
                </li>
                <li>
                  <strong>Contact Search Data:</strong> Business information collected from public sources (Google Places, business websites) for contact search features
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Provide and maintain the Outbound.ing service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Generate personalized cold email content using AI</li>
                <li>Perform contact searches from public business data</li>
                <li>Send service-related communications and updates</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Contact Search & Data Collection</h2>
              <p>
                Our contact search feature collects business information from public sources including Google Places API
                and business websites. We automatically extract contact information to help users find prospects for
                their outreach campaigns. This data is used solely for providing the contact search service and is not
                shared with third parties for marketing purposes.
              </p>
              <p>
                We limit contact searches based on your subscription tier and implement rate limiting to prevent abuse.
                Pro users can search up to 100 businesses per month and extract up to 3 email addresses per website.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Data Sharing & Third Parties</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party services (Stripe for payments, Supabase for data storage, OpenAI for AI generation)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including encryption in transit
                and at rest, secure authentication, and regular security audits. However, no method of transmission
                over the internet is 100% secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Data Retention</h2>
              <p>
                We retain your account information and usage data for as long as your account is active and for a
                reasonable period afterward to comply with legal obligations, resolve disputes, and enforce our agreements.
                Contact search data is typically retained for the duration of your subscription and deleted within
                30 days of account closure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Access and review your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p>
                To exercise these rights, please contact us through your account dashboard or email support.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Cookies & Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, remember your preferences,
                and analyze service usage. You can control cookie settings through your browser, though this
                may affect service functionality.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">9. International Data Transfers</h2>
              <p>
                Your data may be processed and stored in different countries. We ensure appropriate safeguards
                are in place for international data transfers in compliance with applicable privacy laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect personal information
                from children under 13. If we become aware of such collection, we will delete the information promptly.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by email
                or through a prominent notice on our service. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">12. Contact Us</h2>
              <p>
                For privacy-related questions or concerns, please contact us through your account dashboard,
                visit our FAQ page, or email our support team at <a className="underline" href="mailto:support@outbound.ing">support@outbound.ing</a>.
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
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
        </div>
      </footer>
    </div>
  )
}