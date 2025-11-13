"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Reply, ChevronDown, ChevronRight, User, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminReplyForm } from "@/components/admin-reply-form"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

interface AdminReply {
  id: string
  message: string
  created_at: string
  support_message_id: string
}

interface ConversationThread {
  user_id: string
  user_email: string
  user_tier: string
  messages: Array<{
    id: string
    type: 'user' | 'admin'
    message: string
    created_at: string
  }>
}

interface SupportMessagesSectionProps {
  supportMessages: SupportMessage[]
  adminReplies?: AdminReply[]
}

export function SupportMessagesSection({ supportMessages, adminReplies = [] }: SupportMessagesSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleReplySent = () => {
    setReplyingTo(null)
    // In a real app, you'd refetch the data here
    window.location.reload()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Group messages by user and create conversation threads
  const conversationThreads: ConversationThread[] = []

  // Group by user
  const userGroups = new Map<string, SupportMessage[]>()
  supportMessages.forEach(msg => {
    if (!userGroups.has(msg.user_id)) {
      userGroups.set(msg.user_id, [])
    }
    userGroups.get(msg.user_id)!.push(msg)
  })

  // Create conversation threads
  userGroups.forEach((messages, userId) => {
    const userEmail = messages[0]?.users?.[0]?.email || `User ID: ${userId}`
    const userTier = messages[0]?.users?.[0]?.tier || 'unknown'

    const threadMessages: Array<{
      id: string
      type: 'user' | 'admin'
      message: string
      created_at: string
    }> = []

    // Add user messages
    messages.forEach(msg => {
      threadMessages.push({
        id: msg.id,
        type: 'user',
        message: msg.message,
        created_at: msg.created_at
      })

      // Add admin replies for this message
      const replies = adminReplies.filter(reply => reply.support_message_id === msg.id)
      replies.forEach(reply => {
        threadMessages.push({
          id: reply.id,
          type: 'admin',
          message: reply.message,
          created_at: reply.created_at
        })
      })
    })

    // Sort messages chronologically
    threadMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    conversationThreads.push({
      user_id: userId,
      user_email: userEmail,
      user_tier: userTier,
      messages: threadMessages
    })
  })

  // Sort threads by most recent message
  conversationThreads.sort((a, b) => {
    const aLatest = Math.max(...a.messages.map(m => new Date(m.created_at).getTime()))
    const bLatest = Math.max(...b.messages.map(m => new Date(m.created_at).getTime()))
    return bLatest - aLatest
  })

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Support Conversations
        </CardTitle>
        <CardDescription>Chat threads with users</CardDescription>
      </CardHeader>
      <CardContent>
        {conversationThreads && conversationThreads.length > 0 ? (
          <Accordion type="multiple" className="space-y-4">
            {conversationThreads.map((thread) => {
              const latestMessage = thread.messages[thread.messages.length - 1]
              const hasNewMessages = thread.messages.some(msg => msg.type === 'user' && !adminReplies.some(reply => reply.support_message_id === msg.id))

              return (
                <AccordionItem key={thread.user_id} value={thread.user_id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{thread.user_email}</span>
                          <Badge variant="outline" className="text-xs">
                            {thread.user_tier}
                          </Badge>
                          {hasNewMessages && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {thread.messages.length} messages • Last: {formatTime(latestMessage.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setReplyingTo(replyingTo === thread.user_id ? null : thread.user_id)
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {thread.messages.map((msg) => (
                      <div
                        key={`${msg.type}-${msg.id}`}
                        className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.type === 'admin' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            msg.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${
                            msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                        {msg.type === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {replyingTo === thread.user_id && (
                      <AdminReplyForm
                        supportMessageId={latestMessage.id} // Reply to the latest user message
                        userEmail={thread.user_email}
                        onReplySent={handleReplySent}
                        onCancel={() => setReplyingTo(null)}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No support conversations yet</p>
        )}
      </CardContent>
    </Card>
  )
}