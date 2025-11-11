// Test script to debug Snov.io domain search API
// Run with: npx tsx scripts/test-snov-domain-search.ts

const SNOV_CLIENT_ID = process.env.SNOV_CLIENT_ID || ''
const SNOV_CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET || ''

async function getToken() {
  console.log('🔐 Getting access token...')
  const form = new URLSearchParams()
  form.append('grant_type', 'client_credentials')
  form.append('client_id', SNOV_CLIENT_ID)
  form.append('client_secret', SNOV_CLIENT_SECRET)

  const resp = await fetch('https://api.snov.io/v1/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const data = await resp.json()
  console.log('Token response:', data)
  
  if (!data.access_token) {
    throw new Error('Failed to get token')
  }
  
  return data.access_token
}

async function testDomainSearch(token: string, domain: string) {
  console.log('\n🔍 Testing domain search for:', domain)
  
  // Test 1: JSON format
  console.log('\n--- Test 1: JSON format ---')
  const jsonPayload = {
    domain: domain,
    page: 1,
    positions: ['manager', 'director']
  }
  
  let resp = await fetch('https://api.snov.io/v2/domain-search/prospects/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonPayload)
  })
  
  let text = await resp.text()
  console.log('Status:', resp.status)
  console.log('Response:', text)
  
  // Test 2: Form-encoded format
  console.log('\n--- Test 2: Form-encoded format ---')
  const formPayload = new URLSearchParams()
  formPayload.append('domain', domain)
  formPayload.append('page', '1')
  formPayload.append('positions[]', 'manager')
  formPayload.append('positions[]', 'director')
  
  resp = await fetch('https://api.snov.io/v2/domain-search/prospects/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formPayload.toString()
  })
  
  text = await resp.text()
  console.log('Status:', resp.status)
  console.log('Response:', text)
  
  // Test 3: Try without positions
  console.log('\n--- Test 3: Without positions ---')
  const simplePayload = new URLSearchParams()
  simplePayload.append('domain', domain)
  
  resp = await fetch('https://api.snov.io/v2/domain-search/prospects/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: simplePayload.toString()
  })
  
  text = await resp.text()
  console.log('Status:', resp.status)
  console.log('Response:', text)
}

async function main() {
  if (!SNOV_CLIENT_ID || !SNOV_CLIENT_SECRET) {
    console.error('❌ Missing SNOV_CLIENT_ID or SNOV_CLIENT_SECRET environment variables')
    console.log('\nRun with:')
    console.log('SNOV_CLIENT_ID=your_id SNOV_CLIENT_SECRET=your_secret npx tsx scripts/test-snov-domain-search.ts')
    process.exit(1)
  }

  try {
    const token = await getToken()
    await testDomainSearch(token, 'hubspot.com')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
