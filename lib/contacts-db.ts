import { createClient } from "@/lib/supabase/server"
import type {
  Company,
  Contact,
  UserSavedContact,
  UserContactView,
  CompanyInsert,
  ContactInsert,
  UserSavedContactInsert,
  ContactUpdate,
  UserSavedContactUpdate,
} from "./contacts-db-types"

/**
 * Find or create a company by domain
 */
export async function findOrCreateCompany(data: CompanyInsert): Promise<Company | null> {
  const supabase = await createClient()

  // Try to find existing company by domain
  const { data: existing } = await supabase
    .from("companies")
    .select("*")
    .eq("domain", data.domain)
    .single()

  if (existing) {
    return existing as Company
  }

  // Create new company
  const { data: newCompany, error } = await supabase
    .from("companies")
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error("Error creating company:", error)
    return null
  }

  return newCompany as Company
}

/**
 * Find or create a contact by email
 */
export async function findOrCreateContact(data: ContactInsert): Promise<Contact | null> {
  const supabase = await createClient()

  // Try to find existing contact by email
  const { data: existing } = await supabase
    .from("contacts")
    .select("*")
    .eq("email", data.email)
    .single()

  if (existing) {
    return existing as Contact
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from("contacts")
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error("Error creating contact:", error)
    return null
  }

  return newContact as Contact
}

/**
 * Save a contact for a user
 */
export async function saveContactForUser(
  userId: string,
  contactId: string,
  options?: { notes?: string; tags?: string[]; status?: UserSavedContact["status"] }
): Promise<UserSavedContact | null> {
  const supabase = await createClient()

  const data: UserSavedContactInsert = {
    user_id: userId,
    contact_id: contactId,
    notes: options?.notes,
    tags: options?.tags,
    status: options?.status || "new",
  }

  const { data: saved, error } = await supabase
    .from("user_saved_contacts")
    .insert(data)
    .select()
    .single()

  if (error) {
    // Check if already saved
    if (error.code === "23505") {
      // Unique constraint violation
      const { data: existing } = await supabase
        .from("user_saved_contacts")
        .select("*")
        .eq("user_id", userId)
        .eq("contact_id", contactId)
        .single()

      return existing as UserSavedContact
    }
    console.error("Error saving contact:", error)
    return null
  }

  return saved as UserSavedContact
}

/**
 * Get all saved contacts for a user with company info
 */
export async function getUserSavedContacts(
  userId: string,
  options?: {
    status?: UserSavedContact["status"]
    tags?: string[]
    limit?: number
    offset?: number
  }
): Promise<UserContactView[]> {
  const supabase = await createClient()

  let query = supabase
    .from("user_contacts_view")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })

  if (options?.status) {
    query = query.eq("status", options.status)
  }

  if (options?.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching saved contacts:", error)
    return []
  }

  return (data as UserContactView[]) || []
}

/**
 * Update a saved contact
 */
export async function updateSavedContact(
  userId: string,
  savedContactId: string,
  updates: UserSavedContactUpdate
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_saved_contacts")
    .update(updates)
    .eq("id", savedContactId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating saved contact:", error)
    return false
  }

  return true
}

/**
 * Delete a saved contact
 */
export async function deleteSavedContact(userId: string, savedContactId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_saved_contacts")
    .delete()
    .eq("id", savedContactId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error deleting saved contact:", error)
    return false
  }

  return true
}

/**
 * Search contacts by various criteria
 */
export async function searchContacts(query: {
  email?: string
  domain?: string
  companyName?: string
  title?: string
  name?: string
  limit?: number
}): Promise<UserContactView[]> {
  const supabase = await createClient()

  let dbQuery = supabase.from("user_contacts_view").select("*")

  if (query.email) {
    dbQuery = dbQuery.ilike("email", `%${query.email}%`)
  }

  if (query.domain) {
    dbQuery = dbQuery.ilike("company_domain", `%${query.domain}%`)
  }

  if (query.companyName) {
    dbQuery = dbQuery.ilike("company_name", `%${query.companyName}%`)
  }

  if (query.title) {
    dbQuery = dbQuery.ilike("title", `%${query.title}%`)
  }

  if (query.name) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query.name}%,last_name.ilike.%${query.name}%`)
  }

  if (query.limit) {
    dbQuery = dbQuery.limit(query.limit)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error("Error searching contacts:", error)
    return []
  }

  return (data as UserContactView[]) || []
}

/**
 * Update contact information
 */
export async function updateContact(contactId: string, updates: ContactUpdate): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("contacts").update(updates).eq("id", contactId)

  if (error) {
    console.error("Error updating contact:", error)
    return false
  }

  return true
}

/**
 * Log a contact search
 */
export async function logContactSearch(
  userId: string,
  searchQuery: string,
  searchType: "domain" | "title" | "company_name" | "email" | "keyword",
  resultsCount: number
): Promise<void> {
  const supabase = await createClient()

  await supabase.from("contact_search_history").insert({
    user_id: userId,
    search_query: searchQuery,
    search_type: searchType,
    results_count: resultsCount,
  })
}

/**
 * Get contact search history for a user
 */
export async function getContactSearchHistory(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contact_search_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching search history:", error)
    return []
  }

  return data || []
}
