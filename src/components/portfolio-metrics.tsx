import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Portfolio } from '@/types/database'

export default function PortfolioMetrics({ portfolio }: { portfolio: Portfolio }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Performance</CardTitle>
            <Badge variant="secondary">
              ✓ {portfolio.institution_name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">XIRR</p>
              <p className="text-3xl font-bold text-slate-900">
                {portfolio.xirr_percent?.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {portfolio.xirr_period_months} months
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">Total Return</p>
              <p className="text-3xl font-bold text-slate-900">
                {portfolio.total_return_percent?.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Since start</p>
            </div>

            <div>
              <p className="text-sm text-slate-600 mb-1">YTD</p>
              <p className="text-3xl font-bold text-slate-900">
                {portfolio.ytd_return_percent?.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Year to date</p>
            </div>

            {portfolio.show_account_value && (
              <div>
                <p className="text-sm text-slate-600 mb-1">Portfolio Value</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${(portfolio.current_value! / 1000).toFixed(0)}k
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Last updated: {portfolio.last_updated_at ? new Date(portfolio.last_updated_at).toLocaleString() : 'Never'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
