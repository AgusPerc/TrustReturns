import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { calculateXIRR, calculateYTD, type Cashflow } from '@/lib/xirr'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { portfolio_id } = await req.json()

    // Get portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .eq('user_id', user.id)
      .single()

    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const accessToken = portfolio.access_token

    // 1. Fetch transactions (with pagination)
    let allTransactions: any[] = []
    let hasMore = true
    let cursor: string | undefined = undefined

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = '2015-01-01' // Get last 10 years

    while (hasMore) {
      const txResponse = await plaidClient.investmentsTransactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { cursor, count: 500 },
      })

      allTransactions = allTransactions.concat(
        txResponse.data.investment_transactions
      )

      hasMore = txResponse.data.has_more
      cursor = txResponse.data.next_cursor
    }

    // 2. Fetch holdings
    const holdingsResponse = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    })

    const holdings = holdingsResponse.data.holdings

    // 3. Calculate current value
    const currentValue = holdings.reduce(
      (sum, h) => sum + (h.quantity * h.institution_price),
      0
    )

    const totalCostBasis = holdings.reduce(
      (sum, h) => sum + (h.cost_basis || 0),
      0
    )

    // 4. Build cashflows for XIRR
    // Filter only buy/sell transactions
    const relevantTransactions = allTransactions.filter(tx =>
      tx.type === 'buy' || tx.type === 'sell'
    )

    const cashflows: Cashflow[] = relevantTransactions.map(tx => ({
      date: new Date(tx.date),
      amount: tx.type === 'buy' ? -tx.amount : tx.amount
    }))

    // Add current value as final cashflow
    cashflows.push({
      date: new Date(),
      amount: currentValue
    })

    // 5. Calculate metrics
    let xirr = 0
    let totalReturn = 0
    let ytd = 0

    try {
      if (cashflows.length >= 2) {
        xirr = calculateXIRR(cashflows)
        totalReturn = ((currentValue / totalCostBasis - 1) * 100)
        ytd = calculateYTD(allTransactions, currentValue)
      }
    } catch (error) {
      console.error('Error calculating returns:', error)
      // Continue with 0 values if calculation fails
    }

    // 6. Calculate period
    const firstDate = allTransactions.length > 0
      ? allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
      : new Date().toISOString().split('T')[0]

    const period = Math.floor(
      (new Date().getTime() - new Date(firstDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    )

    // 7. Update database with calculated metrics
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        xirr_percent: xirr,
        xirr_period_months: period,
        total_return_percent: totalReturn,
        ytd_return_percent: ytd,
        current_value: currentValue,
        total_cost_basis: totalCostBasis,
        first_transaction_date: firstDate,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', portfolio_id)

    if (updateError) {
      console.error('Error updating portfolio:', updateError)
      return NextResponse.json(
        { error: 'Failed to update metrics' },
        { status: 500 }
      )
    }

    // 8. Save holdings (for future phases)
    // Delete old holdings
    await supabase
      .from('holdings')
      .delete()
      .eq('portfolio_id', portfolio_id)

    // Insert new holdings
    if (holdings.length > 0) {
      const holdingsData = holdings.map(h => ({
        portfolio_id: portfolio_id,
        ticker: h.security?.ticker_symbol || h.security?.isin || 'N/A',
        security_name: h.security?.name || 'Unknown',
        quantity: h.quantity,
        cost_basis: h.cost_basis,
        current_price: h.institution_price,
        current_value: h.quantity * h.institution_price,
        percent_of_portfolio: (h.quantity * h.institution_price / currentValue) * 100,
      }))

      await supabase.from('holdings').insert(holdingsData)
    }

    return NextResponse.json({
      success: true,
      metrics: {
        xirr: xirr.toFixed(1),
        totalReturn: totalReturn.toFixed(1),
        ytd: ytd.toFixed(1),
        period,
        currentValue,
      },
    })
  } catch (error) {
    console.error('Error calculating returns:', error)
    return NextResponse.json(
      { error: 'Failed to calculate returns' },
      { status: 500 }
    )
  }
}
