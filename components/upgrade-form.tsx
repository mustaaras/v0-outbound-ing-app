"use client"

import { useCallback, useState, useEffect } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function UpgradeForm({
  productId,
  buttonLabel = "Upgrade Now",
  autoOpen = false,
}: {
  productId: string
  buttonLabel?: string
  autoOpen?: boolean
}) {
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    if (autoOpen) {
      setShowCheckout(true)
    }
  }, [autoOpen])

  const fetchClientSecret = useCallback(() => {
    return startCheckoutSession(productId)
  }, [productId])

  return (
    <>
      <Button className="w-full" onClick={() => setShowCheckout(true)}>
        <Crown className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Upgrade</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
