import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Determine environment based on env variable
const plaidEnv = (process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox') as 'sandbox' | 'development' | 'production'

// Map environment to Plaid environment
const environment = PlaidEnvironments[plaidEnv]

// Create Plaid configuration
const configuration = new Configuration({
  basePath: environment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
    },
  },
})

// Export configured Plaid client
export const plaidClient = new PlaidApi(configuration)

// Helper to check if Plaid is configured
export function isPlaidConfigured(): boolean {
  return !!(
    process.env.PLAID_CLIENT_ID &&
    process.env.PLAID_SECRET &&
    process.env.PLAID_CLIENT_ID !== 'your_plaid_client_id_here'
  )
}
