"use server"

import { createClient } from "@/lib/supabase/server"
import { errorLog, devLog } from "@/lib/logger"
import type { SnovBuyer } from "@/lib/snov"

export interface SaveBuyerInput {
  userId: string
  buyer: Pick<SnovBuyer, "email" | "first_name" | "last_name" | "company" | "title">
}

export interface SaveBuyerResult {
  success: boolean
  error?: string
}

export async function saveBuyer(input: SaveBuyerInput): Promise<SaveBuyerResult> {
  try {
    const supabase = await createClient()
    const email = (input.buyer.email || "").trim().toLowerCase()
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    const { error } = await supabase
      .from("saved_buyers")
      .upsert(
        {
          user_id: input.userId,
          email,
          first_name: input.buyer.first_name || null,
          last_name: input.buyer.last_name || null,
          company: input.buyer.company || null,
          title: input.buyer.title || null,
        },
        {
          onConflict: "user_id, email",
          ignoreDuplicates: true,
        },
      )

    if (error) {
      errorLog("[v0] saveBuyer error:", error)
      return { success: false, error: "Failed to save contact" }
    }

    devLog("[v0] Buyer saved:", { email, userId: input.userId })
    return { success: true }
  } catch (err) {
    errorLog("[v0] saveBuyer exception:", err)
    return { success: false, error: "Failed to save contact" }
  }
}
