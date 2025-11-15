// Safe-disabled Snov stub
// This file replaces the full Snov implementation with a lightweight stub
// so the rest of the codebase can import the same types and functions
// without failing when Snov is intentionally disabled.

export interface SnovBuyer {
  email: string
  first_name?: string
  last_name?: string
  company?: string
  title?: string
  linkedin_url?: string
  phone?: string
  industry?: string
  company_size?: string
}

export interface SnovSearchParams {
  mode?: "domain" | "keyword"
  domain?: string
  keyword?: string
  title?: string
  limit?: number
  page?: number
}

export interface SnovSearchResponse {
  success: boolean
  data: {
    total: number
    results: SnovBuyer[]
  }
  error?: string
}

class SnovClientStub {
  // Return an empty/disabled response to avoid runtime errors.
  async searchBuyers(_params: SnovSearchParams): Promise<SnovSearchResponse> {
    return { success: false, data: { total: 0, results: [] }, error: "Snov integration disabled" }
  }

  async getRemainingSearches(_userId: string): Promise<number> {
    return 0
  }
}

let snovClient: SnovClientStub | null = null

export function getSnovClient(): SnovClientStub {
  if (!snovClient) snovClient = new SnovClientStub()
  return snovClient
}

// (types are exported above)
