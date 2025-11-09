import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SuccessPageClient } from "@/components/success-page-client"

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; product_id?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <SuccessPageClient sessionId={params.session_id} productId={params.product_id} userId={user.id} />
}
