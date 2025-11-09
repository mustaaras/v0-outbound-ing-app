import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { createClient } from "@/lib/supabase/server" // Fixed import name

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient() // Using correct function name
  const { data: authUser } = await supabase.auth.getUser()

  // User has password if they signed up with email provider
  const hasPassword = authUser.user?.app_metadata?.provider === "email"

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <SettingsForm user={user} hasPassword={hasPassword} />
    </div>
  )
}
