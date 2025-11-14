import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OAuthHandler from './oauth-handler'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    return <OAuthHandler />
  }
}
