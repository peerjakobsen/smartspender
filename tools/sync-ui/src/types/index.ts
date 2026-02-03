export interface Account {
  uid: string
  name: string | null
  product: string | null
  iban: string | null
  currency: string
  type: string | null
}

export interface SessionStatus {
  status: 'active' | 'expired' | 'no_session' | 'error' | 'unknown'
  session_id?: string
  account_count?: number
  consent_expires?: string
  days_remaining?: number
  fetch_log?: Record<string, number>
  message?: string
  error?: string
  expired_at?: string
}

export interface AccountsResponse {
  status: 'ok' | 'error'
  account_count?: number
  accounts?: Account[]
  error?: string
  hint?: string
}

export interface Transaction {
  booking_date: string
  status: string
  credit_debit_indicator: 'CRDT' | 'DBIT'
  transaction_amount: {
    amount: string
    currency: string
  }
  creditor?: { name: string }
  debtor?: { name: string }
  remittance_information?: string[]
  bank_transaction_code?: { description: string }
  balance_after_transaction?: {
    amount: string
    credit_debit_indicator: 'CRDT' | 'DBIT'
  }
}

export interface TransactionsResponse {
  status: 'ok' | 'error'
  account_uid?: string
  transaction_count?: number
  transactions?: Transaction[]
  fetches_today?: number
  warning?: string
  error?: string
  message?: string
  details?: string
}

export interface AuthResponse {
  status: 'waiting_for_consent' | 'session_created' | 'error'
  message?: string
  auth_url?: string
  session_id?: string
  account_count?: number
  accounts?: Account[]
  consent_expires?: string
  error?: string
}

export interface SyncResult {
  accountUid: string
  accountName: string
  status: 'pending' | 'syncing' | 'success' | 'error' | 'rate_limited'
  newCount?: number
  fetchedCount?: number
  duplicateCount?: number
  error?: string
  warning?: string
}

export type AppPhase = 'checking' | 'auth' | 'accounts' | 'syncing' | 'complete'
