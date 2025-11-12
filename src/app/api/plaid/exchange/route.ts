import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { public_token } = await req.json()

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = exchangeResponse.data

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token })
    const institutionId = itemResponse.data.item.institution_id

    let institutionName = 'Unknown'
    if (institutionId) {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'],
      })
      institutionName = institutionResponse.data.institution.name
    }

    // Save to database (access_token in plaintext for now, encrypt in production)
    const { data: portfolio, error: dbError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        access_token: access_token, // TODO: Encrypt in production
        item_id,
        institution_name: institutionName,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving portfolio:', dbError)
      return NextResponse.json(
        { error: 'Failed to save portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolio_id: portfolio.id
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to connect broker' },
      { status: 500 }
    )
  }
}
