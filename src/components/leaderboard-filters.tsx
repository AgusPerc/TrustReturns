'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LeaderboardFiltersProps {
  currentFilter: string
}

export default function LeaderboardFilters({ currentFilter }: LeaderboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters = [
    { value: 'all', label: 'All Time' },
    { value: 'ytd', label: 'YTD' },
    { value: '1y', label: '1 Year+' },
    { value: '2y', label: '2 Years+' },
  ]

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams)
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 mb-6">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? 'default' : 'outline'}
          onClick={() => handleFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
