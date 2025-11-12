// Types for the contacts database

export interface Company {
  id: string
  name: string
  domain: string
  industry?: string
  company_size?: string
  location?: string
  description?: string
  website?: string
  linkedin_url?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  company_id?: string
  email: string
  first_name?: string
  last_name?: string
  title?: string
  department?: string
  phone?: string
  linkedin_url?: string
  is_verified: boolean
  verification_date?: string
  source?: 'manual' | 'snov' | 'public_finder' | 'imported' | 'api'
  created_at: string
  updated_at: string
}

export interface UserSavedContact {
  id: string
  user_id: string
  contact_id: string
  notes?: string
  tags?: string[]
  last_contacted_at?: string
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'unsubscribed'
  created_at: string
  updated_at: string
}

export interface ContactSearchHistory {
  id: string
  user_id: string
  search_query: string
  search_type: 'domain' | 'title' | 'company_name' | 'email' | 'keyword'
  results_count: number
  created_at: string
}

// View type for joined data
export interface UserContactView {
  saved_contact_id: string
  user_id: string
  notes?: string
  tags?: string[]
  last_contacted_at?: string
  status: 'new' | 'contacted' | 'replied' | 'converted' | 'unsubscribed'
  saved_at: string
  contact_id: string
  email: string
  first_name?: string
  last_name?: string
  title?: string
  department?: string
  phone?: string
  contact_linkedin?: string
  is_verified: boolean
  source?: string
  company_id?: string
  company_name?: string
  company_domain?: string
  industry?: string
  company_size?: string
  location?: string
  website?: string
  company_linkedin?: string
}

// Insert types (without auto-generated fields)
export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>
export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type UserSavedContactInsert = Omit<UserSavedContact, 'id' | 'created_at' | 'updated_at'>
export type ContactSearchHistoryInsert = Omit<ContactSearchHistory, 'id' | 'created_at'>

// Update types (all fields optional except id)
export type CompanyUpdate = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
export type UserSavedContactUpdate = Partial<Omit<UserSavedContact, 'id' | 'user_id' | 'contact_id' | 'created_at' | 'updated_at'>>
