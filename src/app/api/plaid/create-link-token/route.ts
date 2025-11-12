import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id
      },
      client_name: 'TrustReturns',
      products: ['investments', 'transactions'],
      country_codes: ['US'],
      language: 'en',
    })

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}
