# Email System Setup Instructions

## Installation Steps

### 1. Install Node.js and pnpm

First, install Node.js (which includes npm):
- Visit https://nodejs.org/ and download the LTS version
- Or use Homebrew: `brew install node`

Then install pnpm globally:
```bash
npm install -g pnpm
```

### 2. Install Email Dependencies

Navigate to your project directory and install the packages:
```bash
cd /Users/aras/Documents/v0-outbound-ing-app/v0-outbound-ing-app
pnpm install resend react-email @react-email/components
```

### 3. Get Resend API Key

1. Sign up for Resend at https://resend.com
2. Verify your domain or use their test domain
3. Create an API key from the dashboard
4. Copy the API key

### 4. Configure Environment Variables

Add these to your `.env.local` file:
```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Outbound.ing <noreply@yourdomain.com>
```

Note: For testing, you can use Resend's test domain: `onboarding@resend.dev`

### 5. Verify Installation

After installing packages, commit the email system files:
```bash
git add -A
git commit -m "Add email system with Resend and React Email templates"
git push origin main
```

## Email Templates Created

1. **Welcome Email** (`emails/welcome.tsx`)
   - Sent when users sign up
   - Includes feature overview and CTA to dashboard

2. **Subscription Confirmation** (`emails/subscription-confirmation.tsx`)
   - Sent when users subscribe to a paid plan
   - Includes plan details and billing info

3. **Subscription Cancelled** (inline HTML)
   - Sent when users cancel their subscription
   - Includes access end date and downgrade info

## Email Triggers

Emails are automatically sent for:
- ✅ User signup (welcome email)
- ✅ Subscription created (via Stripe webhook)
- ✅ Subscription cancelled
- 🔄 Additional events can be added as needed

## Testing Emails

Before sending to real users, test with Resend's preview:
```bash
pnpm run email:dev
```

This will open a preview of all email templates at http://localhost:3000

## What's Implemented

- ✅ Terms & Privacy acceptance checkbox on signup
- ✅ Email infrastructure with Resend
- ✅ React Email templates
- ✅ Email sending functions
- ✅ Integration with Stripe webhooks
- ⏳ Welcome email on signup (waiting for Node.js install)

## Next Steps

After installing Node.js and the packages:
1. Get Resend API key and configure env vars
2. Test email sending
3. Deploy to Vercel (env vars will be added there too)
