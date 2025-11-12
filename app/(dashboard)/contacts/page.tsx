import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ContactsList from "@/components/contacts-list"

export default async function ContactsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user tier
  const { data: userData } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .single()

  const userTier = userData?.tier || "free"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Contacts</h1>
        <p className="text-muted-foreground">
          Manage your saved contacts and companies
        </p>
      </div>

      <ContactsList userTier={userTier} />
    </div>
  )
}
