"use client"
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, User, Shield } from "lucide-react";
import { getSupportConversations } from "@/app/actions/support";

type ConversationMessage = {
  id: string
  type: 'user' | 'admin'
  message: string
  created_at: string
  support_message_id: string
}

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);
    try {
      const data = await getSupportConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { submitSupportMessage } = await import("@/app/actions/support")
      await submitSupportMessage({ message });
      setMessage("");
      // Reload conversations to show the new message
      await loadConversations();
    } catch (err: any) {
      setError(err?.message || "Failed to send support message.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Chat</h1>
          <p className="text-muted-foreground">Get help from our support team</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat History */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading conversations...</div>
              ) : conversations.length > 0 ? (
                conversations.map((msg) => (
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
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
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
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start a conversation below!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Send Message */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{error}</div>}
                <div>
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    placeholder="Type your message here..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !message.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
