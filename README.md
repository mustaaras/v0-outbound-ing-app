
# <img src="public/logos/logo-o-new.svg" alt="Outbound.ing Logo" width="48" height="48" style="vertical-align:middle;"/> Outbound.ing

Outbound.ing is an AI-powered SaaS platform for generating high-converting cold email templates and searching for buyers. Built for sales teams, founders, and agencies who want to personalize outreach and close more deals.

## Features

- **AI Email Generator:** Create personalized cold emails using 100+ proven strategies, custom tone, length, and goals.
- **Tiered Access:** Free, Light, and Pro plans with usage limits and premium features.
- **Buyer Search:** Find and enrich prospects with Snov.io integration.
- **Feedback & Support:** Built-in contact, support, and feedback system to improve quality and user experience.
- **Modern UI:** Next.js 16, React 19, Tailwind CSS, Radix UI, and dark mode support.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- Stripe (subscriptions)
- OpenAI GPT-4o-mini (via Vercel AI SDK)
- Snov.io API (prospect search)
- Resend (email delivery)
- Tailwind CSS 4, Radix UI

## Directory Structure

```
app/
	(dashboard)/
		dashboard/
		generator/
		search-buyers/
		archive/
		settings/
		pricing/
		support/
		feedback/
	actions/
	api/
	auth/
	...
components/
lib/
public/
scripts/
styles/
tools/
```

## Getting Started

1. Clone the repo
2. Install dependencies: `pnpm install`
3. Add your environment variables to `.env.local`
4. Start the dev server: `pnpm dev`

## Logo

![Outbound.ing Logo](public/logos/logo-o-new.svg)

## Contact & Support

- Use the contact page on the landing site for general inquiries
- Dashboard users can access support and feedback pages

## Feedback

We value your feedback! Use the dashboard feedback page to help us improve Outbound.ing.

---

© 2025 Outbound.ing. All rights reserved.
