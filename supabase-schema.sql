-- TrustReturns Database Schema
-- Execute this in Supabase SQL Editor
-- Strategy: Create all tables first, then add RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- STEP 1: CREATE ALL TABLES (no RLS yet)
-- ============================================

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users primary key,
  display_name text,
  username text unique,
  bio text,
  strategy text,
  twitter_handle text,
  telegram_handle text,
  avatar_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- PORTFOLIOS TABLE
create table public.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  access_token text not null,
  item_id text not null,
  institution_name text,
  xirr_percent double precision,
  xirr_period_months integer,
  total_return_percent double precision,
  ytd_return_percent double precision,
  current_value double precision,
  total_cost_basis double precision,
  first_transaction_date date,
  last_updated_at timestamp,
  show_in_leaderboard boolean default true,
  show_account_value boolean default false,
  display_mode text default 'anonymous',
  is_monetized boolean default false,
  subscription_price_monthly integer default 2900,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- SUBSCRIPTIONS TABLE
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  subscriber_user_id uuid references auth.users not null,
  creator_user_id uuid references auth.users not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null,
  current_period_end timestamp,
  price_cents integer not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- HOLDINGS TABLE
create table public.holdings (
  id uuid default uuid_generate_v4() primary key,
  portfolio_id uuid references portfolios not null,
  ticker text not null,
  security_name text,
  quantity double precision,
  cost_basis double precision,
  current_price double precision,
  current_value double precision,
  percent_of_portfolio double precision,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- CREATOR SUBSCRIPTIONS TABLE
create table public.creator_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null,
  current_period_end timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- CREATOR EARNINGS TABLE
create table public.creator_earnings (
  id uuid default uuid_generate_v4() primary key,
  creator_user_id uuid references auth.users not null,
  month date not null,
  gross_revenue_cents integer default 0,
  platform_fee_cents integer default 0,
  stripe_fee_cents integer default 0,
  net_payout_cents integer default 0,
  subscriber_count integer default 0,
  created_at timestamp default now(),
  unique(creator_user_id, month)
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_xirr on portfolios(xirr_percent desc nulls last);
create index idx_subscriptions_subscriber on subscriptions(subscriber_user_id);
create index idx_subscriptions_creator on subscriptions(creator_user_id);
create index idx_subscriptions_stripe on subscriptions(stripe_subscription_id);
create index idx_holdings_portfolio on holdings(portfolio_id);
create index idx_creator_subs_user on creator_subscriptions(user_id);
create index idx_creator_earnings_user on creator_earnings(creator_user_id);
create index idx_creator_earnings_month on creator_earnings(month);

-- ============================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================

alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.subscriptions enable row level security;
alter table public.holdings enable row level security;
alter table public.creator_subscriptions enable row level security;
alter table public.creator_earnings enable row level security;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- PROFILES POLICIES
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- PORTFOLIOS POLICIES
create policy "Portfolio metrics viewable by everyone"
  on portfolios for select using (show_in_leaderboard = true);

create policy "Users can manage own portfolios"
  on portfolios for all using (auth.uid() = user_id);

-- SUBSCRIPTIONS POLICIES
create policy "Users can view own subscriptions"
  on subscriptions for select using (auth.uid() = subscriber_user_id);

create policy "Creators can view their subscriber list"
  on subscriptions for select using (auth.uid() = creator_user_id);

-- HOLDINGS POLICIES (now subscriptions table exists)
create policy "Holdings visible to portfolio owner"
  on holdings for select
  using (
    portfolio_id in (
      select id from portfolios where user_id = auth.uid()
    )
  );

create policy "Holdings visible to active subscribers"
  on holdings for select
  using (
    portfolio_id in (
      select p.id
      from portfolios p
      join profiles prof on prof.id = p.user_id
      where prof.id in (
        select creator_user_id
        from subscriptions
        where subscriber_user_id = auth.uid()
          and status = 'active'
      )
    )
  );

-- CREATOR SUBSCRIPTIONS POLICIES
create policy "Users can view own creator subscription"
  on creator_subscriptions for select using (auth.uid() = user_id);

-- CREATOR EARNINGS POLICIES
create policy "Creators can view own earnings"
  on creator_earnings for select using (auth.uid() = creator_user_id);

-- ============================================
-- STEP 5: CREATE TRIGGER
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- DONE! ✅
-- ============================================
-- All tables, indexes, RLS policies, and triggers created successfully
