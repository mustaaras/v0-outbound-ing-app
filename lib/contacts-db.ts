import { createClient } from "@/lib/supabase/server"
import { errorLog, devLog } from "@/lib/logger"
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

  try {
    // Try to find existing company by domain
    const { data: existing, error: findError } = await supabase
      .from("companies")
      .select("*")
      .eq("domain", data.domain)
      .maybeSingle()

    if (findError) {
      errorLog("[v0] Error finding company:", findError)
    }

    if (existing) {
      devLog("[v0] Found existing company:", existing.name)
      return existing as Company
    }

    // Create new company
    devLog("[v0] Creating new company:", data)
    const { data: newCompany, error } = await supabase
      .from("companies")
      .insert(data)
      .select()
      .single()

    if (error) {
      errorLog("[v0] Error creating company:", error)
      errorLog("[v0] Company data:", data)
      return null
    }

    devLog("[v0] Successfully created company:", newCompany.name)
    return newCompany as Company
  } catch (err) {
    errorLog("[v0] Exception in findOrCreateCompany:", err)
    return null
  }
}

/**
 * Find or create a contact by email
 */
export async function findOrCreateContact(data: ContactInsert): Promise<Contact | null> {
  const supabase = await createClient()

  try {
    // Try to find existing contact by email
    const { data: existing, error: findError } = await supabase
      .from("contacts")
      .select("*")
      .eq("email", data.email)
      .maybeSingle()

    if (findError) {
      errorLog("[v0] Error finding contact:", findError)
    }

    if (existing) {
      devLog("[v0] Found existing contact:", existing.email)
      return existing as Contact
    }

    // Create new contact
    devLog("[v0] Creating new contact:", data.email)
    const { data: newContact, error } = await supabase
      .from("contacts")
      .insert(data)
      .select()
      .single()

    if (error) {
      errorLog("[v0] Error creating contact:", error)
      errorLog("[v0] Contact data:", data)
      return null
    }

    devLog("[v0] Successfully created contact:", newContact.email)
    return newContact as Contact
  } catch (err) {
    errorLog("[v0] Exception in findOrCreateContact:", err)
    return null
  }
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

  try {
    // Check if already saved
    const { data: existing } = await supabase
      .from("user_saved_contacts")
      .select("*")
      .eq("user_id", userId)
      .eq("contact_id", contactId)
      .maybeSingle()

    if (existing) {
      devLog("[v0] Contact already saved for user")
      return existing as UserSavedContact
    }

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
      errorLog("[v0] Error saving contact for user:", error)
      return null
    }

    devLog("[v0] Successfully saved contact for user")
    return saved as UserSavedContact
  } catch (err) {
    errorLog("[v0] Exception in saveContactForUser:", err)
    return null
  }
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

  try {
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
      errorLog("[v0] Error getting saved contacts:", error)
      return []
    }

    return (data as UserContactView[]) || []
  } catch (err) {
    errorLog("[v0] Exception in getUserSavedContacts:", err)
    return []
  }
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

  try {
    const { error } = await supabase
      .from("user_saved_contacts")
      .update(updates)
      .eq("id", savedContactId)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] Error updating saved contact:", error)
      return false
    }

    return true
  } catch (err) {
    errorLog("[v0] Exception in updateSavedContact:", err)
    return false
  }
}

/**
 * Delete a saved contact
 */
export async function deleteSavedContact(userId: string, savedContactId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("user_saved_contacts")
      .delete()
      .eq("id", savedContactId)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] Error deleting saved contact:", error)
      return false
    }

    return true
  } catch (err) {
    errorLog("[v0] Exception in deleteSavedContact:", err)
    return false
  }
}

/**
 * Search contacts
 */
export async function searchContacts(query: {
  email?: string
  domain?: string
  companyName?: string
  title?: string
  name?: string
  limit?: number
}): Promise<Contact[]> {
  const supabase = await createClient()

  try {
    let dbQuery = supabase.from("contacts").select(`
      *,
      companies (
        id,
        name,
        domain,
        industry,
        company_size,
        location
      )
    `)

    if (query.email) {
      dbQuery = dbQuery.ilike("email", `%${query.email}%`)
    }

    if (query.title) {
      dbQuery = dbQuery.ilike("title", `%${query.title}%`)
    }

    if (query.name) {
      const nameParts = query.name.split(" ")
      if (nameParts.length > 1) {
        dbQuery = dbQuery
          .ilike("first_name", `%${nameParts[0]}%`)
          .ilike("last_name", `%${nameParts[nameParts.length - 1]}%`)
      } else {
        dbQuery = dbQuery.or(`first_name.ilike.%${query.name}%,last_name.ilike.%${query.name}%`)
      }
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }

    const { data, error } = await dbQuery

    if (error) {
      errorLog("[v0] Error searching contacts:", error)
      return []
    }

    return (data as Contact[]) || []
  } catch (err) {
    errorLog("[v0] Exception in searchContacts:", err)
    return []
  }
}

/**
 * Update contact information
 */
export async function updateContact(contactId: string, updates: ContactUpdate): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", contactId)

    if (error) {
      errorLog("[v0] Error updating contact:", error)
      return false
    }

    return true
  } catch (err) {
    errorLog("[v0] Exception in updateContact:", err)
    return false
  }
}

/**
 * Log a contact search
 */
export async function logContactSearch(
  userId: string,
  searchQuery: string,
  searchType: string,
  resultsCount: number
): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase.from("contact_search_history").insert({
      user_id: userId,
      search_query: searchQuery,
      search_type: searchType,
      results_count: resultsCount,
    })
  } catch (err) {
    errorLog("[v0] Exception in logContactSearch:", err)
  }
}

/**
 * Get contact search history
 */
export async function getContactSearchHistory(userId: string, limit: number = 20): Promise<any[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("contact_search_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      errorLog("[v0] Error getting search history:", error)
      return []
    }

    return data || []
  } catch (err) {
    errorLog("[v0] Exception in getContactSearchHistory:", err)
    return []
  }
}
