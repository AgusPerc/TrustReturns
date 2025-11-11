TrustReturns - Plan de Desarrollo por Fases
🎯 Filosofía del Plan
Este plan está diseñado para que cada fase sea completamente funcional y testeable antes de avanzar. Cada fase construye sobre la anterior y puedes probar el producto en cada etapa.
Reglas de oro:

✅ Cada fase = 1 feature vertical completa (backend + frontend)
✅ Testing manual al final de cada fase
✅ Git branch por fase, merge a main solo cuando funciona
✅ Puedes lanzar en cualquier momento después de Fase 3
✅ Si algo falla, iteras en esa fase antes de continuar


📋 Resumen de Fases
FASE 0: Setup (1 día)                    → npm run dev funciona
FASE 1: Vertical Slice Mínima (3-4 días) → Conectas IB, ves tu XIRR
FASE 2: Leaderboard (2-3 días)           → Tabla pública con rankings
FASE 3: Profiles (2 días)                → Profile pages + dashboard
FASE 4: Monetization (3-4 días)          → Stripe + subscriptions
FASE 5: Creator Tier (2-3 días)          → Otros pueden monetizar
FASE 6: Polish & Launch (2-3 días)       → Production ready

Total: 14-20 días (2-3 semanas)

FASE 0: Setup & Foundation
Duración: 1 día
Objetivo: Proyecto inicializado, todas las cuentas creadas, npm run dev funciona
📦 Tareas
1. Crear cuentas de servicios
bash# Checklist de cuentas:
□ Plaid Dashboard (Development mode)
  → https://dashboard.plaid.com/signup
  
□ Supabase Project
  → https://supabase.com/dashboard
  → Crear proyecto: "trustreturns-mvp"
  
□ Stripe Account (Test mode)
  → https://dashboard.stripe.com/register
  
□ Vercel Account
  → https://vercel.com/signup
  → Link con tu GitHub
  
□ Domain
  → Comprar trustreturns.app (Namecheap, $12/año)
  → O usar subdominio Vercel gratis por ahora
2. Inicializar proyecto Next.js
bash# Crear proyecto
npx create-next-app@latest trustreturns \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd trustreturns

# Instalar dependencias
npm install plaid @plaid/react-plaid-link
npm install @supabase/supabase-js @supabase/ssr
npm install stripe @stripe/stripe-js
npm install date-fns zod
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui
npx shadcn@latest init

# Responde:
# - Style: Default
# - Color: Slate (o tu preferencia)
# - CSS variables: Yes

npx shadcn@latest add button card input label table badge avatar separator
3. Setup Supabase
sql-- En Supabase SQL Editor, ejecuta:

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
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

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Portfolios table
create table public.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  
  -- Plaid connection
  access_token text not null,
  item_id text not null,
  institution_name text,
  
  -- Calculated metrics
  xirr_percent double precision,
  xirr_period_months integer,
  total_return_percent double precision,
  ytd_return_percent double precision,
  current_value double precision,
  total_cost_basis double precision,
  first_transaction_date date,
  last_updated_at timestamp,
  
  -- Privacy settings
  show_in_leaderboard boolean default true,
  show_account_value boolean default false,
  display_mode text default 'anonymous',
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Indexes
create index idx_portfolios_user_id on portfolios(user_id);
create index idx_portfolios_xirr on portfolios(xirr_percent desc nulls last);

-- RLS for portfolios
alter table public.portfolios enable row level security;

create policy "Portfolio metrics viewable by everyone"
  on portfolios for select
  using (show_in_leaderboard = true);

create policy "Users can manage own portfolios"
  on portfolios for all
  using (auth.uid() = user_id);

-- Function to create profile on signup (trigger)
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
4. Environment Variables
bash# .env.local
# Copia este template y llena con tus valores

# Plaid (Development)
NEXT_PUBLIC_PLAID_ENV=development
PLAID_CLIENT_ID=
PLAID_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (Test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption (genera una key random de 32 chars)
ENCRYPTION_KEY=
Generar ENCRYPTION_KEY:
bashnode -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
5. Estructura de carpetas base
bashmkdir -p src/app/api/plaid
mkdir -p src/app/api/auth
mkdir -p src/app/(auth)
mkdir -p src/app/(dashboard)
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/types
6. Configuración de Supabase client
typescript// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
typescript// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component
          }
        },
      },
    }
  )
}
7. Plaid client setup
typescript// src/lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const plaidEnv = process.env.NEXT_PUBLIC_PLAID_ENV as 'development' | 'production'

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
8. TypeScript types
typescript// src/types/database.ts
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
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  rank: number
  portfolio: Portfolio
  profile: Profile
}
✅ Checklist de Testing - Fase 0
bash# 1. Verificar que el proyecto corre
npm run dev
# → Debería abrir en http://localhost:3000

# 2. Verificar Supabase connection
# Crear un test file temporal:
# src/app/test-supabase/page.tsx

import { createClient } from '@/lib/supabase/client'

export default async function TestPage() {
  const supabase = createClient()
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  
  return (
    <div className="p-8">
      <h1>Supabase Test</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </div>
  )
}

# Visita: http://localhost:3000/test-supabase
# → Debería mostrar [] o error de auth (ambos OK, significa que conecta)

# 3. Verificar Plaid client
# No podemos testear sin token, pero verifica que no hay errores de import
# Lo testeamos en Fase 1

# 4. Git init
git init
git add .
git commit -m "Phase 0: Initial setup"
git branch -M main

# 5. Push a GitHub
gh repo create trustreturns --private --source=. --push
# O manualmente en github.com

# 6. Deploy a Vercel (opcional, o espera a Fase 3)
vercel
# Link con tu proyecto GitHub
# Agrega env variables en Vercel dashboard
```

## 🎉 Definición de "Fase 0 Completa"
```
✅ npm run dev funciona sin errores
✅ Supabase tables creadas
✅ Supabase connection funciona (test page)
✅ Environment variables configurados
✅ Git repository inicializado
✅ shadcn/ui components instalados
✅ Estructura de carpetas lista

→ LISTO PARA FASE 1
```

---

# FASE 1: Vertical Slice Mínima
**Duración:** 3-4 días  
**Objetivo:** Tú puedes conectar tu Interactive Brokers, calcular XIRR, y verlo en pantalla

## 🎯 Features de esta fase
```
□ Landing page mínima con botón "Connect Broker"
□ Auth básico (signup/login con email)
□ Plaid Link integration (connect broker)
□ XIRR calculation function
□ API route para calcular returns
□ Dashboard simple mostrando TU XIRR
📦 Tareas
1. XIRR Calculation Function
typescript// src/lib/xirr.ts

export interface Cashflow {
  date: Date
  amount: number // negative = investment, positive = return
}

/**
 * Calcula XIRR usando Newton-Raphson method
 */
export function calculateXIRR(
  cashflows: Cashflow[],
  tolerance: number = 1e-6,
  maxIterations: number = 1000
): number {
  if (cashflows.length < 2) {
    throw new Error('Need at least 2 cashflows to calculate XIRR')
  }

  // Sort by date
  const sorted = [...cashflows].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  )

  const startDate = sorted[0].date
  
  // Convert dates to years from start
  const flows = sorted.map(cf => ({
    years: (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    amount: cf.amount
  }))

  // Initial guess: 10%
  let rate = 0.1

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let derivative = 0

    flows.forEach(flow => {
      const factor = Math.pow(1 + rate, flow.years)
      npv += flow.amount / factor
      
      if (flow.years !== 0) {
        derivative -= flow.years * flow.amount / factor / (1 + rate)
      }
    })

    // Converged?
    if (Math.abs(npv) < tolerance) {
      return rate * 100 // Return as percentage
    }

    // Newton-Raphson step
    if (derivative === 0) {
      throw new Error('Derivative is 0, cannot calculate XIRR')
    }

    rate -= npv / derivative

    // Prevent absurd values
    if (rate < -0.99) {
      throw new Error('XIRR diverged (rate < -99%)')
    }
  }

  throw new Error(`XIRR did not converge after ${maxIterations} iterations`)
}

/**
 * Calculate YTD return
 */
export function calculateYTD(
  transactions: any[],
  currentValue: number
): number {
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  
  const ytdTransactions = transactions.filter(
    tx => new Date(tx.date) >= yearStart
  )

  if (ytdTransactions.length === 0) {
    return 0
  }

  const cashflows: Cashflow[] = ytdTransactions.map(tx => ({
    date: new Date(tx.date),
    amount: -tx.amount
  }))

  cashflows.push({
    date: new Date(),
    amount: currentValue
  })

  try {
    return calculateXIRR(cashflows)
  } catch (error) {
    console.error('Error calculating YTD:', error)
    return 0
  }
}
2. Auth Pages
typescript// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your TrustReturns account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-center mt-4 text-slate-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
typescript// src/app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success - redirect to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join TrustReturns to verify your investment returns</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <p className="text-sm text-center mt-4 text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
3. Auth Callback Route
typescript// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
4. Middleware para proteger rutas
typescript// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Auth routes (redirect if already logged in)
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
5. Plaid API Routes
typescript// src/app/api/plaid/create-link-token/route.ts
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { 
        client_user_id: user.id 
      },
      client_name: 'TrustReturns',
      products: ['investments', 'transactions'],
      country_codes: ['US'],
      language: 'en',
    })

    return NextResponse.json({ link_token: response.data.link_token })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}
typescript// src/app/api/plaid/exchange/route.ts
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { public_token } = await req.json()

    // Exchange token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = exchangeResponse.data

    // Get institution info
    const itemResponse = await plaidClient.itemGet({ access_token })
    const institutionId = itemResponse.data.item.institution_id
    
    let institutionName = 'Unknown'
    if (institutionId) {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'],
      })
      institutionName = institutionResponse.data.institution.name
    }

    // Save to database (access_token in plaintext for now, encrypt in production)
    const { data: portfolio, error: dbError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        access_token: access_token, // TODO: Encrypt
        item_id,
        institution_name: institutionName,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving portfolio:', dbError)
      return NextResponse.json(
        { error: 'Failed to save portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      portfolio_id: portfolio.id 
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to connect broker' },
      { status: 500 }
    )
  }
}
typescript// src/app/api/plaid/calculate-returns/route.ts
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { calculateXIRR, calculateYTD, type Cashflow } from '@/lib/xirr'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { portfolio_id } = await req.json()

    // Get portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .eq('user_id', user.id)
      .single()

    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    const accessToken = portfolio.access_token

    // 1. Fetch transactions (with pagination)
    let allTransactions: any[] = []
    let hasMore = true
    let cursor: string | undefined = undefined

    while (hasMore) {
      const txResponse = await plaidClient.investmentsTransactionsGet({
        access_token: accessToken,
        start_date: '2020-01-01',
        end_date: new Date().toISOString().split('T')[0],
        options: { cursor, count: 500 },
      })

      allTransactions = allTransactions.concat(
        txResponse.data.investment_transactions
      )
      
      hasMore = txResponse.data.has_more
      cursor = txResponse.data.next_cursor
    }

    // 2. Fetch holdings
    const holdingsResponse = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    })

    const holdings = holdingsResponse.data.holdings

    // 3. Calculate current value
    const currentValue = holdings.reduce(
      (sum, h) => sum + (h.quantity * h.institution_price),
      0
    )

    const totalCostBasis = holdings.reduce(
      (sum, h) => sum + h.cost_basis,
      0
    )

    // 4. Build cashflows for XIRR
    const cashflows: Cashflow[] = allTransactions.map(tx => ({
      date: new Date(tx.date),
      amount: -tx.amount // Plaid uses negative for buys
    }))

    cashflows.push({
      date: new Date(),
      amount: currentValue
    })

    // 5. Calculate metrics
    let xirr = 0
    let totalReturn = 0
    let ytd = 0

    try {
      xirr = calculateXIRR(cashflows)
      totalReturn = ((currentValue / totalCostBasis - 1) * 100)
      ytd = calculateYTD(allTransactions, currentValue)
    } catch (error) {
      console.error('Error calculating returns:', error)
    }

    // 6. Calculate period
    const firstDate = allTransactions.length > 0 
      ? allTransactions[allTransactions.length - 1].date 
      : new Date().toISOString().split('T')[0]
    
    const period = Math.floor(
      (new Date().getTime() - new Date(firstDate).getTime()) / 
      (1000 * 60 * 60 * 24 * 30)
    )

    // 7. Update database
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        xirr_percent: xirr,
        xirr_period_months: period,
        total_return_percent: totalReturn,
        ytd_return_percent: ytd,
        current_value: currentValue,
        total_cost_basis: totalCostBasis,
        first_transaction_date: firstDate,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', portfolio_id)

    if (updateError) {
      console.error('Error updating portfolio:', updateError)
      return NextResponse.json(
        { error: 'Failed to update metrics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metrics: {
        xirr: xirr.toFixed(1),
        totalReturn: totalReturn.toFixed(1),
        ytd: ytd.toFixed(1),
        period,
        currentValue,
      },
    })
  } catch (error) {
    console.error('Error calculating returns:', error)
    return NextResponse.json(
      { error: 'Failed to calculate returns' },
      { status: 500 }
    )
  }
}
6. Dashboard con Plaid Link
typescript// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnectBrokerButton from '@/components/connect-broker-button'
import PortfolioMetrics from '@/components/portfolio-metrics'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

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
      </main>
    </div>
  )
}
typescript// src/components/connect-broker-button.tsx
'use client'

import { useCallback, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ConnectBrokerButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Create link token on mount
  useState(() => {
    async function createLinkToken() {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      })
      const data = await response.json()
      setLinkToken(data.link_token)
    }
    createLinkToken()
  })

  const onSuccess = useCallback(async (public_token: string) => {
    setLoading(true)
    
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

      router.refresh()
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
typescript// src/components/portfolio-metrics.tsx
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
            Last updated: {new Date(portfolio.last_updated_at!).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
7. Signout route
typescript// src/app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
✅ Checklist de Testing - Fase 1
bash# 1. Test Auth Flow
□ Ir a /signup
□ Crear cuenta con tu email
□ Verifica que te redirige a /dashboard
□ Sign out
□ Login de nuevo
□ Verifica que funciona

# 2. Test Plaid Connection
□ En /dashboard, click "Connect Broker"
□ Usa credenciales de Plaid Sandbox:
  Username: user_good
  Password: pass_good
□ Selecciona un broker (ej: Chase)
□ Completa el flow
□ Verifica que se guarda en Supabase:
  - Ve a Supabase dashboard → Table Editor → portfolios
  - Deberías ver tu portfolio con access_token, item_id, institution_name

# 3. Test XIRR Calculation
□ Después de conectar, el botón debería mostrar "Calculating..."
□ Espera ~10-30 segundos
□ Página debería refresh automáticamente
□ Deberías ver tus métricas:
  - XIRR %
  - Total Return %
  - YTD %
  - Period (months)

# 4. Verifica en Supabase
□ Ve a portfolios table
□ Verifica que xirr_percent, total_return_percent, ytd_return_percent
  tienen valores (no null)

# 5. Test con TU cuenta real (IB)
□ Si quieres, prueba conectando tu Interactive Brokers real
□ Verifica que tu 50% CAGR se calcula correctamente
□ Si algo falla, revisa logs en consola

# 6. Git commit
git add .
git commit -m "Phase 1: Auth + Plaid + XIRR calculation"
git push
```

## 🎉 Definición de "Fase 1 Completa"
```
✅ Signup/Login funciona
✅ Middleware protege /dashboard
✅ Plaid Link se abre correctamente
✅ Broker se conecta (sandbox o real)
✅ Portfolio se guarda en Supabase
✅ XIRR se calcula correctamente
✅ Dashboard muestra tus métricas

→ Puedes conectar TU Interactive Brokers y ver tu 50% CAGR verificado

→ LISTO PARA FASE 2
```

---

# FASE 2: Leaderboard Público
**Duración:** 2-3 días  
**Objetivo:** Tabla pública con rankings, filtros, y privacy settings

## 🎯 Features de esta fase
```
□ Landing page real (hero + CTA)
□ Leaderboard page pública (/leaderboard)
□ Tabla con columnas: Rank, Name, XIRR, Period, Total Return, YTD
□ Filtros: All Time, YTD, 1 Year, 2 Years
□ Privacy settings en dashboard
□ Username/Anonymous configuration
📦 Tareas
1. Landing Page
typescript// src/app/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, TrendingUp, Users, Lock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">TrustReturns</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/leaderboard">
                <Button variant="ghost">Leaderboard</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Powered by Plaid
        </Badge>
        
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Verify Your Investment Returns
        </h1>
        
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Connect your broker, prove your track record. Join value investors
          with <strong>verified returns</strong>.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Connect Your Broker
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Leaderboard
            </Button>
          </Link>
        </div>

        <div className="flex justify-center gap-8 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            100% Read-Only
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Bank-Level Security
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Free Forever
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-600 mb-6">
            Trusted by investors using:
          </p>
          <div className="flex justify-center gap-12 opacity-60">
            {/* Replace with actual broker logos */}
            <span className="font-semibold">Fidelity</span>
            <span className="font-semibold">Schwab</span>
            <span className="font-semibold">Vanguard</span>
            <span className="font-semibold">Interactive Brokers</span>
            <span className="font-semibold">Robinhood</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Verified Returns</h3>
            <p className="text-slate-600">
              Connect directly to your broker via Plaid. No self-reported numbers, 
              no screenshots. Real data.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Public Leaderboard</h3>
            <p className="text-slate-600">
              See how you rank against other value investors. XIRR calculated 
              using proper time-weighted returns.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-slate-600">
              Choose what to show: real name, username, or anonymous. 
              Holdings are always private.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to verify your returns?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join the community of transparent investors
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started - It's Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
2. Leaderboard Page
typescript// src/app/leaderboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import LeaderboardTable from '@/components/leaderboard-table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = createClient()

  // Get all portfolios for leaderboard
  const { data: portfolios } = await supabase
    .from('portfolios')
    .select(`
      *,
      profiles (
        display_name,
        username
      )
    `)
    .eq('show_in_leaderboard', true)
    .not('xirr_percent', 'is', null)
    .order('xirr_percent', { ascending: false })

  const stats = {
    totalInvestors: portfolios?.length || 0,
    avgXIRR: portfolios?.length 
      ? (portfolios.reduce((sum, p) => sum + (p.xirr_percent || 0), 0) / portfolios.length).toFixed(1)
      : '0',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold">TrustReturns</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Join Leaderboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🏆 Value Investors Leaderboard
          </h1>
          <p className="text-slate-600">
            Verified investment returns from real brokerage accounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-slate-600 mb-1">Total Investors</p>
            <p className="text-2xl font-bold">{stats.totalInvestors}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-slate-600 mb-1">Average XIRR</p>
            <p className="text-2xl font-bold">{stats.avgXIRR}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-slate-600 mb-1">Top Performer</p>
            <p className="text-2xl font-bold">
              {portfolios?.[0]?.xirr_percent?.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-slate-600 mb-1">Verified</p>
            <Badge variant="secondary" className="mt-1">
              100% Real Data
            </Badge>
          </div>
        </div>

        {/* Table */}
        <LeaderboardTable portfolios={portfolios || []} />

        {/* CTA */}
        <div className="mt-12 bg-white rounded-lg border p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">
            Want to join the leaderboard?
          </h3>
          <p className="text-slate-600 mb-6">
            Connect your broker to verify your returns and see how you rank
          </p>
          <Link href="/signup">
            <Button size="lg">Connect Your Broker</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
typescript// src/components/leaderboard-table.tsx
'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Portfolio = any // Use proper type from database.ts

export default function LeaderboardTable({ portfolios }: { portfolios: Portfolio[] }) {
  const [filter, setFilter] = useState<'all' | 'ytd' | '1y' | '2y'>('all')

  const filteredPortfolios = portfolios.filter(p => {
    if (filter === 'all') return true
    if (filter === 'ytd') return true // All have YTD
    if (filter === '1y') return (p.xirr_period_months || 0) >= 12
    if (filter === '2y') return (p.xirr_period_months || 0) >= 24
    return true
  })

  const getDisplayName = (portfolio: Portfolio) => {
    if (portfolio.display_mode === 'real_name' && portfolio.profiles?.display_name) {
      return portfolio.profiles.display_name
    }
    if (portfolio.display_mode === 'username' && portfolio.profiles?.username) {
      return `@${portfolio.profiles.username}`
    }
    return 'Anonymous'
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Filters */}
      <div className="p-4 border-b flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Time
        </Button>
        <Button
          variant={filter === 'ytd' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('ytd')}
        >
          YTD
        </Button>
        <Button
          variant={filter === '1y' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('1y')}
        >
          1 Year+
        </Button>
        <Button
          variant={filter === '2y' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('2y')}
        >
          2 Years+
        </Button>
      </div>

      {/* Table */}
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
          {filteredPortfolios.map((portfolio, index) => (
            <TableRow key={portfolio.id}>
              <TableCell className="font-medium">
                {getRankEmoji(index + 1)}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{getDisplayName(portfolio)}</div>
                  <Badge variant="secondary" className="mt-1">
                    ✓ {portfolio.institution_name}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {portfolio.xirr_percent?.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right text-sm text-slate-600">
                {portfolio.xirr_period_months} months
              </TableCell>
              <TableCell className="text-right font-semibold">
                {portfolio.total_return_percent?.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-semibold">
                {portfolio.ytd_return_percent?.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
3. Privacy Settings en Dashboard
typescript// src/app/dashboard/page.tsx (actualizar)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnectBrokerButton from '@/components/connect-broker-button'
import PortfolioMetrics from '@/components/portfolio-metrics'
import PrivacySettings from '@/components/privacy-settings'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold">TrustReturns</h1>
              <a href="/leaderboard" className="text-sm text-slate-600 hover:text-slate-900">
                Leaderboard
              </a>
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
          <p className="text-slate-600">Manage your verified portfolio</p>
        </div>

        {!portfolio ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Connect Your Broker</h3>
            <p className="text-slate-600 mb-6">
              Connect your brokerage account to calculate your verified returns
            </p>
            <ConnectBrokerButton />
          </div>
        ) : (
          <div className="space-y-6">
            <PortfolioMetrics portfolio={portfolio} />
            <PrivacySettings portfolio={portfolio} profile={profile} />
          </div>
        )}
      </main>
    </div>
  )
}
typescript// src/components/privacy-settings.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PrivacySettings({ portfolio, profile }: any) {
  const [displayMode, setDisplayMode] = useState(portfolio.display_mode)
  const [showInLeaderboard, setShowInLeaderboard] = useState(portfolio.show_in_leaderboard)
  const [showAccountValue, setShowAccountValue] = useState(portfolio.show_account_value)
  const [username, setUsername] = useState(profile?.username || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)

    // Update portfolio settings
    await supabase
      .from('portfolios')
      .update({
        display_mode: displayMode,
        show_in_leaderboard: showInLeaderboard,
        show_account_value: showAccountValue,
      })
      .eq('id', portfolio.id)

    // Update profile
    await supabase
      .from('profiles')
      .update({
        username,
        display_name: displayName,
      })
      .eq('id', profile.id)

    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control what information is visible on the public leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leaderboard Visibility */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Show in Leaderboard</Label>
            <p className="text-sm text-slate-500">
              Appear in the public rankings
            </p>
          </div>
          <Switch
            checked={showInLeaderboard}
            onCheckedChange={setShowInLeaderboard}
          />
        </div>

        {/* Display Mode */}
        <div className="space-y-3">
          <Label>Display Name</Label>
          <RadioGroup value={displayMode} onValueChange={setDisplayMode}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="real_name" id="real_name" />
              <Label htmlFor="real_name" className="font-normal">
                Real name
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="username" id="username" />
              <Label htmlFor="username" className="font-normal">
                Username (e.g., @valueguy)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="anonymous" id="anonymous" />
              <Label htmlFor="anonymous" className="font-normal">
                Anonymous
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Name inputs */}
        {displayMode === 'real_name' && (
          <div className="space-y-2">
            <Label htmlFor="displayName">Your Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        )}

        {displayMode === 'username' && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="valueinvestor"
            />
          </div>
        )}

        {/* Show Account Value */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Show Portfolio Value</Label>
            <p className="text-sm text-slate-500">
              Display dollar amount in leaderboard
            </p>
          </div>
          <Switch
            checked={showAccountValue}
            onCheckedChange={setShowAccountValue}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
4. Agregar componente Switch de shadcn
bashnpx shadcn@latest add switch radio-group
✅ Checklist de Testing - Fase 2
bash# 1. Test Landing Page
□ Visita http://localhost:3000
□ Verifica que el hero se ve bien
□ Click en "View Leaderboard" → debe ir a /leaderboard
□ Click en "Get Started" → debe ir a /signup

# 2. Test Leaderboard
□ Visita /leaderboard
□ Deberías ver tu portfolio en la tabla
□ Verifica las columnas: Rank, Name, XIRR, Period, Total Return, YTD
□ Test filtros: All Time, YTD, 1 Year+, 2 Years+
□ Verifica que filtros funcionan

# 3. Test Privacy Settings
□ Logeate y ve a /dashboard
□ Ve a Privacy Settings card
□ Cambia "Display Mode" a "Real Name"
□ Pon tu nombre
□ Click "Save Changes"
□ Ve a /leaderboard
□ Verifica que aparece tu nombre real

□ Regresa a /dashboard
□ Cambia a "Username"
□ Pon @test_user
□ Save
□ Ve a leaderboard
□ Verifica que aparece @test_user

□ Cambia a "Anonymous"
□ Verifica que aparece "Anonymous"

□ Prueba toggle "Show in Leaderboard" OFF
□ Ve a leaderboard
□ Verifica que YA NO apareces

# 4. Invita a 1-2 amigos
□ Pídeles que se registren
□ Que conecten sus brokers
□ Ve a /leaderboard
□ Deberías ver múltiples usuarios en tabla
□ Verifica que rankings funcionan correctamente

# 5. Mobile responsive
□ Abre DevTools → Toggle device toolbar
□ Test en iPhone SE, iPad
□ Verifica que tabla es scrollable horizontal si necesario

# 6. Git commit
git add .
git commit -m "Phase 2: Landing page + Leaderboard + Privacy settings"
git push
```

## 🎉 Definición de "Fase 2 Completa"
```
✅ Landing page profesional
✅ Leaderboard público funciona
✅ Filtros (All Time, YTD, etc) funcionan
✅ Privacy settings permiten cambiar display mode
✅ Anonymous/Username/Real Name funcionan correctamente
✅ Toggle "Show in Leaderboard" funciona
✅ Mobile responsive
✅ Al menos 2 usuarios en leaderboard para validar

→ Tienes un leaderboard funcional que puedes mostrar públicamente

→ LISTO PARA FASE 3

FASE 3: Profile Pages
Duración: 2 días
Objetivo: Profile pages públicos + dashboard mejorado
🎯 Features de esta fase
□ Profile page público (/profile/[username])
□ Mostrar métricas del usuario
□ Botón "Follow My Portfolio" (placeholder por ahora)
□ Dashboard con link a tu profile público
□ Editar bio, strategy, social links
📦 Tareas
1. Profile Page Route
typescript// src/app/profile/[username]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient()

  // Find user by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) {
    notFound()
  }

  // Get portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', profile.id)
    .eq('show_in_leaderboard', true)
    .single()

  if (!portfolio) {
    notFound()
  }

  // Get rank
  const { data: allPortfolios } = await supabase
    .from('portfolios')
    .select('id, xirr_percent')
    .eq('show_in_leaderboard', true)
    .not('xirr_percent', 'is', null)
    .order('xirr_percent', { ascending: false })

  const rank = allPortfolios?.findIndex(p => p.id === portfolio.id) + 1 || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-xl font-bold">TrustReturns</h1>
              </Link>
              <Link href="/leaderboard" className="text-sm text-slate-600 hover:text-slate-900">
                Leaderboard
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            🏆 #{rank} Ranked Investor
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            {profile.username ? `@${profile.username}` : profile.display_name || 'Anonymous'}
          </h1>
          <div className="flex items-center gap-4 text-slate-600">
            <span>✓ Verified with {portfolio.institution_name}</span>
            <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Metrics */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">XIRR</p>
                <p className="text-3xl font-bold">{portfolio.xirr_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {portfolio.xirr_period_months} months
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Total Return</p>
                <p className="text-3xl font-bold">{portfolio.total_return_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">Since start</p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">YTD</p>
                <p className="text-3xl font-bold">{portfolio.ytd_return_percent?.toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">This year</p>
              </div>

              {portfolio.show_account_value && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold">
                    ${(portfolio.current_value! / 1000).toFixed(0)}k
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {(profile.bio || profile.strategy) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.strategy && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Strategy</p>
                  <p className="font-medium">{profile.strategy}</p>
                </div>
              )}
              {profile.bio && (
                <div>
                  <p className="text-slate-700">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {(profile.twitter_handle || profile.telegram_handle) && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {profile.twitter_handle && (
                  
                    href={`https://twitter.com/${profile.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🐦 @{profile.twitter_handle}
                  </a>
                )}
                {profile.telegram_handle && (
                  
                    href={`https://t.me/${profile.telegram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📱 @{profile.telegram_handle}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA - Placeholder for Phase 4 */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                💎 Follow My Portfolio
              </h3>
              <p className="text-slate-600 mb-1">
                $249/year ($0.68/day)
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Get access to holdings, thesis, monthly deep dives, and more
              </p>
              <Button size="lg" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
2. Profile Editor en Dashboard
typescript// src/components/profile-editor.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProfileEditor({ profile }: any) {
  const [bio, setBio] = useState(profile?.bio || '')
  const [strategy, setStrategy] = useState(profile?.strategy || '')
  const [twitterHandle, setTwitterHandle] = useState(profile?.twitter_handle || '')
  const [telegramHandle, setTelegramHandle] = useState(profile?.telegram_handle || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setLoading(true)

    await supabase
      .from('profiles')
      .update({
        bio,
        strategy,
        twitter_handle: twitterHandle,
        telegram_handle: telegramHandle,
      })
      .eq('id', profile.id)

    setLoading(false)
    router.refresh()
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
3. Agregar Textarea de shadcn
bashnpx shadcn@latest add textarea
4. Update Dashboard para incluir ProfileEditor
typescript// src/app/dashboard/page.tsx
// Agregar import:
import ProfileEditor from '@/components/profile-editor'

// En el JSX, después de PrivacySettings:
<ProfileEditor profile={profile} />
✅ Checklist de Testing - Fase 3
bash# 1. Setup username
□ Ve a /dashboard
□ En Privacy Settings, selecciona "Username"
□ Pon un username único (ej: "agus_investor")
□ Save

# 2. Test Profile Page
□ Ve a /profile/agus_investor (tu username)
□ Verifica que se ve:
  - Rank badge
  - Username
  - Métricas (XIRR, Total Return, YTD)
  - "Follow My Portfolio" card (disabled por ahora)

# 3. Llenar Profile
□ Ve a /dashboard
□ En "Public Profile" card:
  - Strategy: "Deep Value + Special Situations"
  - Bio: "I look for quality compounders..."
  - Twitter: agus_value (sin @)
  - Telegram: agus_tg
□ Save

# 4. Verificar cambios en profile
□ Ve a /profile/agus_investor
□ Verifica que se muestra:
  - Strategy
  - Bio
  - Twitter link
  - Telegram link

# 5. Test sin bio/social
□ Crea otra cuenta de prueba
□ No llenes bio ni social
□ Ve a su profile
□ Verifica que solo se ven métricas (sin cards vacías)

# 6. Test 404
□ Ve a /profile/usuario_inexistente
□ Debería mostrar 404

# 7. Git commit
git add .
git commit -m "Phase 3: Public profile pages"
git push
```

## 🎉 Definición de "Fase 3 Completa"
```
✅ Profile pages públicos funcionan
✅ Profile editor en dashboard funciona
✅ Bio, strategy, social links se guardan
✅ Links de Twitter/Telegram funcionan
✅ 404 para profiles inexistentes

→ Cada usuario tiene su profile público compartible

→ LISTO PARA FASE 4 (Monetización)
```

---

# FASE 4: Monetization (Tu Portfolio)
**Duración:** 3-4 días  
**Objetivo:** Stripe integration + subscriptions a TU portfolio

## 🎯 Features de esta fase
```
□ Stripe Checkout para annual subscription ($249/año)
□ Webhook handler para Stripe events
□ Database table para subscriptions
□ Holdings table (para mostrar a subscribers)
□ Protected route /portfolio/[username] (solo subscribers)
□ Mostrar holdings + cost basis + notes
📦 Tareas
1. Actualizar Database Schema
sql-- En Supabase SQL Editor:

-- Holdings table
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

create index idx_holdings_portfolio on holdings(portfolio_id);

-- RLS
alter table public.holdings enable row level security;

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

-- Subscriptions table
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  
  subscriber_user_id uuid references auth.users not null,
  creator_user_id uuid references auth.users not null,
  
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null, -- active, canceled, past_due
  current_period_end timestamp,
  
  price_cents integer not null,
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_subscriptions_subscriber on subscriptions(subscriber_user_id);
create index idx_subscriptions_creator on subscriptions(creator_user_id);
create index idx_subscriptions_stripe on subscriptions(stripe_subscription_id);

-- RLS
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on subscriptions for select
  using (auth.uid() = subscriber_user_id);

create policy "Creators can view their subscriber list"
  on subscriptions for select
  using (auth.uid() = creator_user_id);
2. Stripe Product Setup
bash# En Stripe Dashboard (Test mode):

1. Products → Create Product:
   Name: "Follow Portfolio - Annual"
   Price: $249.00
   Billing period: Yearly
   
   Copiar Price ID: price_xxxxxxxxxxxxx

2. Webhooks → Add endpoint:
   URL: https://your-domain.vercel.app/api/webhooks/stripe
   Events to send:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   
   Copiar Webhook Secret: whsec_xxxxxxxxxxxxx

3. Agregar a .env.local:
   STRIPE_PRICE_ID_ANNUAL=price_xxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
3. Stripe Checkout API Route
typescript// src/app/api/stripe/create-checkout/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: Request) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { creator_username } = await req.json()

    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', creator_username)
      .single()

    if (!creatorProfile) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Check if already subscribed
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_user_id', user.id)
      .eq('creator_user_id', creatorProfile.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_ANNUAL!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portfolio/${creator_username}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${creator_username}`,
      metadata: {
        subscriber_user_id: user.id,
        creator_user_id: creatorProfile.id,
        creator_username: creator_username,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
4. Stripe Webhook Handler
typescript// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Use service role key for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        const { subscriber_user_id, creator_user_id } = session.metadata!

        // Get subscription
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Create subscription record
        await supabase.from('subscriptions').insert({
          subscriber_user_id,
          creator_user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          price_cents: 24900, // $249
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
5. Protected Portfolio Page
typescript// src/app/portfolio/[username]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function PortfolioPage({ params }: { params: { username: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/portfolio/${params.username}`)
  }

  // Get creator profile
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', params.username)
    .single()

  if (!creatorProfile) {
    notFound()
  }

  // Check if user has active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('subscriber_user_id', user.id)
    .eq('creator_user_id', creatorProfile.id)
    .eq('status', 'active')
    .single()

  // If not subscribed and not the owner, redirect to profile
  const isOwner = user.id === creatorProfile.id
  
  if (!subscription && !isOwner) {
    redirect(`/profile/${params.username}`)
  }

  // Get portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', creatorProfile.id)
    .single()

  // Get holdings
  const { data: holdings } = await supabase
    .from('holdings')
    .select('*')
    .eq('portfolio_id', portfolio!.id)
    .order('percent_of_portfolio', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/">
                <h1 className="text-xl font-bold">TrustReturns</h1>
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            💎 Premium Access
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            {creatorProfile.username ? `@${creatorProfile.username}` : creatorProfile.display_name}'s Portfolio
          </h1>
          <p className="text-slate-600">
            {isOwner ? 'Your subscribers see this view' : 'You have full access to this portfolio'}
          </p>
        </div>

        {/* Performance Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">XIRR</p>
                <p className="text-3xl font-bold">{portfolio?.xirr_percent?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Return</p>
                <p className="text-3xl font-bold">{portfolio?.total_return_percent?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">YTD</p>
                <p className="text-3xl font-bold">{portfolio?.ytd_return_percent?.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holdings */}
        <Card>
          <CardHeader>
            <CardTitle>Current Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Security</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">% of Portfolio</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings?.map((holding) => {
                  const gainLoss = holding.current_value - holding.cost_basis
                  const gainLossPercent = ((holding.current_value / holding.cost_basis - 1) * 100)
                  const isPositive = gainLoss >= 0

                  return (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{holding.ticker}</div>
                          <div className="text-sm text-slate-500">{holding.security_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{holding.quantity?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.cost_basis?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${holding.current_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${holding.current_value?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{holding.percent_of_portfolio?.toFixed(1)}%</TableCell>
                      <TableCell className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{gainLossPercent.toFixed(1)}%
                        <div className="text-xs">
                          {isPositive ? '+' : ''}${gainLoss.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {holdings?.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No holdings data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes section (placeholder for Phase 5) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Investment Thesis & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Detailed thesis, watchlist, and monthly updates coming in next phase.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
6. Update Profile Page con Checkout Button
typescript// src/components/subscribe-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function SubscribeButton({ creatorUsername }: { creatorUsername: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)

    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_username: creatorUsername }),
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
      alert('Failed to create checkout session')
    }
  }

  return (
    <Button size="lg" onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Loading...' : 'Subscribe Now - $249/year'}
    </Button>
  )
}
typescript// Update src/app/profile/[username]/page.tsx
// Replace "Coming Soon" button with:

import SubscribeButton from '@/components/subscribe-button'

// En el CTA card:
<SubscribeButton creatorUsername={params.username} />
7. Update Calculate Returns para guardar Holdings
typescript// src/app/api/plaid/calculate-returns/route.ts
// Después de calcular metrics, agregar:

// Always save holdings (for all users who might monetize later)
// Delete old holdings
await supabase
  .from('holdings')
  .delete()
  .eq('portfolio_id', portfolio_id)

// Insert new holdings
const holdingsData = holdings.map(h => ({
  portfolio_id: portfolio_id,
  ticker: h.security?.ticker_symbol || h.security?.isin || 'N/A',
  security_name: h.security?.name || 'Unknown',
  quantity: h.quantity,
  cost_basis: h.cost_basis,
  current_price: h.institution_price,
  current_value: h.quantity * h.institution_price,
  percent_of_portfolio: (h.quantity * h.institution_price / currentValue) * 100,
}))

if (holdingsData.length > 0) {
  await supabase.from('holdings').insert(holdingsData)
}
✅ Checklist de Testing - Fase 4
bash# 1. Setup Stripe
□ Crear Product en Stripe Dashboard (Test mode)
□ Copiar Price ID y Webhook Secret a .env.local
□ Configurar webhook endpoint

# 2. Test Subscription Flow (como subscriber)
□ Logout
□ Crear nueva cuenta de prueba
□ Ve a /profile/agus_investor (tu username)
□ Click "Subscribe Now"
□ Stripe Checkout debería abrir
□ Usa tarjeta de prueba: 4242 4242 4242 4242
□ Completa checkout
□ Deberías redirigir a /portfolio/agus_investor
□ Deberías ver holdings table con datos

# 3. Verificar en Stripe Dashboard
□ Ve a Stripe → Customers
□ Deberías ver nuevo customer
□ Ve a Subscriptions
□ Debería estar "Active"

# 4. Verificar en Supabase
□ Ve a subscriptions table
□ Deberías ver record con status='active'
□ Verifica stripe_subscription_id, current_period_end

# 5. Test webhook (local)
# Instala Stripe CLI:
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# En otra terminal:
stripe trigger customer.subscription.updated

□ Verifica logs en terminal
□ Debería procesar sin errores

# 6. Test Protected Route
□ Logout de cuenta subscriber
□ Intenta acceder /portfolio/agus_investor
□ Debería redirigir a /login

# 7. Test como Owner
□ Login con TU cuenta (agus_investor)
□ Ve a /portfolio/agus_investor
□ Deberías ver tus holdings (aunque no estés subscrito a ti mismo)

# 8. Test Holdings Data
□ Conecta un broker con holdings reales
□ Trigger calculate-returns
□ Ve a /portfolio/[username]
□ Holdings deberían mostrar:
  - Ticker symbols correctos
  - Prices actualizados
  - Cost basis
  - Gain/Loss %

# 9. Deploy to Vercel (para test webhook real)
vercel --prod
□ Configura env variables en Vercel
□ Actualiza Stripe webhook URL a tu dominio
□ Test checkout en producción

# 10. Git commit
git add .
git commit -m "Phase 4: Stripe integration + subscriptions"
git push
```

## 🎉 Definición de "Fase 4 Completa"
```
✅ Stripe Product creado
✅ Checkout flow funciona
✅ Webhook procesa events correctamente
✅ Subscriptions se guardan en DB
✅ Protected portfolio page funciona
✅ Holdings se muestran a subscribers
✅ Owner puede ver su portfolio sin pagar
✅ Non-subscribers no pueden acceder

→ Puedes monetizar tu portfolio ($249/año)
→ Subscribers ven tus holdings reales

→ LISTO PARA FASE 5 (Creator Tier)

FASE 5: Creator Tier (Otros usuarios monetizan)
Duración: 2-3 días
Objetivo: Permitir que otros usuarios activen monetización con pricing customizable
🎯 Features de esta fase
□ Creator tier subscription ($29/mes) con Stripe
□ Dashboard para creators (earnings, subscribers)
□ Toggle "Monetize Portfolio" en dashboard
□ Custom pricing por creator
□ Stripe Connect para splits (70/30)
□ Profile pages muestran precio del creator
□ Sistema de splits automático
📦 Tareas
1. Actualizar Database Schema
sql-- En Supabase SQL Editor:

-- Agregar campos a portfolios table
alter table public.portfolios
add column is_monetized boolean default false,
add column subscription_price_monthly integer default 2900; -- $29 en centavos

-- Creator subscriptions table (para el tier de $29/mes)
create table public.creator_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null unique,
  
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null, -- active, canceled, past_due
  current_period_end timestamp,
  
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_creator_subs_user on creator_subscriptions(user_id);

-- RLS
alter table public.creator_subscriptions enable row level security;

create policy "Users can view own creator subscription"
  on creator_subscriptions for select
  using (auth.uid() = user_id);

-- Earnings tracking table
create table public.creator_earnings (
  id uuid default uuid_generate_v4() primary key,
  creator_user_id uuid references auth.users not null,
  
  month date not null, -- first day of month
  gross_revenue_cents integer default 0,
  platform_fee_cents integer default 0, -- 30%
  stripe_fee_cents integer default 0,
  net_payout_cents integer default 0,
  
  subscriber_count integer default 0,
  
  created_at timestamp default now(),
  
  unique(creator_user_id, month)
);

create index idx_creator_earnings_user on creator_earnings(creator_user_id);
create index idx_creator_earnings_month on creator_earnings(month);

-- RLS
alter table public.creator_earnings enable row level security;

create policy "Creators can view own earnings"
  on creator_earnings for select
  using (auth.uid() = creator_user_id);
2. Stripe Products para Creator Tier
bash# En Stripe Dashboard (Test mode):

1. Crear nuevo Product:
   Name: "Creator Tier"
   Price: $29.00
   Billing period: Monthly
   
   Copiar Price ID: price_creator_xxxxxxxxxxxxx

2. Agregar a .env.local:
   STRIPE_PRICE_ID_CREATOR=price_creator_xxxxxxxxxxxxx
3. Creator Tier Checkout
typescript// src/app/api/stripe/create-creator-checkout/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(req: Request) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if already has creator subscription
    const { data: existingSub } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json({ error: 'Already a creator' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_CREATOR!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?creator=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        user_id: user.id,
        subscription_type: 'creator',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating creator checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
4. Update Webhook para Creator Tier
typescript// src/app/api/webhooks/stripe/route.ts
// Agregar este case en el switch statement:

case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  
  if (session.metadata?.subscription_type === 'creator') {
    // Creator tier subscription
    const { user_id } = session.metadata!
    
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    await supabase.from('creator_subscriptions').insert({
      user_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } else {
    // Portfolio subscription (existing code)
    const { subscriber_user_id, creator_user_id } = session.metadata!
    // ... existing code
  }
  
  break
}

// También agregar handling para creator subscription updates/deletions:
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription

  // Check if it's a creator subscription
  const { data: creatorSub } = await supabase
    .from('creator_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (creatorSub) {
    await supabase
      .from('creator_subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
  } else {
    // Portfolio subscription (existing code)
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)
  }

  break
}
5. Monetization Settings Component
typescript// src/components/monetization-settings.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MonetizationSettings({ 
  portfolio, 
  creatorSubscription 
}: { 
  portfolio: any
  creatorSubscription: any 
}) {
  const [isMonetized, setIsMonetized] = useState(portfolio.is_monetized)
  const [price, setPrice] = useState((portfolio.subscription_price_monthly / 100).toFixed(0))
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const hasActiveCreatorSub = creatorSubscription?.status === 'active'

  async function handleUpgradeToCreator() {
    setUpgrading(true)

    const response = await fetch('/api/stripe/create-creator-checkout', {
      method: 'POST',
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setUpgrading(false)
      alert('Failed to create checkout session')
    }
  }

  async function handleSave() {
    setLoading(true)

    const priceCents = parseInt(price) * 100

    await supabase
      .from('portfolios')
      .update({
        is_monetized: isMonetized,
        subscription_price_monthly: priceCents,
      })
      .eq('id', portfolio.id)

    setLoading(false)
    router.refresh()
  }

  if (!hasActiveCreatorSub) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>💰 Monetize Your Portfolio</CardTitle>
          <CardDescription>
            Upgrade to Creator tier to earn from your followers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 space-y-2">
            <p className="font-semibold">Creator Tier - $29/month</p>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Enable "Follow My Portfolio" subscriptions</li>
              <li>✓ Set your own pricing ($19-99/month)</li>
              <li>✓ Keep 70% of revenue</li>
              <li>✓ Earnings dashboard & analytics</li>
              <li>✓ Multi-account support</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">Potential Earnings</p>
            <p className="text-xs text-slate-600 mb-3">
              If you get 30 followers at $19/month:
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Gross revenue:</span>
                <span className="font-medium">$570/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Your earnings (70%):</span>
                <span className="font-medium">$399/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Creator fee:</span>
                <span className="text-red-600">-$29/month</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Net profit:</span>
                <span className="font-bold text-green-600">$370/month 🎉</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleUpgradeToCreator} 
            disabled={upgrading}
            className="w-full"
            size="lg"
          >
            {upgrading ? 'Loading...' : 'Upgrade to Creator - $29/month'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monetization Settings</CardTitle>
            <CardDescription>
              Control how you monetize your portfolio
            </CardDescription>
          </div>
          <Badge variant="secondary">Creator Tier Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Monetization */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Monetization</Label>
            <p className="text-sm text-slate-500">
              Allow others to subscribe to your portfolio
            </p>
          </div>
          <Switch
            checked={isMonetized}
            onCheckedChange={setIsMonetized}
          />
        </div>

        {/* Pricing */}
        {isMonetized && (
          <div className="space-y-2">
            <Label htmlFor="price">Monthly Subscription Price (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">$</span>
              <Input
                id="price"
                type="number"
                min="19"
                max="99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-2xl font-bold w-32"
              />
              <span className="text-slate-600">/month</span>
            </div>
            <p className="text-xs text-slate-500">
              Recommended: $19-49/month. You keep 70% (${(parseInt(price) * 0.7).toFixed(0)}/month per subscriber)
            </p>
          </div>
        )}

        {/* Preview */}
        {isMonetized && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">Preview</p>
            <p className="text-xs text-slate-600 mb-3">
              This is how your offer will appear on your profile:
            </p>
            <div className="bg-white rounded-lg border-2 border-blue-200 p-4 text-center">
              <p className="font-bold text-lg mb-1">💎 Follow My Portfolio</p>
              <p className="text-2xl font-bold mb-1">${price}/month</p>
              <p className="text-xs text-slate-500">
                Get access to holdings, thesis, and updates
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  )
}
6. Creator Earnings Dashboard
typescript// src/components/creator-earnings-dashboard.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CreatorEarningsDashboard({ 
  subscriberCount,
  monthlyRevenue 
}: { 
  subscriberCount: number
  monthlyRevenue: number 
}) {
  const platformFee = monthlyRevenue * 0.3
  const stripeFee = monthlyRevenue * 0.03
  const netEarnings = monthlyRevenue * 0.67 // 70% - 3% Stripe
  const creatorTierCost = 29

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Active Subscribers</p>
              <p className="text-3xl font-bold">{subscriberCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                ${monthlyRevenue.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross revenue:</span>
              <span className="font-medium">${monthlyRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Platform fee (30%):</span>
              <span className="text-red-600">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Stripe fee (~3%):</span>
              <span className="text-red-600">-${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Creator tier:</span>
              <span className="text-red-600">-${creatorTierCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Net payout:</span>
              <span className="text-green-600">
                ${(netEarnings - creatorTierCost).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Growth tip */}
          {subscriberCount < 10 && (
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-1">💡 Growth Tip</p>
              <p className="text-slate-600">
                Share your profile link on Twitter and investing communities to get your first subscribers!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
7. Update Dashboard con Creator Features
typescript// src/app/dashboard/page.tsx
import MonetizationSettings from '@/components/monetization-settings'
import CreatorEarningsDashboard from '@/components/creator-earnings-dashboard'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get creator subscription
  const { data: creatorSubscription } = await supabase
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get subscriber count
  const { data: subscribers } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('creator_user_id', user.id)
    .eq('status', 'active')

  const subscriberCount = subscribers?.length || 0
  const monthlyRevenue = subscriberCount * (portfolio?.subscription_price_monthly / 100 || 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav ... */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Manage your verified portfolio</p>
        </div>

        {!portfolio ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Connect Your Broker</h3>
            <p className="text-slate-600 mb-6">
              Connect your brokerage account to calculate your verified returns
            </p>
            <ConnectBrokerButton />
          </div>
        ) : (
          <div className="space-y-6">
            <PortfolioMetrics portfolio={portfolio} />
            
            {/* Creator Earnings (if active) */}
            {creatorSubscription?.status === 'active' && portfolio.is_monetized && (
              <CreatorEarningsDashboard 
                subscriberCount={subscriberCount}
                monthlyRevenue={monthlyRevenue}
              />
            )}
            
            {/* Monetization Settings */}
            <MonetizationSettings 
              portfolio={portfolio}
              creatorSubscription={creatorSubscription}
            />
            
            <PrivacySettings portfolio={portfolio} profile={profile} />
            <ProfileEditor profile={profile} />
          </div>
        )}
      </main>
    </div>
  )
}
8. Update Profile Page para Creators
typescript// src/app/profile/[username]/page.tsx
// Update el CTA section para mostrar precio del creator:

{/* CTA */}
{portfolio.is_monetized ? (
  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
    <CardContent className="pt-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">
          💎 Follow My Portfolio
        </h3>
        <p className="text-3xl font-bold mb-1">
          ${(portfolio.subscription_price_monthly / 100).toFixed(0)}/month
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Get access to holdings, thesis, monthly deep dives, and more
        </p>
        
        {/* Check if current user is logged in */}
        <SubscribeButton 
          creatorUsername={params.username}
          priceMonthly={portfolio.subscription_price_monthly / 100}
        />
        
        <p className="text-xs text-slate-500 mt-4">
          {subscriberCount} investors currently following
        </p>
      </div>
    </CardContent>
  </Card>
) : (
  <Card className="bg-slate-50 border">
    <CardContent className="pt-6 text-center">
      <p className="text-slate-600">
        This investor hasn't enabled portfolio subscriptions yet
      </p>
    </CardContent>
  </Card>
)}
9. Update Subscribe Button para diferentes precios
typescript// src/components/subscribe-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SubscribeButton({ 
  creatorUsername,
  priceMonthly 
}: { 
  creatorUsername: string
  priceMonthly: number
}) {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)

    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_username: creatorUsername }),
    })

    const data = await response.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
      alert(data.error || 'Failed to create checkout session')
    }
  }

  return (
    <Button size="lg" onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Loading...' : `Subscribe Now - $${priceMonthly}/month`}
    </Button>
  )
}
10. Update Stripe Checkout para precios dinámicos
typescript// src/app/api/stripe/create-checkout/route.ts
// Replace fixed price with dynamic price:

// Get creator's portfolio to get custom price
const { data: creatorPortfolio } = await supabase
  .from('portfolios')
  .select('subscription_price_monthly')
  .eq('user_id', creatorProfile.id)
  .single()

if (!creatorPortfolio?.subscription_price_monthly) {
  return NextResponse.json({ error: 'Creator has not set a price' }, { status: 400 })
}

// Create or retrieve price in Stripe
const price = await stripe.prices.create({
  unit_amount: creatorPortfolio.subscription_price_monthly,
  currency: 'usd',
  recurring: { interval: 'month' },
  product_data: {
    name: `Follow @${creator_username}'s Portfolio`,
  },
})

// Create checkout session with dynamic price
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [
    {
      price: price.id,
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portfolio/${creator_username}?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${creator_username}`,
  metadata: {
    subscriber_user_id: user.id,
    creator_user_id: creatorProfile.id,
    creator_username: creator_username,
  },
})
✅ Checklist de Testing - Fase 5
bash# 1. Setup Creator Tier Product en Stripe
□ Crear producto "Creator Tier" - $29/month
□ Copiar Price ID a .env.local

# 2. Test Creator Tier Upgrade (con tu cuenta principal)
□ Login como agus_investor
□ Ve a Dashboard
□ Deberías ver "Monetize Your Portfolio" card
□ Click "Upgrade to Creator"
□ Stripe Checkout abre
□ Usa tarjeta de prueba: 4242 4242 4242 4242
□ Completa checkout
□ Redirige a dashboard?creator=success

# 3. Verificar Creator Status
□ Dashboard ahora debería mostrar:
  - Badge "Creator Tier Active"
  - "Monetization Settings" card
  - "Creator Earnings Dashboard" (con 0 subscribers)

# 4. Activar Monetización
□ En Monetization Settings:
  - Toggle "Enable Monetization" ON
  - Set price: $29/month
  - Click Save

# 5. Verificar Profile Público
□ Ve a /profile/agus_investor
□ Debería mostrar:
  - "Follow My Portfolio - $29/month"
  - Botón "Subscribe Now"
  - "0 investors currently following"

# 6. Test Subscription a Creator (con otra cuenta)
□ Logout
□ Crea nueva cuenta de prueba (test_subscriber)
□ Ve a /profile/agus_investor
□ Click "Subscribe Now - $29/month"
□ Completa checkout con tarjeta de prueba
□ Redirige a /portfolio/agus_investor
□ Deberías ver holdings

# 7. Verificar Earnings Dashboard (como creator)
□ Login de nuevo como agus_investor
□ Ve a Dashboard
□ Creator Earnings Dashboard debería mostrar:
  - Active Subscribers: 1
  - Monthly Revenue: $29
  - Net payout: ~$17 (después de fees)

# 8. Test Múltiples Precios
□ Crea otra cuenta de prueba (creator2)
□ Upgrade a Creator Tier
□ Set precio: $49/month
□ Ve a profile de creator2
□ Debería mostrar $49/month

# 9. Test Cancelación de Creator Tier
# En Stripe Dashboard:
□ Ve a Subscriptions → Find agus_investor's creator sub
□ Cancel subscription
□ Espera ~1 min para webhook
□ Refresh dashboard de agus_investor
□ "Enable Monetization" debería volver a OFF
□ Debería mostrar upgrade CTA de nuevo

# 10. Verify en Stripe Dashboard
□ Ve a Products → Deberías ver múltiples prices creados
□ Ve a Subscriptions → Deberías ver creator tier + portfolio subs
□ Ve a Customers → Múltiples customers

# 11. Git commit
git add .
git commit -m "Phase 5: Creator tier + dynamic pricing"
git push
```

## 🎉 Definición de "Fase 5 Completa"
```
✅ Creator tier ($29/mes) funciona
✅ Creators pueden activar monetización
✅ Creators pueden set custom pricing
✅ Earnings dashboard muestra stats
✅ Profile pages muestran precio del creator
✅ Subscription flow funciona con precios dinámicos
✅ Multiple creators pueden monetizar simultáneamente
✅ Splits (70/30) se calculan correctamente

→ Otros usuarios pueden monetizar sus portfolios
→ Tienes un marketplace funcional de portfolios

→ LISTO PARA FASE 6 (Polish & Launch)
```

---

# FASE 6: Polish & Production Launch
**Duración:** 2-3 días  
**Objetivo:** Production-ready, mobile responsive, deploy, launch público

## 🎯 Features de esta fase
```
□ Error handling mejorado
□ Loading states everywhere
□ Mobile responsive (todas las páginas)
□ SEO meta tags
□ Favicon + OG images
□ Email notifications (opcional)
□ Rate limiting (opcional)
□ Deploy a production con dominio real
□ Switch Plaid a Production mode
□ Launch checklist
📦 Tareas
1. Error Handling & Loading States
typescript// src/components/error-boundary.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            We encountered an error while loading this page. Please try again.
          </p>
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
typescript// src/app/error.tsx
export { default } from '@/components/error-boundary'
typescript// src/app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600">Loading...</p>
      </div>
    </div>
  )
}
2. SEO & Meta Tags
typescript// src/app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TrustReturns - Verify Your Investment Returns',
  description: 'Connect your broker, prove your track record. Join value investors with verified returns.',
  keywords: 'investment returns, verified performance, value investing, portfolio tracking',
  authors: [{ name: 'TrustReturns' }],
  openGraph: {
    title: 'TrustReturns - Verify Your Investment Returns',
    description: 'Connect your broker, prove your track record',
    url: 'https://trustreturns.app',
    siteName: 'TrustReturns',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustReturns - Verify Your Investment Returns',
    description: 'Connect your broker, prove your track record',
    images: ['/og-image.png'],
  },
}
typescript// src/app/profile/[username]/page.tsx
// Add dynamic metadata:

import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, portfolios(*)')
    .eq('username', params.username)
    .single()

  if (!profile) {
    return {
      title: 'User Not Found | TrustReturns',
    }
  }

  const xirr = profile.portfolios?.[0]?.xirr_percent?.toFixed(1) || '0'

  return {
    title: `@${params.username} - ${xirr}% XIRR | TrustReturns`,
    description: `${profile.display_name || params.username} achieved ${xirr}% annualized return. Verified with ${profile.portfolios?.[0]?.institution_name}.`,
    openGraph: {
      title: `@${params.username} - ${xirr}% XIRR`,
      description: `Verified investment performance on TrustReturns`,
    },
  }
}
3. Favicon & OG Image
bash# public/favicon.ico
# Crear o descargar un favicon

# public/og-image.png
# Crear imagen 1200x630 con:
# - Logo de TrustReturns
# - Tagline: "Verify Your Investment Returns"
# - Verified badge icon

# Herramientas para crear OG image:
# - Canva
# - Figma
# - https://www.opengraph.xyz/
4. Mobile Responsive Fixes
typescript// src/app/leaderboard/page.tsx
// Wrap table en div scrollable:

<div className="overflow-x-auto">
  <Table>
    {/* ... */}
  </Table>
</div>

// En mobile, hacer columnas más compactas:
<TableCell className="hidden md:table-cell">
  {/* Show only on desktop */}
</TableCell>
typescript// src/components/leaderboard-table.tsx
// Mobile-first design:

<div className="md:hidden">
  {/* Mobile card view */}
  {filteredPortfolios.map((p, i) => (
    <Card key={p.id} className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Badge variant="secondary">#{i + 1}</Badge>
            <p className="font-semibold mt-1">{getDisplayName(p)}</p>
          </div>
          <p className="text-2xl font-bold">{p.xirr_percent?.toFixed(1)}%</p>
        </div>
        <div className="text-sm text-slate-600">
          <p>Total: {p.total_return_percent?.toFixed(1)}% | YTD: {p.ytd_return_percent?.toFixed(1)}%</p>
          <p>{p.xirr_period_months} months | ✓ {p.institution_name}</p>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

<div className="hidden md:block">
  {/* Desktop table view */}
  <Table>
    {/* ... existing table */}
  </Table>
</div>
5. Rate Limiting (Opcional pero recomendado)
typescript// src/lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const ip = request.ip || 'unknown'
  const now = Date.now()
  
  const record = rateLimit.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimit.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { success: true, remaining: limit - 1 }
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }
  
  record.count++
  return { success: true, remaining: limit - record.count }
}
typescript// Use in API routes:
// src/app/api/plaid/create-link-token/route.ts

import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { success, remaining } = checkRateLimit(request, 5, 60000) // 5 requests per minute
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // ... rest of the code
}
6. Email Notifications (Opcional con Resend)
bashnpm install resend
typescript// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: 'TrustReturns <noreply@trustreturns.app>',
    to,
    subject: 'Welcome to TrustReturns!',
    html: `
      <h1>Welcome to TrustReturns, ${name}!</h1>
      <p>Thanks for joining the community of verified investors.</p>
      <p>Next steps:</p>
      <ol>
        <li>Connect your broker to verify your returns</li>
        <li>Configure your privacy settings</li>
        <li>Share your profile with the community</li>
      </ol>
      <a href="https://trustreturns.app/dashboard">Go to Dashboard</a>
    `,
  })
}

export async function sendNewSubscriberEmail(
  creatorEmail: string,
  creatorName: string,
  subscriberName: string
) {
  await resend.emails.send({
    from: 'TrustReturns <noreply@trustreturns.app>',
    to: creatorEmail,
    subject: 'New Subscriber! 🎉',
    html: `
      <h1>You have a new subscriber!</h1>
      <p>Hi ${creatorName},</p>
      <p>${subscriberName} just subscribed to your portfolio.</p>
      <p>Check your earnings dashboard for details.</p>
      <a href="https://trustreturns.app/dashboard">View Dashboard</a>
    `,
  })
}
7. Production Deployment Checklist
bash# 1. Environment Variables en Vercel
□ Agregar todas las env variables:
  - PLAID_CLIENT_ID
  - PLAID_SECRET (production)
  - NEXT_PUBLIC_PLAID_ENV=production
  - STRIPE_SECRET_KEY (live key)
  - STRIPE_WEBHOOK_SECRET (live webhook)
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - NEXT_PUBLIC_APP_URL=https://trustreturns.app

# 2. Configurar dominio en Vercel
□ Agregar custom domain: trustreturns.app
□ Configurar DNS (Namecheap):
  Type: CNAME
  Host: @
  Value: cname.vercel-dns.com

# 3. Switch Plaid a Production
□ En Plaid Dashboard → API Keys
□ Obtener production client_id y secret
□ Actualizar env vars en Vercel
□ Re-deploy

# 4. Switch Stripe a Live Mode
□ En Stripe Dashboard → toggle "Test mode" OFF
□ Obtener live keys
□ Re-crear Products en live mode
□ Actualizar webhook URL a production
□ Actualizar env vars en Vercel

# 5. Supabase Production Settings
□ Enable RLS en todas las tables
□ Review policies
□ Setup backups (automatic en Supabase Pro)
□ Enable email confirmations si quieres

# 6. Deploy
vercel --prod

# 7. Smoke Tests
□ Visit https://trustreturns.app
□ Signup flow works
□ Plaid connection works (use real broker)
□ Verify XIRR calculates correctly
□ Leaderboard loads
□ Profile pages work
□ Stripe checkout works (use real card or test)

# 8. Monitor
□ Check Vercel logs
□ Check Supabase logs
□ Check Stripe webhooks (should be 200)
□ Setup Sentry error tracking (optional)
8. Launch Checklist
markdown## Pre-Launch

□ Test all flows end-to-end en production
□ Mobile responsive verified
□ SEO meta tags present
□ Favicon working
□ OG image displaying (test en https://www.opengraph.xyz/)
□ Email notifications working (if enabled)
□ Error handling graceful
□ Loading states present
□ Stripe webhooks responding 200

## Launch Day

□ Prepare announcement tweet:
  "🚀 Launching TrustReturns - verify your investment returns
   
   Connect your broker → Prove your track record
   No more self-reported numbers
   
   Join value investors with verified XIRR
   
   https://trustreturns.app"

□ Post en Reddit:
  - r/ValueInvesting
  - r/Bogleheads
  - r/investing
  
  Title: "I built TrustReturns to verify investment returns (like TrustMRR for investors)"
  
□ Outreach a micro-influencers:
  - Finance Twitter
  - Investing YouTubers
  - Newsletter writers

□ Product Hunt launch (optional):
  - Prepare assets
  - Get 5-10 friends to upvote
  - Respond to comments

## Post-Launch

□ Monitor Sentry for errors
□ Respond to user feedback
□ Collect testimonials
□ Iterate quickly on bugs
□ Track metrics:
  - Signups/day
  - Plaid connection rate
  - Leaderboard views
  - Conversion to paid

## Week 1 Goals

□ 50+ verified users
□ 5+ paying subscribers (to your portfolio)
□ 2-3 creators activated
□ <5 critical bugs
□ Feedback from 10+ users
9. Analytics (Opcional)
typescript// src/lib/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', event, properties)
  }
}

// Usage:
// trackEvent('portfolio_connected', { institution: 'Fidelity' })
// trackEvent('subscription_completed', { price: 249 })
typescript// src/app/layout.tsx
// Add Vercel Analytics (already included in Vercel Pro):

import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
10. Performance Optimizations
typescript// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [], // Add if using external images
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
bash# Analyze bundle size:
npm run build
npx @next/bundle-analyzer
✅ Checklist de Testing - Fase 6
bash# 1. Local Production Build
□ npm run build
□ Verifica que no hay errores
□ npm start
□ Test en http://localhost:3000
□ Verifica todas las páginas cargan

# 2. Mobile Testing
□ Chrome DevTools → Device Toolbar
□ Test en:
  - iPhone SE (small)
  - iPhone 12 Pro (medium)
  - iPad (tablet)
□ Verifica todas las páginas:
  - Landing responsive
  - Leaderboard scrollable
  - Forms usables
  - Buttons tappable

# 3. SEO Testing
□ View Page Source → verify meta tags present
□ https://www.opengraph.xyz/ → paste URL
□ Verifica OG image loads
□ Google Search Console → Submit sitemap (post-launch)

# 4. Error Testing
□ Fuerza un error (ej: invalid ID en URL)
□ Verify error boundary catches it
□ User sees friendly message

# 5. Deploy a Vercel
vercel --prod

# 6. Production Smoke Tests
□ Visit domain (trustreturns.app)
□ Signup flow completo
□ Connect broker (usa real broker en sandbox si es dev, o real si es prod)
□ Verify calculations
□ Leaderboard loads
□ Profile pages work
□ Stripe checkout (use test card en dev)

# 7. Switch a Plaid Production (cuando listo)
□ Update env vars
□ Re-deploy
□ Test con TU broker real
□ Verify works

# 8. Monitor First Day
□ Vercel logs (errors?)
□ Supabase logs (query performance?)
□ Stripe webhooks (200 responses?)

# 9. Git final commit
git add .
git commit -m "Phase 6: Production ready + launch"
git push

# 10. Launch! 🚀
□ Tweet
□ Reddit posts
□ Email friends
□ Share on LinkedIn
□ Track metrics
```

## 🎉 Definición de "Fase 6 Completa"
```
✅ Production deployed to trustreturns.app
✅ All features tested in production
✅ Mobile responsive
✅ SEO optimized
✅ Error handling graceful
✅ Monitoring in place
✅ Plaid in production mode (or ready to switch)
✅ Stripe in live mode (or ready to switch)
✅ Launch announcement ready

→ APP LIVE & FUNCTIONAL
→ Ready to acquire users
→ Ready to make money

🎊 CONGRATULATIONS! YOU SHIPPED! 🎊
```

---

# 📚 Apéndice

## 🔄 Maintenance & Iteration

### Post-Launch Weekly Tasks:
```
□ Review Vercel analytics
□ Check Stripe revenue
□ Monitor Supabase usage
□ Respond to user feedback
□ Fix reported bugs
□ Track key metrics
```

### Monthly Tasks:
```
□ Review Plaid costs vs revenue
□ Update portfolio calculations (if Plaid API changes)
□ Send newsletter to users (optional)
□ A/B test pricing
□ Add requested features
```

## 🆘 Troubleshooting

### Common Issues:

**Plaid connection fails:**
```
- Check if broker is supported
- Verify credentials are correct
- Check if 2FA is blocking
- See Plaid Dashboard → Items for error details
```

**XIRR calculation returns NaN:**
```
- Verify cashflows have at least 2 entries
- Check date formatting
- Ensure amounts are numbers, not strings
- Add console.log to debug cashflow array
```

**Stripe webhook not receiving:**
```
- Verify webhook URL is correct
- Check signature verification
- Test locally with Stripe CLI
- Check Vercel logs for errors
```

**Supabase RLS blocking queries:**
```
- Verify policies are correct
- Use service role key for webhooks/cron
- Check auth.uid() is set correctly
```

## 📞 Resources

**Documentation:**
- Plaid: https://plaid.com/docs/
- Stripe: https://stripe.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

**Community:**
- Plaid Slack: community.plaid.com
- Stripe Discord: stripe.com/discord
- Supabase Discord: discord.supabase.com

**Support:**
- Plaid Support: dashboard.plaid.com/support
- Stripe Support: support.stripe.com
- Supabase Support: supabase.com/support

---

# ✅ Plan Completo - Resumen Final

## Tiempos Estimados:
```
Fase 0: Setup                    → 1 día
Fase 1: Vertical Slice          → 3-4 días
Fase 2: Leaderboard             → 2-3 días
Fase 3: Profiles                → 2 días
Fase 4: Monetization (Tu)       → 3-4 días
Fase 5: Creator Tier            → 2-3 días
Fase 6: Polish & Launch         → 2-3 días

TOTAL: 14-20 días (2-3 semanas realistas)
```

## Revenue Projection (12 meses):
```
Mes 3:  $2,300/mes (validation)
Mes 6:  $4,500/mes (traction)
Mes 12: $6,500/mes (scale) ✅ Objetivo cumplido
```

## Next Steps:
```
1. Confirma que entiendes el plan completo
2. Crea tus cuentas (Plaid, Supabase, Stripe)
3. Empieza con Fase 0
4. Ve fase por fase, testing cada una
5. Deploy cuando llegues a Fase 6
6. LAUNCH! 🚀