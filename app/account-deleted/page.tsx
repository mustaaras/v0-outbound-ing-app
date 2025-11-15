export const metadata = {
  title: 'Account Deleted',
  description: 'Your account has been deleted',
}

export default function AccountDeletedPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <h1 className="text-3xl font-bold mb-4">Account deleted</h1>
      <p className="text-muted-foreground mb-6">
        Your account and all associated data have been permanently deleted from our systems. We're sorry to see you go.
      </p>

      <div className="space-y-4">
        <p>
          If you didn't request this deletion or believe this was done in error, please contact our support team at
          <a className="ml-1 underline" href={`mailto:${process.env.RESEND_REPLY_TO_EMAIL || 'support@outbound.ing'}`}>
            {process.env.RESEND_REPLY_TO_EMAIL || 'support@outbound.ing'}
          </a>
          .
        </p>

        <p>
          You can create a new account at{' '}
          <a className="underline" href={process.env.NEXT_PUBLIC_SITE_URL || '/'}>
            {process.env.NEXT_PUBLIC_SITE_URL || 'Home'}
          </a>
          .
        </p>
      </div>
    </div>
  )
}
