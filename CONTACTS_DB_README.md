# Contacts Database

This directory contains the custom contacts database implementation for managing your own contact lists and reducing dependency on third-party APIs.

## Database Schema

### Tables

1. **companies**
   - Stores company information
   - Fields: name, domain, industry, company_size, location, description, website, linkedin_url
   - Unique constraint on domain

2. **contacts**
   - Stores individual contact information
   - Fields: email (unique), first_name, last_name, title, department, phone, linkedin_url, is_verified, verification_date, source
   - Foreign key to companies table
   - Source can be: manual, snov, public_finder, imported, api

3. **user_saved_contacts**
   - Junction table linking users to contacts
   - Fields: user_id, contact_id, notes, tags, last_contacted_at, status
   - Status can be: new, contacted, replied, converted, unsubscribed
   - Allows users to add personal notes and tags to contacts

4. **contact_search_history**
   - Tracks user search queries for analytics
   - Fields: user_id, search_query, search_type, results_count

### Views

- **user_contacts_view**: Joins user_saved_contacts, contacts, and companies for easy querying

## Features

- ✅ Full-text search on company names and contact emails
- ✅ Row-level security (RLS) for multi-tenant data isolation
- ✅ Automatic timestamp updates
- ✅ Contact status tracking (new → contacted → replied → converted)
- ✅ Tag system for organizing contacts
- ✅ Notes field for each saved contact
- ✅ Company deduplication by domain
- ✅ Contact deduplication by email

## Files

- `scripts/011_create_contacts_database.sql` - Database schema
- `lib/contacts-db-types.ts` - TypeScript type definitions
- `lib/contacts-db.ts` - Utility functions for database operations
- `app/actions/contacts.ts` - Server actions for client-side use
- `components/contacts-list.tsx` - UI component for managing contacts
- `app/(dashboard)/contacts/page.tsx` - Contacts management page

## Usage

### Adding a Contact

```typescript
import { addContactAction } from "@/app/actions/contacts"

const result = await addContactAction({
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  title: "CEO",
  companyName: "Example Inc",
  companyDomain: "example.com",
  saveForUser: true,
})
```

### Searching Contacts

```typescript
import { searchContactsAction } from "@/app/actions/contacts"

const result = await searchContactsAction({
  domain: "example.com",
  limit: 10,
})
```

### Updating Contact Status

```typescript
import { updateSavedContactAction } from "@/app/actions/contacts"

await updateSavedContactAction(savedContactId, {
  status: "contacted",
  last_contacted_at: new Date().toISOString(),
})
```

### Bulk Import

```typescript
import { bulkImportContactsAction } from "@/app/actions/contacts"

const contacts = [
  {
    email: "contact1@example.com",
    firstName: "Contact",
    lastName: "One",
    companyName: "Company A",
    companyDomain: "companya.com",
  },
  // ... more contacts
]

const result = await bulkImportContactsAction(contacts)
console.log(`Imported: ${result.imported}, Failed: ${result.failed}`)
```

## Migration

To set up the database:

```bash
# Run the SQL script in your Supabase SQL editor
cat scripts/011_create_contacts_database.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

## Benefits

1. **Cost Reduction**: Reduce API calls to services like Snov.io
2. **Data Ownership**: Full control over your contact data
3. **Customization**: Add custom fields and tags as needed
4. **Integration**: Easy integration with email generation workflow
5. **Privacy**: Keep sensitive contact data in your own database
6. **Analytics**: Track search patterns and contact lifecycle

## Future Enhancements

- [ ] CSV/Excel import functionality
- [ ] Email verification service integration
- [ ] Contact enrichment from public sources
- [ ] Contact scoring and prioritization
- [ ] Integration with email campaigns
- [ ] Automatic contact updates from email replies
- [ ] Contact merge/deduplication tools
- [ ] Advanced filtering and segmentation
