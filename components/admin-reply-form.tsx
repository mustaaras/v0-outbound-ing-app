"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Send, X } from "lucide-react"
import { sendAdminReply } from "@/app/actions/admin-reply"
import { useToast } from "@/hooks/use-toast"

interface AdminReplyFormProps {
  supportMessageId: string
  userEmail: string
  onReplySent?: () => void
  onCancel?: () => void
}

export function AdminReplyForm({
  supportMessageId,
  userEmail,
  onReplySent,
  onCancel
}: AdminReplyFormProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await sendAdminReply(supportMessageId, message)

      if (result.success) {
        toast({
          title: "Reply sent",
          description: "Your reply has been sent to the user",
        })
        setMessage("")
        onReplySent?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send reply",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Reply to {userEmail}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Type your reply message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={isLoading}
          />
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !message.trim()}
            >
              <Send className="h-4 w-4 mr-1" />
              {isLoading ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}