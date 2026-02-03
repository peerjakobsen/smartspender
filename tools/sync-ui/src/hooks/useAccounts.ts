import { useState, useEffect } from 'react'
import { getAccounts } from '../api/eb-client'
import type { Account } from '../types'

interface UseAccountsResult {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAccounts(shouldFetch: boolean): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchAccounts() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getAccounts()

      if (result.status === 'ok' && result.accounts) {
        setAccounts(result.accounts)
      } else {
        setError(result.error || 'Failed to fetch accounts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (shouldFetch) {
      fetchAccounts()
    }
  }, [shouldFetch])

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts
  }
}
