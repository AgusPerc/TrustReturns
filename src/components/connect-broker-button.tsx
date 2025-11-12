'use client'

import { useCallback, useState, useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ConnectBrokerButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Create link token on mount
  useEffect(() => {
    async function createLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        })
        const data = await response.json()
        setLinkToken(data.link_token)
      } catch (error) {
        console.error('Error creating link token:', error)
      }
    }
    createLinkToken()
  }, [])

  const onSuccess = useCallback(async (public_token: string) => {
    setLoading(true)

    try {
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      })

      const data = await response.json()

      if (data.success) {
        // Calculate returns
        await fetch('/api/plaid/calculate-returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio_id: data.portfolio_id }),
        })

        // Refresh page to show new data
        router.refresh()
      }
    } catch (error) {
      console.error('Error connecting broker:', error)
      setLoading(false)
    }
  }, [router])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  })

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || loading}
      size="lg"
    >
      {loading ? 'Connecting...' : 'Connect Broker'}
    </Button>
  )
}
