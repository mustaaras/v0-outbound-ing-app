import { createBrowserClient } from "@supabase/ssr"

/**
 * Create a Supabase client for browser usage.
 *
 * In development it's common to forget to set environment variables which
 * causes an immediate runtime throw when components import this helper.
 * To make local development smoother we'll return a lightweight proxy that
 * throws a clear error when any method is used if the env vars are missing.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a proxy that throws when any property/method is accessed. This
    // prevents an immediate crash during render while still surfacing a
    // helpful error when the app actually tries to call Supabase methods.
    const message =
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server."

    const thrower = () => {
      throw new Error(message)
    }

    // Proxy will return a function that throws for any method access.
    return new Proxy(
      {},
      {
        get() {
          return thrower
        },
        apply() {
          return thrower()
        },
      },
    ) as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Helper to perform an OAuth sign-in that works across different
 * versions/shapes of the Supabase client API. Returns whatever the
 * underlying client method returns so callers can destructure { error }
 * as before.
 */
export async function oauthSignIn(supabase: any, provider: string, redirectTo?: string) {
  const options = redirectTo ? { redirectTo } : undefined

  // Modern API: supabase.auth.signInWithOAuth({ provider, options })
  if (supabase?.auth && typeof supabase.auth.signInWithOAuth === "function") {
    return supabase.auth.signInWithOAuth({ provider, options })
  }

  // Older API: supabase.auth.signIn({ provider }, { redirectTo })
  if (supabase?.auth && typeof supabase.auth.signIn === "function") {
    try {
      // Some older clients accept two args, others accept a single object.
      return await supabase.auth.signIn({ provider }, options ? { redirectTo: redirectTo } : undefined)
    } catch (e) {
      // If the call signature differs, try the single-arg form
      return await supabase.auth.signIn({ provider, redirectTo })
    }
  }

  // As a last resort, attempt provider-specific helpers
  if (supabase?.auth && typeof supabase.auth.signInWithProvider === "function") {
    return supabase.auth.signInWithProvider(provider, options)
  }

  throw new Error("Supabase client does not support OAuth sign-in in this environment")
}
