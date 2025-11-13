import { redirect } from "next/navigation"

export default function FeedbackRedirectPage() {
  // Redirect to the existing feedback page (group route)
  redirect('/feedback')
}
