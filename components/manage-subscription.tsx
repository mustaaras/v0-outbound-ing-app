"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { createPortalSession } from "@/app/actions/stripe"
import { useState } from "react"
import { errorLog } from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"

export function ManageSubscription() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleManage = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleManage} disabled={isLoading} variant="outline">
      <Settings className="mr-2 h-4 w-4" />
      {isLoading ? "Loading..." : "Manage Subscription"}
    </Button>
  )
}
