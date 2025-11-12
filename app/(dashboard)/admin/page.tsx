import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, DollarSign, TrendingUp, Users } from "lucide-react"

export default async function AdminPage() {
  const user = await getCurrentUser()

  // Only allow access to specific admin email
  if (!user || user.email !== "mustafaaras91@gmail.com") {
    redirect("/dashboard")
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-yellow-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">System overview and cost tracking</p>
        </div>
      </div>

      {/* Cost Tracking */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vercel Hosting</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$20</div>
            <p className="text-xs text-muted-foreground mt-1">per month (Pro tier)</p>
            <p className="text-xs text-muted-foreground mt-2">
              Includes hosting, serverless functions, bandwidth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Supabase</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$25</div>
            <p className="text-xs text-muted-foreground mt-1">per month (Pro tier)</p>
            <p className="text-xs text-muted-foreground mt-2">
              Database, authentication, storage, bandwidth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OpenAI API</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~$0.60</div>
            <p className="text-xs text-muted-foreground mt-1">per user per month (estimate)</p>
            <p className="text-xs text-muted-foreground mt-2">
              Based on GPT-4o usage, varies by activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stripe</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.9% + $0.30</div>
            <p className="text-xs text-muted-foreground mt-1">per transaction</p>
            <p className="text-xs text-muted-foreground mt-2">
              Payment processing fees deducted automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Snov.io</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$39</div>
            <p className="text-xs text-muted-foreground mt-1">per month (Pro tier)</p>
            <p className="text-xs text-muted-foreground mt-2">
              1000 credits/month for verified contact search
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground mt-1">3,000 emails/month</p>
            <p className="text-xs text-muted-foreground mt-2">
              Transactional emails (password reset, notifications)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cost Summary</CardTitle>
          <CardDescription>Estimated infrastructure costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fixed Costs (Hosting + Database)</span>
              <span className="font-medium">$45/month</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Snov.io API</span>
              <span className="font-medium">$39/month</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Variable Costs (AI per user)</span>
              <span className="font-medium">~$0.60/user/month</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Processing</span>
              <span className="font-medium">2.9% + $0.30 per transaction</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between font-semibold">
                <span>Base Monthly Cost</span>
                <span className="text-lg">$84 + variables</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                + AI costs scale with usage
                <br />+ Stripe fees deducted from revenue
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes & Monitoring</CardTitle>
          <CardDescription>Track your infrastructure and costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Cost Optimization Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Monitor Vercel bandwidth and function execution times</li>
              <li>Track Supabase database size and query performance</li>
              <li>Optimize AI prompts to reduce token usage</li>
              <li>Review Snov.io credit usage monthly</li>
              <li>Consider caching frequently accessed data</li>
            </ul>
          </div>
          <div className="pt-3 border-t">
            <h4 className="font-medium text-sm mb-2">Useful Links</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Vercel Dashboard →
                </a>
              </li>
              <li>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase Dashboard →
                </a>
              </li>
              <li>
                <a
                  href="https://platform.openai.com/usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Usage →
                </a>
              </li>
              <li>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Stripe Dashboard →
                </a>
              </li>
              <li>
                <a
                  href="https://app.snov.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Snov.io Dashboard →
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
