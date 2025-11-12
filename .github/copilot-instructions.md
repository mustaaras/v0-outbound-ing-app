# Outbound.ing - AI Copilot Instructions

## Project Overview
This is a Next.js 16 SaaS application for generating cold email templates using AI. Users can create personalized outreach emails using 101+ strategies, with tier-based features (Free, Light, Pro). Built with Next.js App Router, Supabase, Stripe, OpenAI, and various third-party APIs.

## Architecture

### Core Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4o-mini via Vercel AI SDK
- **Payments**: Stripe (subscriptions + webhooks)
- **Email**: Resend + React Email
- **Styling**: Tailwind CSS 4, Radix UI components
- **Package Manager**: pnpm

### Directory Structure
```
app/
  (dashboard)/          # Protected routes with shared layout
    dashboard/          # Main dashboard
    generator/          # Email generation form
    search-buyers/      # Prospect search (Snov.io integration)
    archive/            # Saved templates
    settings/           # User settings
    pricing/            # Pricing page
  actions/              # Server actions (generate.ts, search-buyers.ts, etc.)
  api/                  # API routes (webhooks/stripe/, user/)
  auth/                 # Auth pages (login, signup, callback)
lib/
  supabase/             # Three Supabase clients: client.ts, server.ts, middleware.ts
  email/                # Email utilities (resend.ts, send.ts)
  auth-utils.ts         # User authentication & usage tracking
  stripe.ts             # Lazy Stripe client initialization
  snov.ts               # Snov.io API client for prospect search
  types.ts              # Shared TypeScript types
components/             # React components (mostly client-side)
scripts/                # SQL migration scripts (001_*.sql - 018_*.sql)
```

### Authentication Pattern
- **Three Supabase clients** based on context:
  - `lib/supabase/client.ts` - Browser client (client components)
  - `lib/supabase/server.ts` - Server client (server components/actions)
  - `lib/supabase/middleware.ts` - Middleware client (session refresh)
- **Protected routes**: `(dashboard)` folder requires auth via `layout.tsx` checking `getCurrentUser()`
- **User type**: Extended from `auth.users` with custom `users` table including `tier`, `stripe_customer_id`, etc.

### Data Models (See `lib/types.ts`)
- **UserTier**: `"free" | "light" | "pro"` (note: "ultra" deprecated, treated as "pro")
- **Tier Limits**:
  - Free: 30 emails/month, 60 public email searches
  - Light: 300 emails/month, unlimited public email searches
  - Pro: Unlimited emails, 100 Snov searches/month, A/B variants, multi-language
- **Strategy**: AI prompts with tier restrictions, categorized by industry
- **Template**: User-generated emails with strategy references, recipient data, and full text
- **Usage Tracking**: Monthly counters in `usage`, `snov_searches`, `public_email_searches` tables

### Database Migrations
- Sequential SQL scripts in `scripts/` (001-018)
- Run via Supabase SQL editor or CLI
- Key migrations: initial schema, tier additions, saved buyers, email searches

## Development Workflows

### Running Locally
```bash
pnpm install
pnpm dev              # Starts Next.js on http://localhost:3000
```

### Environment Variables Required
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Only for webhooks

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# OpenAI (via Vercel AI SDK)
OPENAI_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=

# Snov.io (Prospect Search)
SNOV_API_KEY=                   # Or use OAuth:
SNOV_CLIENT_ID=
SNOV_CLIENT_SECRET=
SNOV_TOKEN_URL=

# Optional
NEXT_PUBLIC_SITE_URL=
```

### Building & Deployment
```bash
pnpm build            # Production build
pnpm start            # Start production server
```
**Deployed on Vercel** - pushes to `main` auto-deploy

## Code Conventions

### Server Actions Pattern
- All actions in `app/actions/` with `"use server"` directive
- Authentication check first: `const user = await getCurrentUser()`
- Usage validation: `canGenerateTemplate()`, `canPerformSearch()`
- Increment counters after successful operations: `incrementUsage()`, `incrementSearchCount()`
- Error handling: Use `lib/logger.ts` (`errorLog`, `devLog`)

Example from `generate.ts`:
```typescript
"use server"

export async function generateTemplate(input: GenerateTemplateInput) {
  const supabase = await createClient()
  const { data: user } = await supabase.from("users").select("tier").eq("id", input.userId).single()
  
  const { canGenerate } = await canGenerateTemplate(input.userId, user.tier)
  if (!canGenerate) throw new Error("Monthly usage limit reached...")
  
  // Generate with OpenAI
  const { text } = await generateText({ model: "openai/gpt-4o-mini", prompt, temperature: 0.8 })
  
  // Save to DB
  await supabase.from("templates").insert({ ... })
  
  // Track usage
  await incrementUsage(input.userId)
  
  return { result: text }
}
```

### Component Patterns
- **Client components**: Use `"use client"` directive, live in `components/`
- **Form handling**: React Hook Form + Zod validation (not yet fully implemented)
- **Toasts**: Use `useToast()` hook from `hooks/use-toast.ts`
- **Premium features**: Check `user.tier` and show upgrade prompts (Crown icon)
- **Loading states**: Track with `isLoading` state, show `<Loader2>` icon

### Styling Conventions
- Tailwind utility classes, no custom CSS files (except `globals.css` for Radix overrides)
- Responsive: Mobile-first, use `md:`, `lg:` breakpoints
- Dark mode: Uses `next-themes` provider, components auto-adapt via Tailwind dark variants

### Error Handling
- Use `lib/logger.ts`: `errorLog()` for errors, `devLog()` for debug (dev only)
- Client-side: Show toast notifications
- Server-side: Throw descriptive errors, caught by client

## Key Integration Points

### Stripe Webhooks (`app/api/webhooks/stripe/route.ts`)
- Handles `checkout.session.completed` → upgrades user tier, sends confirmation email
- Handles `customer.subscription.updated`, `customer.subscription.deleted` → tier updates
- Signature verification required: `STRIPE_WEBHOOK_SECRET`

### OpenAI Integration (`app/actions/generate.ts`)
- Uses Vercel AI SDK: `generateText()` from `"ai"` package
- Model: `"openai/gpt-4o-mini"`, temperature: `0.8`
- Prompt construction: Combines strategy prompts, user inputs, tone/length/goal/language
- A/B variants (Pro): Generates 3 variants with different modifiers

### Snov.io Prospect Search (`lib/snov.ts`)
- Task-based API: Start search → Poll for results → Fetch emails
- Two modes: `domain` (direct company domain) or `keyword` (resolves domain from company name)
- Email enrichment: Falls back to `search-emails` API if no direct email
- Rate limiting: Pro users get 100 searches/month, tracked in `snov_searches` table

### Email System (`lib/email/`)
- **Resend client**: Lazy-loaded in `resend.ts` (avoids build errors when missing API key)
- **Templates**: React components in `emails/` (welcome, subscription, usage warnings)
- **Sending**: `send.ts` exports `sendWelcomeEmail()`, `sendSubscriptionEmail()`, `sendUsageWarningEmail()`
- Triggers: Signup (welcome), subscription webhook (confirmation), usage thresholds (80%, 100%)

## Testing

### Manual Testing
- Use `scripts/test-snov-*.ts` for Snov.io API validation
- Stripe: Use test mode cards (4242 4242 4242 4242)
- Webhooks: Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### No Automated Tests
Currently no test suite. Add tests for:
- Server actions (generate, search-buyers)
- Stripe webhook handling
- Usage limit enforcement

## Common Tasks

### Adding a New Strategy
1. Add entry to `strategies` table (manual or via Supabase dashboard)
2. Ensure `tier` is set correctly (`free`, `light`, or `pro`)
3. Strategy auto-appears in generator form (grouped by category)

### Adding a New User Tier
1. Update `lib/types.ts`: Add to `UserTier` type, `TIER_LIMITS`, `SNOV_SEARCH_LIMITS`
2. Add migration script in `scripts/`
3. Update `lib/products.ts` for Stripe products
4. Update UI components checking `user.tier`

### Modifying Email Templates
1. Edit React components in `emails/`
2. Preview with: `pnpm run email:dev` (if script exists)
3. Deploy changes via Git push

### Database Schema Changes
1. Create new migration: `scripts/0XX_description.sql`
2. Run in Supabase SQL editor
3. Update `lib/types.ts` if types change
4. Update RLS policies if needed (see existing migrations)

## Troubleshooting

### "User not found" / Auth Issues
- Check Supabase session in middleware
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure user exists in both `auth.users` and `users` table

### Stripe Webhook Failures
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook signature verification in logs
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (bypasses RLS)

### AI Generation Errors
- Verify `OPENAI_API_KEY` is valid
- Check usage limits on OpenAI account
- Inspect prompt in logs (look for malformed input)

### Snov.io Search Returns Empty
- Check domain format (remove `https://`, `www.`, trailing slashes)
- Verify API credentials (`SNOV_API_KEY` or OAuth tokens)
- Inspect task polling logs (`devLog` outputs)

## Project Context

### Business Logic
- **Email generation**: AI combines multiple strategies into one cohesive email
- **Usage tracking**: Per-user, per-month counters; enforced before generation
- **Tiered access**: Strategies and features gated by subscription tier
- **Buyer search**: Integration with Snov.io for lead enrichment (Pro users)
- **Multi-language**: Pro users can generate emails in any language (specified in prompt)

### Why This Structure?
- **App Router**: Server components by default reduce client JS, improve SEO
- **Server actions**: Direct DB access without API routes (except webhooks)
- **Three Supabase clients**: Required by Supabase SSR pattern for proper cookie handling
- **Lazy Stripe/Resend**: Prevents build failures when secrets missing locally

### Migration Notes
- **Deprecated "ultra" tier**: Now maps to "pro" tier (see `auth-utils.ts`)
- **"Digital" category**: Replaced with "Affiliate" then "Ecommerce" (see migration scripts)
- **Saved buyers**: Feature added in scripts 012-016, allows archiving prospects
