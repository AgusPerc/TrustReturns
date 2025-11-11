import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const supabase = createClient()

  let connectionStatus = '❌ Failed'
  let profilesCount = 0
  let error = null

  try {
    // Test connection by querying profiles table
    const { data, error: queryError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(1)

    if (queryError) {
      error = queryError.message
    } else {
      connectionStatus = '✅ Connected'
      profilesCount = count || 0
    }
  } catch (e: any) {
    error = e.message
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-600">Connection Status:</p>
            <p className="text-2xl font-bold">{connectionStatus}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Profiles Count:</p>
            <p className="text-2xl font-bold">{profilesCount}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-sm font-semibold text-red-800">Error:</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {!error && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-sm text-green-800">
                ✅ Supabase is properly configured!
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-slate-500">
              Database URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
