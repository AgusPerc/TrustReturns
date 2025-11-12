'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

interface PrivacySettingsProps {
  profile: Profile
}

export default function PrivacySettings({ profile }: PrivacySettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [displayMode, setDisplayMode] = useState(profile.display_mode || 'anonymous')
  const [showInLeaderboard, setShowInLeaderboard] = useState(profile.show_in_leaderboard)
  const [showAccountValue, setShowAccountValue] = useState(profile.show_account_value)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile/update-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_mode: displayMode,
          show_in_leaderboard: showInLeaderboard,
          show_account_value: showAccountValue,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control how your information appears on the leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Mode */}
        <div className="space-y-2">
          <Label htmlFor="display-mode">Display As</Label>
          <Select value={displayMode} onValueChange={setDisplayMode}>
            <SelectTrigger id="display-mode">
              <SelectValue placeholder="Select display mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real_name">
                Real Name {profile.real_name && `(${profile.real_name})`}
              </SelectItem>
              <SelectItem value="username">
                Username {profile.username && `(@${profile.username})`}
              </SelectItem>
              <SelectItem value="anonymous">Anonymous</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Choose how you want to appear on the public leaderboard
          </p>
        </div>

        {/* Show in Leaderboard */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-leaderboard">Show on Leaderboard</Label>
            <p className="text-xs text-slate-500">
              Display your verified returns on the public leaderboard
            </p>
          </div>
          <Switch
            id="show-leaderboard"
            checked={showInLeaderboard}
            onCheckedChange={setShowInLeaderboard}
          />
        </div>

        {/* Show Account Value */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-value">Show Portfolio Value</Label>
            <p className="text-xs text-slate-500">
              Display your total portfolio value on your dashboard
            </p>
          </div>
          <Switch
            id="show-value"
            checked={showAccountValue}
            onCheckedChange={setShowAccountValue}
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
