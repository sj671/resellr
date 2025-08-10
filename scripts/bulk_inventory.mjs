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

function randomItem(i) {
  return {
    title: `Sample Item ${i}`,
    sku: `SKU-${String(i).padStart(4, '0')}`,
    quantity: Math.max(1, Math.floor(Math.random() * 5)),
    purchase_price: Number((Math.random() * 100 + 5).toFixed(2)),
    acquired_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
  }
}

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
  const batch = Array.from({ length: Number(process.env.COUNT || 50) }, (_, i) => ({ ...randomItem(i + 1), user_id: uid }))
  const { error: insertErr } = await supabase.from('inventory_items').insert(batch)
  if (insertErr) {
    console.error('Bulk insert failed:', insertErr.message)
    process.exit(1)
  }
  console.log('Bulk inventory inserted:', batch.length)
}

run().catch((e) => { console.error(e); process.exit(1) })


