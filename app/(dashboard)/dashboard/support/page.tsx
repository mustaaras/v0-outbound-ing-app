import { redirect } from "next/navigation"

export default function SupportRedirectPage() {
  // Redirect to the existing support page (group route)
  redirect('/support')
}
