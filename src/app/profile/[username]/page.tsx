import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()

  // Find user by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) {
    notFound()
  }

  // Get portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', profile.id)
    .eq('show_in_leaderboard', true)
    .single()

  if (!portfolio) {
    notFound()
  }

  // Get rank
  const { data: allPortfolios } = await supabase
    .from('portfolios')
    .select('id, xirr_percent')
    .eq('show_in_leaderboard', true)
    .not('xirr_percent', 'is', null)
    .order('xirr_percent', { ascending: false })

  const rank = (allPortfolios?.findIndex((p) => p.id === portfolio.id) ?? -1) + 1

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-xl font-bold">TrustReturns</h1>
              </Link>
              <Link href="/leaderboard" className="text-sm text-slate-600 hover:text-slate-900">
                Leaderboard
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            🏆 #{rank} Ranked Investor
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            {profile.username ? `@${profile.username}` : profile.real_name || 'Anonymous'}
          </h1>
          <div className="flex items-center gap-4 text-slate-600">
            <span>✓ Verified with {portfolio.institution_name}</span>
            <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Metrics */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">XIRR</p>
                <p className="text-3xl font-bold">{portfolio.xirr_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {portfolio.xirr_period_months} months
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Total Return</p>
                <p className="text-3xl font-bold">{portfolio.total_return_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">Since start</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">YTD</p>
                <p className="text-3xl font-bold">{portfolio.ytd_return_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">This year</p>
              </div>

              {portfolio.show_account_value && portfolio.current_value && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold">
                    ${(portfolio.current_value / 1000).toFixed(0)}k
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {(profile.bio || profile.strategy) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.strategy && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Strategy</p>
                  <p className="font-medium">{profile.strategy}</p>
                </div>
              )}
              {profile.bio && (
                <div>
                  <p className="text-slate-700">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {(profile.twitter_handle || profile.telegram_handle) && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {profile.twitter_handle && (
                  <a
                    href={`https://twitter.com/${profile.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🐦 @{profile.twitter_handle}
                  </a>
                )}
                {profile.telegram_handle && (
                  <a
                    href={`https://t.me/${profile.telegram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📱 @{profile.telegram_handle}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA - Placeholder for Phase 4 */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">💎 Follow My Portfolio</h3>
              <p className="text-slate-600 mb-1">$249/year ($0.68/day)</p>
              <p className="text-sm text-slate-500 mb-6">
                Get access to holdings, thesis, monthly deep dives, and more
              </p>
              <Button size="lg" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
