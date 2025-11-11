"use client"

import { useEffect, useState } from "react"
import { devLog, errorLog } from "@/lib/logger"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { updateUserTier } from "@/app/actions/update-tier"
import { useRouter } from "next/navigation"

export function SuccessPageClient({
  sessionId,
  productId,
  userId,
}: {
  sessionId?: string
  productId?: string
  userId?: string
}) {
  const [isUpdating, setIsUpdating] = useState(!!productId && !!userId)
  const [tierUpdated, setTierUpdated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function updateTier() {
      if (!productId || !userId) {
        devLog("[v0] Client: Missing productId or userId")
        setIsUpdating(false)
        return
      }

      devLog("[v0] Client: Starting tier update for:", { userId, productId })

      try {
        const result = await updateUserTier(userId, productId)

        if (result.success) {
          devLog("[v0] Client: Tier updated successfully to:", result.tier)
          setTierUpdated(true)
          // Refresh the page data
          router.refresh()
        } else {
          errorLog("[v0] Client: Failed to update tier:", result.error)
          setError(result.error || "Failed to update subscription")
        }
      } catch (err) {
        errorLog("[v0] Client: Exception during tier update:", err)
        setError("An unexpected error occurred")
      }

      setIsUpdating(false)
    }

    updateTier()
  }, [productId, userId, router])

  const product = PRODUCTS.find((p) => p.id === productId)
  const tierName = product?.name || "Premium"

  if (isUpdating) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="text-center text-lg font-medium">Activating Your Subscription...</p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Please wait while we set up your {tierName} plan
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Subscription Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/upgrade">Back to Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Welcome to {tierName}!</CardTitle>
          <CardDescription>
            Your subscription is now active. Enjoy {product?.features[0] || "unlimited emails"} and all premium
            features!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/generator">Start Generating</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
