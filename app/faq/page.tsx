import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft } from "lucide-react"

export default function FAQPage() {
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
            <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground">Find answers to common questions about Outbound.ing</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="what-is" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What is Outbound.ing?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Outbound.ing is an AI-powered platform that helps you generate professional cold emails for sales and
                outreach. With 101 proven strategies across 9 industries (SaaS, domains, real estate, freelancing,
                affiliate marketing, B2B services, recruiting, and more), you can create personalized emails that get
                responses and close deals.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pricing" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What are the pricing plans?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ul className="space-y-2">
                  <li>
                    <strong>Free Plan:</strong> 5 email generations per month
                  </li>
                  <li>
                    <strong>Light Plan:</strong> 100 emails/month at $9.99/month
                  </li>
                  <li>
                    <strong>Pro Plan:</strong> 750 emails/month at $29/month
                  </li>
                  <li>
                    <strong>Ultra Plan:</strong> 1,500 emails/month at $49/month
                  </li>
                </ul>
                <p className="mt-2">All paid plans are billed monthly and renew automatically.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refunds" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do you offer refunds?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <strong className="text-primary">No, all payments are final and non-refundable.</strong> We do not offer
                refunds for partial months, unused generations, or any other reason. Please try the Free plan first to
                ensure the service meets your needs before upgrading to a paid plan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I cancel my subscription?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can cancel your subscription at any time from your account settings. When you cancel, you'll
                retain access to your paid plan until the end of your current billing period. After that, your account
                will automatically revert to the Free plan with 5 emails/month.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upgrade" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I upgrade or downgrade my plan?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can upgrade to a higher tier at any time from the Upgrade page. Upgrades take effect
                immediately. To downgrade, you can cancel your current subscription and subscribe to a lower tier when
                your current billing period ends.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rollover" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Do unused email generations roll over to the next month?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No, unused email generations do not roll over. Your generation limit resets on the same day each month
                as your subscription start date. We recommend choosing a plan that matches your expected monthly usage.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="strategies" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                What are the 101 strategies?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our 101 strategies are proven cold email approaches organized across 9 categories: SaaS/B2B Software,
                Domains & Digital Assets, Real Estate, Freelancing & Agencies, Affiliate Marketing, B2B Services,
                Recruiting & HR, Investment & Funding, and General Sales. Each strategy is optimized for specific
                industries and goals like booking calls, getting replies, making sales, or introducing products.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customize" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I customize the generated emails?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Before generating, you can customize the tone (Professional, Friendly, Persuasive, Casual), email length
                (Short ~100 words, Medium ~150 words, Long ~200 words), goal (Book a call, Get a reply, Make a sale,
                Introduce product), and personalization level (Low or Medium). After generation, you can edit the email
                before sending.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="archive" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I save and access my generated emails?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! All generated emails are automatically saved to your Archive where you can view, copy, open in your
                email client, or delete them. You can access your archive anytime from the dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Can I sign up with Google?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you can sign up and log in using your Google account or with email and password. If you sign up
                with Google, you won't need to set a password.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we take security seriously. All data is encrypted in transit and at rest. We use Supabase for
                secure authentication and database management, and Stripe for secure payment processing. We never store
                your credit card information on our servers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="support" className="rounded-lg border bg-card px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                How do I get support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                If you have questions or need help, please contact us through your account dashboard. We typically
                respond within 24 hours during business days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
