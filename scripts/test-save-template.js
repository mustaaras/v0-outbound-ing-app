(async () => {
  try {
    const { createClient } = require('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
      process.exit(1)
    }

    const supabase = createClient(url, key)

    // Find a user in users table
    const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1)
    if (usersError) {
      console.error('Error fetching users:', usersError)
      process.exit(1)
    }
    if (!users || users.length === 0) {
      console.error('No users found in users table to test with')
      process.exit(1)
    }

    const userId = users[0].id
    console.log('Using user id:', userId)

    // Insert a test template
    const now = new Date().toISOString()
    const insertPayload = {
      user_id: userId,
      domain: 'example.com',
      subject: `test subject ${now}`,
      category: 'Test',
      strategy_ids: [],
      recipient: 'Test Recipient',
      recipient_email: 'test@example.com',
      input_data: {},
      result_text: 'This is a test template created by test-save-template.js',
    }

    const { data: insertData, error: insertError } = await supabase.from('templates').insert(insertPayload).select('*')
    if (insertError) {
      console.error('Insert error:', insertError)
      process.exit(1)
    }

    console.log('Inserted template id:', insertData && insertData[0] && insertData[0].id)

    // Fetch recent templates for the user
    const { data: recent, error: recentError } = await supabase.from('templates').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
    if (recentError) {
      console.error('Error fetching recent templates:', recentError)
      process.exit(1)
    }

    console.log('Recent templates for user:', recent ? recent.map(r => ({ id: r.id, subject: r.subject, created_at: r.created_at })) : [])
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
})()
