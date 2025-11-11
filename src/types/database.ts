export interface Profile {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
  strategy: string | null
  twitter_handle: string | null
  telegram_handle: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  access_token: string
  item_id: string
  institution_name: string | null
  xirr_percent: number | null
  xirr_period_months: number | null
  total_return_percent: number | null
  ytd_return_percent: number | null
  current_value: number | null
  total_cost_basis: number | null
  first_transaction_date: string | null
  last_updated_at: string | null
  show_in_leaderboard: boolean
  show_account_value: boolean
  display_mode: 'real_name' | 'username' | 'anonymous'
  is_monetized: boolean
  subscription_price_monthly: number
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  rank: number
  portfolio: Portfolio
  profile: Profile
}

export interface Holding {
  id: string
  portfolio_id: string
  ticker: string
  security_name: string | null
  quantity: number | null
  cost_basis: number | null
  current_price: number | null
  current_value: number | null
  percent_of_portfolio: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  subscriber_user_id: string
  creator_user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string | null
  price_cents: number
  created_at: string
  updated_at: string
}

export interface CreatorSubscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string | null
  created_at: string
  updated_at: string
}
