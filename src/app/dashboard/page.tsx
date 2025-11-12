import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnectBrokerButton from '@/components/connect-broker-button'
import PortfolioMetrics from '@/components/portfolio-metrics'
import PrivacySettings from '@/components/privacy-settings'
import ProfileEditor from '@/components/profile-editor'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">TrustReturns</h1>
            </div>
            <div className="flex items-center">
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Verify your investment returns</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            {!portfolio ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Connect Your Broker</h3>
                <p className="text-slate-600 mb-6">
                  Connect your brokerage account to calculate your verified returns
                </p>
                <ConnectBrokerButton />
              </div>
            ) : (
              <PortfolioMetrics portfolio={portfolio} />
            )}
          </div>

          {profile && (
            <>
              <div className="md:col-span-2">
                <PrivacySettings profile={profile} />
              </div>
              <div className="md:col-span-2">
                <ProfileEditor profile={profile} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
