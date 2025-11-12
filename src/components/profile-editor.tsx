'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

interface ProfileEditorProps {
  profile: Profile
}

export default function ProfileEditor({ profile }: ProfileEditorProps) {
  const [bio, setBio] = useState(profile?.bio || '')
  const [strategy, setStrategy] = useState(profile?.strategy || '')
  const [twitterHandle, setTwitterHandle] = useState(profile?.twitter_handle || '')
  const [telegramHandle, setTelegramHandle] = useState(profile?.telegram_handle || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setLoading(true)

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          strategy,
          twitter_handle: twitterHandle,
          telegram_handle: telegramHandle,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>
          This information will be visible on your public profile page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="strategy">Investment Strategy</Label>
          <Input
            id="strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder="e.g., Deep Value, Growth, Index"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about your investment philosophy..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Handle</Label>
            <Input
              id="twitter"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram Handle</Label>
            <Input
              id="telegram"
              value={telegramHandle}
              onChange={(e) => setTelegramHandle(e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        {profile?.username && (
          <div className="pt-4 border-t">
            <Label className="text-sm text-slate-600">Your public profile:</Label>
            <a
              href={`/profile/${profile.username}`}
              target="_blank"
              className="text-blue-600 hover:underline block mt-1"
            >
              trustreturns.app/profile/{profile.username}
            </a>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  )
}
