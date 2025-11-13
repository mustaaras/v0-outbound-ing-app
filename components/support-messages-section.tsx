"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Reply } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminReplyForm } from "@/components/admin-reply-form"
import { Button } from "@/components/ui/button"

interface SupportMessage {
  id: string
  message: string
  created_at: string
  user_id: string
  users: {
    email: string
    tier: string
  }[]
}

interface SupportMessagesSectionProps {
  supportMessages: SupportMessage[]
}

export function SupportMessagesSection({ supportMessages }: SupportMessagesSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleReplySent = () => {
    setReplyingTo(null)
    // In a real app, you'd refetch the data here
    window.location.reload()
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Support Messages
        </CardTitle>
        <CardDescription>Latest support requests from users</CardDescription>
      </CardHeader>
      <CardContent>
        {supportMessages && supportMessages.length > 0 ? (
          <div className="space-y-4">
            {supportMessages.map((msg: SupportMessage) => (
              <div key={msg.id} className="border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {msg.users?.[0]?.email || `User ID: ${msg.user_id}` || 'Unknown User'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {msg.users?.[0]?.tier || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{msg.message}</p>
                {msg.user_id && !msg.users?.[0]?.email && (
                  <p className="text-xs text-red-500 mt-1">⚠️ User data not found</p>
                )}

                {replyingTo === msg.id && (
                  <AdminReplyForm
                    supportMessageId={msg.id}
                    userEmail={msg.users?.[0]?.email || 'unknown'}
                    onReplySent={handleReplySent}
                    onCancel={() => setReplyingTo(null)}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No support messages yet</p>
        )}
      </CardContent>
    </Card>
  )
}