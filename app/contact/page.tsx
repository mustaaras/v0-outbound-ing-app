"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { submitContactMessage } = await import("@/app/actions/contact");
      await submitContactMessage({ name, email, message });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
    }
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      {submitted ? (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">Thank you for reaching out! We'll get back to you soon.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="How can we help you?" rows={5} />
          </div>
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      )}
    </div>
  );
}
