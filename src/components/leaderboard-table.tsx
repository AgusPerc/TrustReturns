import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Portfolio } from '@/types/database'

interface LeaderboardTableProps {
  portfolios: (Portfolio & {
    profile: {
      display_mode: string
      real_name: string | null
      username: string | null
    }
  })[]
}

export default function LeaderboardTable({ portfolios }: LeaderboardTableProps) {
  const getDisplayName = (portfolio: LeaderboardTableProps['portfolios'][0]) => {
    const { display_mode, real_name, username } = portfolio.profile

    switch (display_mode) {
      case 'real_name':
        return real_name || 'Anonymous'
      case 'username':
        return username || 'Anonymous'
      case 'anonymous':
      default:
        return 'Anonymous'
    }
  }

  return (
    <div className="rounded-lg border bg-white shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Investor</TableHead>
            <TableHead className="text-right">XIRR</TableHead>
            <TableHead className="text-right">Period</TableHead>
            <TableHead className="text-right">Total Return</TableHead>
            <TableHead className="text-right">YTD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500">
                No portfolios to display
              </TableCell>
            </TableRow>
          ) : (
            portfolios.map((portfolio, index) => (
              <TableRow key={portfolio.id}>
                <TableCell className="font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getDisplayName(portfolio)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      ✓ {portfolio.institution_name}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {portfolio.xirr_percent?.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {portfolio.xirr_period_months} months
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {portfolio.total_return_percent?.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {portfolio.ytd_return_percent?.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
