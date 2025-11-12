"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Mail, Shield, Loader2, CreditCard, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/types"
import { TIER_LIMITS } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { errorLog } from "@/lib/logger"
import { changePassword } from "@/app/actions/change-password"
import { sendTestEmail } from "@/app/actions/send-test-email"
import { createPortalSession, cancelSubscription } from "@/app/actions/stripe"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SettingsFormProps {
  user: User
  hasPassword: boolean
}

export function SettingsForm({ user, hasPassword }: SettingsFormProps) {
  // Simple admin check: only show cost tracking to specific email
  const isAdmin = user.email === "aras@yourdomain.com" // Change to your admin email
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const { toast } = useToast()

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    const result = await changePassword(newPassword)

    if (result.success) {
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to change password",
        variant: "destructive",
      })
    }

    setIsChangingPassword(false)
  }

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true)
    try {
      const url = await createPortalSession()
      window.location.href = url
    } catch (error) {
      errorLog("Failed to create portal session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open subscription portal",
        variant: "destructive",
      })
      setIsManagingSubscription(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsCancellingSubscription(true)
    try {
      const result = await cancelSubscription()
      if (result.success) {
        toast({
          title: "Subscription Cancelled",
          description:
            "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        })
        // Refresh page to show updated status
        window.location.reload()
      } else {
        throw new Error(result.error || "Failed to cancel subscription")
      }
    } catch (error) {
      errorLog("Failed to cancel subscription:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  const getTierDisplay = () => {
    const limit = TIER_LIMITS[user.tier]

    switch (user.tier) {
      case "free":
        return {
          label: "Free Plan",
          description: `${limit} templates/month`,
          variant: "secondary" as const,
          icon: null,
        }
      case "light":
        return {
          label: "Light Plan",
          description: `${limit} templates/month`,
          variant: "default" as const,
          icon: <Crown className="mr-1 h-4 w-4" />,
        }
      case "pro":
        return {
          label: "Pro Plan",
          description: `${limit} templates/month`,
          variant: "default" as const,
          icon: <Crown className="mr-1 h-4 w-4" />,
        }
      // removed ultra tier
      default:
        return {
          label: "Unknown Plan",
          description: "",
          variant: "secondary" as const,
          icon: null,
        }
    }
  }

  const tierDisplay = getTierDisplay()

  const hasPaidSubscription = user.tier !== "free" && user.stripe_customer_id

  const handleSendTestEmail = async () => {
    try {
      setIsSendingTest(true)
      const res = await sendTestEmail()
      if (res.success) {
        toast({ title: "Test email sent", description: "Check your inbox for a welcome email." })
      } else {
        const desc = typeof res.error === "string" ? res.error : "Unknown error"
        toast({ title: "Failed to send", description: desc, variant: "destructive" })
      }
    } catch (e) {
      errorLog("sendTestEmail UI error:", e)
      toast({ title: "Failed to send", description: "Unexpected error", variant: "destructive" })
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cost Tracking (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-700" />
              Cost Tracking (Admin Only)
            </CardTitle>
            <CardDescription>Estimated monthly costs for infrastructure and AI usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <div>
                <span className="font-semibold">Vercel:</span> ~$20/month (Pro tier, adjust as needed)
              </div>
              <div>
                <span className="font-semibold">Supabase:</span> ~$25/month (Starter tier, adjust as needed)
              </div>
              <div>
                <span className="font-semibold">AI Gateway:</span> Usage-based, e.g. $0.60/user/month (estimate)
              </div>
              <div className="text-xs text-muted-foreground">Update these numbers as your usage grows. Expand for more detail as needed.</div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and subscription status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={user.email} disabled className="bg-muted" />
              <Button size="sm" variant="outline" className="bg-transparent" onClick={handleSendTestEmail} disabled={isSendingTest}>
                {isSendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>Send test email</>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div>
            <Label>Subscription Plan</Label>
            <div className="mt-2">
              <Badge className="text-sm" variant={tierDisplay.variant}>
                {tierDisplay.icon}
                {tierDisplay.label} - {tierDisplay.description}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {hasPaidSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleManageSubscription}
                disabled={isManagingSubscription}
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                {isManagingSubscription ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing & Payment
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto" disabled={isCancellingSubscription}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your subscription. You'll retain access to your current plan until the end of
                      your billing period, after which you'll be moved to the Free plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isCancellingSubscription ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Yes, Cancel Subscription"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
