import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const A_EMAIL = process.env.RLS_USER_A || 'rls+a@example.com'
const B_EMAIL = process.env.RLS_USER_B || 'rls+b@example.com'
const PASSWORD = process.env.RLS_PASSWORD || 'Password123!'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env')
  process.exit(1)
}

async function signIn(email) {
  const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { error: siErr } = await c.auth.signInWithPassword({ email, password: PASSWORD })
  if (siErr) {
    const { data, error: suErr } = await c.auth.signUp({ email, password: PASSWORD })
    if (suErr) throw suErr
    if (!data.session) {
      const retry = await c.auth.signInWithPassword({ email, password: PASSWORD })
      if (retry.error) throw retry.error
    }
  }
  return c
}

async function main() {
  const a = await signIn(A_EMAIL)
  const b = await signIn(B_EMAIL)

  // A inserts a row
  const { data: aUser } = await a.auth.getUser()
  const insert = await a.from('inventory_items').insert({ user_id: aUser.user.id, title: 'RLS Test Item', quantity: 1 })
  if (insert.error) throw insert.error

  // A should see at least 1 row
  const listA = await a.from('inventory_items').select('id').limit(1)
  if (listA.error) throw listA.error
  if (!listA.data || listA.data.length === 0) throw new Error('User A cannot see own inventory')

  // B should see zero rows from A
  const listB = await b.from('inventory_items').select('id').eq('title', 'RLS Test Item')
  if (listB.error) throw listB.error
  if (listB.data && listB.data.length > 0) throw new Error('User B can see A rows — RLS broken')

  console.log('RLS test passed: users only see their own rows')
}

main().catch((e) => { console.error(e); process.exit(1) })


