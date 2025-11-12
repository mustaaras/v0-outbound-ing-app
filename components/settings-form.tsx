"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Mail, Shield, Loader2, CreditCard, AlertTriangle, Trash2 } from "lucide-react"
import type { User } from "@/lib/types"
import { TIER_LIMITS } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { errorLog } from "@/lib/logger"
import { changePassword } from "@/app/actions/change-password"
import { createPortalSession, cancelSubscription } from "@/app/actions/stripe"
import { deleteAccount } from "@/app/actions/delete-account"
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
import { useRouter } from "next/navigation"

interface SettingsFormProps {
  user: User
  hasPassword: boolean
  renewalDate?: string | null
}

export function SettingsForm({ user, hasPassword, renewalDate }: SettingsFormProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isManagingSubscription, setIsManagingSubscription] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const { toast } = useToast()
  const router = useRouter()

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
      setShowPasswordSuccess(true)
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
          description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel subscription",
          variant: "destructive",
        })
        setIsCancellingSubscription(false)
      }
    } catch (error) {
      errorLog("Failed to cancel subscription:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      })
      setIsCancellingSubscription(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      })
      return
    }

    setIsDeletingAccount(true)
    
    try {
      const result = await deleteAccount(user.id)
      
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account and all data have been permanently deleted.",
        })
        // Redirect to home page after a brief delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        })
        setIsDeletingAccount(false)
      }
    } catch (error) {
      errorLog("Failed to delete account:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
      setIsDeletingAccount(false)
    }
  }

  const isPaidUser = user.tier !== "free"
  const monthlyLimit = TIER_LIMITS[user.tier]

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details and subscription status</CardDescription>
            </div>
            {isPaidUser && <Crown className="h-8 w-8 text-yellow-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>

          <div>
            <Label>Current Plan</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={user.tier === "free" ? "secondary" : "default"} className="capitalize">
                {user.tier === "free" ? "Free" : user.tier === "light" ? "Light" : "Pro"}
              </Badge>
              {monthlyLimit === 999999 ? (
                <span className="text-sm text-muted-foreground">Unlimited emails per month</span>
              ) : (
                <span className="text-sm text-muted-foreground">{monthlyLimit} emails per month</span>
              )}
            </div>
          </div>

          {renewalDate && (
            <div>
              <Label>Next Renewal Date</Label>
              <div className="text-sm text-muted-foreground">{renewalDate}</div>
            </div>
          )}

          {user.first_name && (
            <div>
              <Label>Name</Label>
              <div className="text-sm text-muted-foreground">
                {user.first_name} {user.last_name || ""}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {isPaidUser && user.stripe_customer_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Management
            </CardTitle>
            <CardDescription>Manage your billing and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleManageSubscription} disabled={isManagingSubscription} variant="outline">
                {isManagingSubscription ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  "Manage Billing"
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isCancellingSubscription}>
                    {isCancellingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You'll retain access until the end of your
                      current billing period, after which your account will be downgraded to the Free plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription}>Yes, Cancel</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change */}
      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
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

      {/* Danger Zone - Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account, cancel
              any active subscriptions, and remove all your data including:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>All generated email templates</li>
              <li>Saved contacts and buyers</li>
              <li>Usage history and statistics</li>
              <li>Account settings and preferences</li>
            </ul>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAccount}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Delete Account Permanently?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  {isPaidUser && (
                    <p className="font-semibold">
                      Your active subscription will be cancelled immediately and you will not be refunded for the
                      remaining time in your billing period.
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm">Type DELETE to confirm:</Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="font-mono"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Password Change Success Dialog */}
      <AlertDialog open={showPasswordSuccess} onOpenChange={setShowPasswordSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Changed Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Your password has been updated. You can now use your new password to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
