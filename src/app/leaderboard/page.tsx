import { createClient } from '@/lib/supabase/server'
import LeaderboardTable from '@/components/leaderboard-table'
import LeaderboardFilters from '@/components/leaderboard-filters'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface LeaderboardPageProps {
  searchParams: {
    filter?: string
  }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const supabase = createClient()
  const filter = searchParams.filter || 'all'

  // Build query based on filter
  let query = supabase
    .from('portfolios')
    .select(`
      *,
      profile:profiles(display_mode, real_name, username)
    `)
    .eq('show_in_leaderboard', true)

  // Apply time period filters
  const now = new Date()
  if (filter === 'ytd') {
    // Year to date - at least data from this year
    const yearStart = new Date(now.getFullYear(), 0, 1)
    query = query.gte('last_updated_at', yearStart.toISOString())
  } else if (filter === '1y') {
    // At least 12 months of data
    query = query.gte('xirr_period_months', 12)
  } else if (filter === '2y') {
    // At least 24 months of data
    query = query.gte('xirr_period_months', 24)
  }

  // Order by XIRR descending
  query = query.order('xirr_percent', { ascending: false })

  const { data: portfolios } = await query

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold">TrustReturns</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Investor Leaderboard
          </h1>
          <p className="text-slate-600">
            Rankings of verified investment returns powered by Plaid
          </p>
        </div>

        {/* Filters */}
        <LeaderboardFilters currentFilter={filter} />

        {/* Table */}
        <LeaderboardTable portfolios={portfolios || []} />

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Returns are calculated using XIRR (time-weighted internal rate of return)
          </p>
          <p className="mt-1">
            All data is verified through direct broker connections via Plaid
          </p>
        </div>
      </main>
    </div>
  )
}
