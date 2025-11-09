"use server"

import { createClient } from "@/lib/supabase/server"
import { PRODUCTS } from "@/lib/products"
import { revalidatePath } from "next/cache"

export async function updateUserTier(userId: string, productId: string) {
  console.log("[v0] updateUserTier called:", { userId, productId })

  const product = PRODUCTS.find((p) => p.id === productId)

  if (!product) {
    console.error("[v0] Product not found:", productId)
    return { success: false, error: "Product not found" }
  }

  console.log("[v0] Found product:", { name: product.name, tier: product.tier })

  const supabase = await createClient()

  // First, verify the user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("id, email, tier")
    .eq("id", userId)
    .single()

  if (fetchError || !existingUser) {
    console.error("[v0] User not found:", fetchError)
    return { success: false, error: "User not found" }
  }

  console.log("[v0] Current user tier:", existingUser.tier)

  // Update the tier
  const { data, error } = await supabase.from("users").update({ tier: product.tier }).eq("id", userId).select().single()

  if (error) {
    console.error("[v0] Failed to update tier:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Successfully updated tier:", data)

  // Revalidate relevant paths
  revalidatePath("/dashboard")
  revalidatePath("/generator")
  revalidatePath("/upgrade")

  return { success: true, tier: product.tier, data }
}
