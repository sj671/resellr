import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.env.SEED_EMAIL || 'demo+seed@example.com'
const password = process.env.SEED_PASSWORD || 'Password123!'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function run() {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('Sign-in failed:', error.message)
    process.exit(1)
  }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No session; aborting')
    process.exit(1)
  }
  const uid = user.id
  await supabase.from('expenses').delete().eq('user_id', uid)
  await supabase.from('sales').delete().eq('user_id', uid)
  await supabase.from('listings').delete().eq('user_id', uid)
  await supabase.from('inventory_items').delete().eq('user_id', uid)
  console.log('Cleanup complete for', email)
}

run().catch((e) => { console.error(e); process.exit(1) })


