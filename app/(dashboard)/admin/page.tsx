import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, DollarSign, TrendingUp, Users, MessageSquare, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

export default async function AdminPage() {
  const user = await getCurrentUser()

  // Only allow access to specific admin email
  if (!user || user.email !== "mustafaaras91@gmail.com") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Fetch recent support messages
  const { data: supportMessages } = await supabase
    .from("support_messages")
    .select("id, message, created_at, user_id, users(email, tier)")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch recent feedback
  const { data: feedbackMessages } = await supabase
    .from("feedback")
    .select("id, rating, comment, created_at, user_id, users(email, tier)")
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch contact messages
  const { data: contactMessages } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

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

      {/* User Messages */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Support Messages */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Support Messages
            </CardTitle>
            <CardDescription>Latest support requests from users</CardDescription>
          </CardHeader>
          <CardContent>
            {supportMessages && supportMessages.length > 0 ? (
              <div className="space-y-4">
                {supportMessages.map((msg: any) => (
                  <div key={msg.id} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{msg.users?.email || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">
                          {msg.users?.tier || 'free'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No support messages yet</p>
            )}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recent Feedback
            </CardTitle>
            <CardDescription>User ratings and comments</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackMessages && feedbackMessages.length > 0 ? (
              <div className="space-y-4">
                {feedbackMessages.map((fb: any) => (
                  <div key={fb.id} className="border rounded-lg p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{fb.users?.email || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">
                          {fb.users?.tier || 'free'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < parseInt(fb.rating.split(' - ')[0]) || fb.rating.includes('Great')
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-1">{fb.rating}</p>
                    {fb.comment && <p className="text-sm text-muted-foreground">{fb.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Form Submissions</CardTitle>
          <CardDescription>Messages from the public contact page</CardDescription>
        </CardHeader>
        <CardContent>
          {contactMessages && contactMessages.length > 0 ? (
            <div className="space-y-4">
              {contactMessages.map((msg: any) => (
                <div key={msg.id} className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.name}</span>
                      <span className="text-sm text-muted-foreground">({msg.email})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contact messages yet</p>
          )}
        </CardContent>
      </Card>

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
