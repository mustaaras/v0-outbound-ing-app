import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { FeedbackBox } from "@/components/feedback-box"
import { SupportBox } from "@/components/support-box"

export default async function HelpPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Get help, share feedback, or contact our support team.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <FeedbackBox userTier={user.tier} />
        <SupportBox userTier={user.tier} />
      </div>

      <div className="mt-12 space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-3">Frequently Asked Questions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">How do I upgrade my plan?</h4>
              <p className="text-muted-foreground">Visit the Upgrade page in the sidebar to see available plans and upgrade your account.</p>
            </div>
            <div>
              <h4 className="font-medium">How does email generation work?</h4>
              <p className="text-muted-foreground">Select strategies, fill in recipient details, and our AI will generate personalized cold emails based on proven outreach techniques.</p>
            </div>
            <div>
              <h4 className="font-medium">Can I search for contact information?</h4>
              <p className="text-muted-foreground">Pro and Light plan users can search for business contacts using our integrated prospect search tools.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}