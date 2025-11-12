export interface Cashflow {
  date: Date
  amount: number // negative = investment, positive = return
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) using Newton-Raphson method
 *
 * XIRR is the annualized rate of return for investments with irregular cashflows.
 * It's like IRR but accounts for the actual dates of transactions.
 *
 * @param cashflows - Array of cashflows (investments = negative, returns = positive)
 * @param tolerance - Convergence tolerance (default: 1e-6)
 * @param maxIterations - Maximum iterations (default: 1000)
 * @returns XIRR as a percentage (e.g., 25.5 for 25.5% annual return)
 */
export function calculateXIRR(
  cashflows: Cashflow[],
  tolerance: number = 1e-6,
  maxIterations: number = 1000
): number {
  if (cashflows.length < 2) {
    throw new Error('Need at least 2 cashflows to calculate XIRR')
  }

  // Sort by date (earliest first)
  const sorted = [...cashflows].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  )

  const startDate = sorted[0].date

  // Convert dates to years from start date
  const flows = sorted.map(cf => ({
    years: (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    amount: cf.amount
  }))

  // Initial guess: 10% (0.1)
  let rate = 0.1

  // Newton-Raphson iteration
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0        // Net Present Value
    let derivative = 0  // Derivative of NPV

    // Calculate NPV and its derivative at current rate
    flows.forEach(flow => {
      const factor = Math.pow(1 + rate, flow.years)
      npv += flow.amount / factor

      if (flow.years !== 0) {
        derivative -= flow.years * flow.amount / factor / (1 + rate)
      }
    })

    // Check convergence
    if (Math.abs(npv) < tolerance) {
      return rate * 100 // Convert to percentage
    }

    // Newton-Raphson step: x_new = x_old - f(x) / f'(x)
    if (derivative === 0) {
      throw new Error('Derivative is 0, cannot calculate XIRR')
    }

    rate -= npv / derivative

    // Prevent absurd values
    if (rate < -0.99) {
      throw new Error('XIRR diverged (rate < -99%)')
    }
  }

  throw new Error(`XIRR did not converge after ${maxIterations} iterations`)
}

/**
 * Calculate Year-to-Date (YTD) return
 *
 * @param transactions - All transactions
 * @param currentValue - Current portfolio value
 * @returns YTD return as a percentage
 */
export function calculateYTD(
  transactions: any[],
  currentValue: number
): number {
  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  // Filter transactions since start of year
  const ytdTransactions = transactions.filter(
    tx => new Date(tx.date) >= yearStart
  )

  if (ytdTransactions.length === 0) {
    return 0
  }

  // Build cashflows
  const cashflows: Cashflow[] = ytdTransactions.map(tx => ({
    date: new Date(tx.date),
    amount: -tx.amount // Negative for investments
  }))

  // Add current value as final cashflow
  cashflows.push({
    date: new Date(),
    amount: currentValue
  })

  try {
    return calculateXIRR(cashflows)
  } catch (error) {
    console.error('Error calculating YTD:', error)
    return 0
  }
}

/**
 * Calculate simple total return percentage
 *
 * @param costBasis - Total amount invested
 * @param currentValue - Current portfolio value
 * @returns Total return as a percentage
 */
export function calculateTotalReturn(
  costBasis: number,
  currentValue: number
): number {
  if (costBasis === 0) return 0
  return ((currentValue / costBasis - 1) * 100)
}
