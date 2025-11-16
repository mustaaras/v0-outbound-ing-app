
# <img src="public/logos/logo-o-new-48.svg" alt="Outbound.ing Logo" width="48" height="48" style="vertical-align:middle;"/> Outbound.ing

Outbound.ing is an AI-powered SaaS platform for generating personalized outreach emails and finding business contacts. Built for sales teams, founders, and agencies who want to create effective communication and close more deals.

## Features

- **AI Email Generator:** Create personalized outreach emails using 100+ proven strategies, custom tone, length, and goals.
- **Advanced Contact Discovery:** Find businesses worldwide using Google Maps Places API with intelligent email extraction from websites.
- **Smart Email Validation:** Advanced filtering removes false positives and ensures high-quality contact data.
- **Tiered Access:** Free (30 emails/month), Light (300 emails/month), and Pro (unlimited) plans with premium features.
- **A/B Testing:** Generate 3 email variants for Pro users to optimize conversions.
- **Multi-Language Support:** Generate emails in any language (Pro feature).
- **Feedback & Support:** Built-in contact, support, and feedback system to improve quality and user experience.
- **Modern UI:** Next.js 16, React 19, Tailwind CSS, Radix UI, and dark mode support.

## Latest Advancements

- **Enhanced Contact Extraction:** JSON-LD structured data parsing for modern websites
- **Intelligent Email Validation:** Strict format validation filters out invalid contacts like file extensions and tracking domains
- **Improved Contact Detection:** Advanced algorithms find contact pages and retry logic for better success rates
- **Live Payment Processing:** Full Stripe integration with webhook handling for seamless subscriptions
- **Stable Infrastructure:** Error handling improvements prevent server crashes and ensure reliability

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- Stripe (subscriptions & webhooks)
- Vercel AI SDK (advanced AI models)
- Google Maps Places API (business search)
- Resend (email delivery)
- Tailwind CSS 4, Radix UI

## GIS / Contacts Database

This project includes a lightweight GIS/contact-discovery subsystem used to find businesses and extract contact information from the web. The core pieces are Google Maps Places searches, contact-page discovery, and the SQL scripts that create the `contacts` database used by the app.

Quick overview:
- Data sources: Google Maps Places API (business discovery) and optional third-party providers (Snov.io) for email enrichment.
- Storage: contacts are stored in the Postgres `contacts` table; migration scripts are in `scripts/` (look for `011_create_contacts_database.sql` and related saved buyers scripts).
- Validation: server-side rules and heuristics remove tracking addresses and false positives before persisting.

How to run the GIS/contact tools locally:
1. Add the required environment variables to `.env.local`:
	- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps Places key
	- `SNOV_API_KEY`, `SNOV_CLIENT_ID`, `SNOV_CLIENT_SECRET` (optional) — for Snov enrichment
2. Review and run the SQL migrations in `scripts/` using your Supabase/psql client to set up the `contacts` and related tables.
3. Use the built-in scripts and tools:
	- Client-side: open `public/contact-import-template.csv` for import templates.
	- Server-side utilities and libraries live in `lib/` (see `lib/contacts-db.ts`, `lib/snov.ts`).

Notes & recommendations:
- For production-grade GIS and high traffic, move caching and rate-limiting to a shared store (Redis) to avoid in-memory limits across instances.
- Use hashed filenames for public assets and long-lived Cache-Control headers so static assets (logos, OG images) can be cached safely by CDNs.
- If you need a separate, extended GIS README or example scripts, consider adding `docs/gis.md` with step-by-step extraction examples.

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

## Documentation

- **[User Guide](docs/user-guide.md)** - Complete guide for using Outbound.ing
- **[FAQ](docs/faq.md)** - Frequently asked questions
- **[Developer Docs](docs/README.md)** - Technical documentation

## Getting Started

1. Clone the repo
2. Install dependencies: `pnpm install`
3. Add your environment variables to `.env.local`
4. Start the dev server: `pnpm dev`

## For Users

New to Outbound.ing? Start with our [User Guide](docs/user-guide.md) for a complete walkthrough of all features.

## Logo

<!-- Logo variants for README and badges -->
![Outbound.ing Logo 48](public/logos/logo-o-new-48.svg "Outbound.ing")

Small variants (SVG):

- 32px: `public/logos/logo-o-new-32.svg`
- 48px: `public/logos/logo-o-new-48.svg`
- 128px: `public/logos/logo-o-new-128.svg`

If you need PNG exports, open `public/logo-converter.html` in the browser to download PNG sizes (client-side canvas exporter provided in tools).


## Contact & Support

- Use the contact page on the landing site for general inquiries
- Dashboard users can access support and feedback pages

## Feedback

We value your feedback! Use the dashboard feedback page to help us improve Outbound.ing.

---

© 2025 Outbound.ing. All rights reserved.
