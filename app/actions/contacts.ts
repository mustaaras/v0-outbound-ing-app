"use server"

import { createClient } from "@/lib/supabase/server"
import {
  findOrCreateCompany,
  findOrCreateContact,
  saveContactForUser,
  getUserSavedContacts,
  updateSavedContact,
  deleteSavedContact,
  searchContacts,
  updateContact,
  logContactSearch,
  getContactSearchHistory,
} from "@/lib/contacts-db"
import type { CompanyInsert, ContactInsert } from "@/lib/contacts-db-types"
import { errorLog } from "@/lib/logger"

/**
 * Add a new contact and company to the database
 */
export async function addContactAction(data: {
  email: string
  firstName?: string
  lastName?: string
  title?: string
  companyName: string
  companyDomain: string
  companyIndustry?: string
  companySize?: string
  companyLocation?: string
  source?: string
  saveForUser?: boolean
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Create or find company
    const companyData: CompanyInsert = {
      name: data.companyName,
      domain: data.companyDomain,
      industry: data.companyIndustry,
      company_size: data.companySize,
      location: data.companyLocation,
    }

    const company = await findOrCreateCompany(companyData)
    if (!company) {
      return { success: false, error: "Failed to create company" }
    }

    // Create or find contact
    const contactData: ContactInsert = {
      company_id: company.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      title: data.title,
      source: (data.source as "manual" | "snov" | "public_finder" | "imported" | "api") || "manual",
      is_verified: false,
    }

    const contact = await findOrCreateContact(contactData)
    if (!contact) {
      return { success: false, error: "Failed to create contact" }
    }

    // Save for user if requested
    if (data.saveForUser) {
      await saveContactForUser(user.id, contact.id)
    }

    return { success: true, contact, company }
  } catch (error) {
    errorLog("[v0] Error in addContactAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Save a contact for the current user
 */
export async function saveContactAction(
  contactId: string,
  options?: { notes?: string; tags?: string[]; status?: "new" | "contacted" | "replied" | "converted" | "unsubscribed" }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const savedContact = await saveContactForUser(user.id, contactId, options)
    if (!savedContact) {
      return { success: false, error: "Failed to save contact" }
    }

    return { success: true, savedContact }
  } catch (error) {
    errorLog("[v0] Error in saveContactAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get all saved contacts for the current user
 */
export async function getSavedContactsAction(options?: {
  status?: "new" | "contacted" | "replied" | "converted" | "unsubscribed"
  tags?: string[]
  limit?: number
  offset?: number
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", contacts: [], total: 0 }
    }

    const contacts = await getUserSavedContacts(user.id, options)
    
    // Get total count for pagination
    const totalOptions = { ...options }
    delete totalOptions.limit
    delete totalOptions.offset
    const allContacts = await getUserSavedContacts(user.id, totalOptions)
    
    return { success: true, contacts, total: allContacts.length }
  } catch (error) {
    errorLog("[v0] Error in getSavedContactsAction:", error)
    return { success: false, error: "An unexpected error occurred", contacts: [], total: 0 }
  }
}

/**
 * Update a saved contact
 */
export async function updateSavedContactAction(
  savedContactId: string,
  updates: {
    notes?: string
    tags?: string[]
    status?: "new" | "contacted" | "replied" | "converted" | "unsubscribed"
    last_contacted_at?: string
  }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const success = await updateSavedContact(user.id, savedContactId, updates)
    if (!success) {
      return { success: false, error: "Failed to update contact" }
    }

    return { success: true }
  } catch (error) {
    errorLog("[v0] Error in updateSavedContactAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Delete a saved contact
 */
export async function deleteSavedContactAction(savedContactId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const success = await deleteSavedContact(user.id, savedContactId)
    if (!success) {
      return { success: false, error: "Failed to delete contact" }
    }

    return { success: true }
  } catch (error) {
    errorLog("[v0] Error in deleteSavedContactAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Search contacts
 */
export async function searchContactsAction(query: {
  email?: string
  domain?: string
  companyName?: string
  title?: string
  name?: string
  limit?: number
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", contacts: [] }
    }

    const contacts = await searchContacts(query)

    // Log the search
    const searchType =
      query.email ? "email"
      : query.domain ? "domain"
      : query.companyName ? "company_name"
      : query.title ? "title"
      : "keyword"
    const searchQuery = query.email || query.domain || query.companyName || query.title || query.name || ""

    await logContactSearch(user.id, searchQuery, searchType, contacts.length)

    return { success: true, contacts }
  } catch (error) {
    errorLog("[v0] Error in searchContactsAction:", error)
    return { success: false, error: "An unexpected error occurred", contacts: [] }
  }
}

/**
 * Update contact information
 */
export async function updateContactAction(contactId: string, updates: {
  first_name?: string
  last_name?: string
  title?: string
  department?: string
  linkedin_url?: string
  phone?: string
  is_verified?: boolean
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const success = await updateContact(contactId, updates)
    if (!success) {
      return { success: false, error: "Failed to update contact" }
    }

    return { success: true }
  } catch (error) {
    errorLog("[v0] Error in updateContactAction:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get contact search history
 */
export async function getSearchHistoryAction(limit: number = 20) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", history: [] }
    }

    const history = await getContactSearchHistory(user.id, limit)
    return { success: true, history }
  } catch (error) {
    errorLog("[v0] Error in getSearchHistoryAction:", error)
    return { success: false, error: "An unexpected error occurred", history: [] }
  }
}

/**
 * Bulk import contacts from array
 */
export async function bulkImportContactsAction(contacts: Array<{
  email: string
  firstName?: string
  lastName?: string
  title?: string
  companyName: string
  companyDomain: string
  companyIndustry?: string
  companySize?: string
  companyLocation?: string
}>) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", imported: 0, failed: 0 }
    }

    let imported = 0
    let failed = 0
    const results = []

    for (const contactData of contacts) {
      try {
        const result = await addContactAction({
          ...contactData,
          saveForUser: true,
          source: "imported",
        })

        if (result.success) {
          imported++
          results.push({ email: contactData.email, status: "success" })
        } else {
          failed++
          results.push({ email: contactData.email, status: "failed", error: result.error })
        }
      } catch (error) {
        failed++
        results.push({ email: contactData.email, status: "failed", error: "Unexpected error" })
      }
    }

    return { success: true, imported, failed, results }
  } catch (error) {
    errorLog("[v0] Error in bulkImportContactsAction:", error)
    return { success: false, error: "An unexpected error occurred", imported: 0, failed: 0 }
  }
}
