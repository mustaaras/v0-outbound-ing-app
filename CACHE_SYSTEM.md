# Email Cache System

## Overview
This system caches found email addresses to:
- Speed up repeated searches (instant results for cached domains)
- Build our own contact database over time
- Reduce scraping load and API calls

## Setup

### 1. Run the Migration
Go to your Supabase project SQL editor and run:
```sql
scripts/019_add_email_cache.sql
```

This creates the `email_cache` table with:
- Unique constraint on (email, domain)
- Indexes for fast lookups
- RLS policies for security
- Automatic timestamp tracking

### 2. How It Works

**When user searches:**
1. Check cache for known domains → instant results
2. Search only new/uncached domains
3. Save newly found emails to cache
4. Return combined results (cached + new)

**Example:**
- First search "web3" → finds 20 emails, takes 30s, caches all
- Second search "web3" → returns same 20 emails instantly from cache
- New search "blockchain" → finds 15 new emails, caches them too

### 3. Cache Fields

- `domain` - Company domain
- `email` - Email address
- `email_type` - "generic" or "personal"
- `source_url` - Where it was found (URL or "DNS TXT record")
- `verification_count` - How many times found (higher = more reliable)
- `is_valid` - False if email bounces/becomes invalid
- `found_at` - When first discovered
- `last_verified` - When last seen

### 4. Benefits

**For Users:**
- ⚡ Instant results for popular keywords
- 📈 More results over time as database grows
- 💰 Uses their search quota only for new domains

**For Us:**
- 🗄️ Build proprietary contact database
- 📊 Track which emails are most reliable
- 🚀 Scale without proportional infrastructure costs

### 5. Maintenance

The cache automatically:
- Deduplicates by (email, domain)
- Increments `verification_count` when email found again
- Stores only valid emails (is_valid = true)

To invalidate bad emails (future feature):
```sql
UPDATE email_cache 
SET is_valid = false 
WHERE email = 'bounced@example.com';
```

To see cache stats:
```sql
SELECT 
  COUNT(*) as total_emails,
  COUNT(DISTINCT domain) as unique_domains,
  AVG(verification_count) as avg_verifications
FROM email_cache 
WHERE is_valid = true;
```

## Code Changes

- `lib/public-email.ts` - Added `getCachedEmails()` and `cacheEmails()` functions
- `extractPublicEmailsEnhanced()` - Now checks cache first, saves new results
- No API changes - transparent to users
