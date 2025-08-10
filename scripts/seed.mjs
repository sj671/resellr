import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
  process.exit(1)
}

const email = process.env.SEED_EMAIL || 'demo+seed@example.com'
const password = process.env.SEED_PASSWORD || 'Password123!'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function ensureAuth() {
  // Try sign in first; if fails, sign up
  let { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
    if (signUpErr) {
      console.error('Failed to sign up:', signUpErr.message)
      process.exit(1)
    }
    // If email confirmations are enabled, there may be no session; try sign in again
    if (!data.session) {
      const retry = await supabase.auth.signInWithPassword({ email, password })
      if (retry.error) {
        console.error('Failed to obtain session after signup:', retry.error.message)
        process.exit(1)
      }
    }
  }
}

async function seed() {
  await ensureAuth()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    console.error('No user session; cannot seed data.')
    process.exit(1)
  }
  const userId = userData.user.id

  const inventory = [
    { title: 'Vintage Jacket', sku: 'JKT-001', quantity: 1, purchase_price: 25.0, acquired_at: '2025-08-01' },
    { title: 'Sneakers Nike Air', sku: 'SNK-002', quantity: 2, purchase_price: 40.0, acquired_at: '2025-08-03' },
    { title: 'Retro Game Console', sku: 'GME-003', quantity: 1, purchase_price: 80.0, acquired_at: '2025-08-05' },
  ]

  const { error: invErr } = await supabase.from('inventory_items').insert(
    inventory.map((i) => ({ ...i, user_id: userId }))
  )
  if (invErr) {
    console.error('Failed inserting inventory_items:', invErr.message)
  }

  const listings = [
    { title: 'Vintage Jacket', marketplace: 'eBay', price: 120.0, status: 'active' },
    { title: 'Sneakers Nike Air', marketplace: 'eBay', price: 95.0, status: 'active' },
  ]
  const { error: listErr } = await supabase.from('listings').insert(
    listings.map((l) => ({ ...l, user_id: userId, listed_at: new Date().toISOString() }))
  )
  if (listErr) {
    console.error('Failed inserting listings:', listErr.message)
  }

  const sales = [
    { sale_date: new Date().toISOString(), quantity: 1, gross_amount: 140.0, fees: 15.0, shipping_income: 0, shipping_cost: 8.5, tax: 0 },
  ]
  const { error: saleErr } = await supabase.from('sales').insert(
    sales.map((s) => ({ ...s, user_id: userId }))
  )
  if (saleErr) {
    console.error('Failed inserting sales:', saleErr.message)
  }

  const expenses = [
    { occurred_at: '2025-08-04', category: 'Supplies', amount: 12.99, note: 'Packing materials' },
    { occurred_at: '2025-08-06', category: 'Shipping', amount: 8.5, note: 'USPS label' },
  ]
  const { error: expErr } = await supabase.from('expenses').insert(
    expenses.map((e) => ({ ...e, user_id: userId }))
  )
  if (expErr) {
    console.error('Failed inserting expenses:', expErr.message)
  }

  console.log('Seed complete for', email)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})


