import { useState, useEffect } from 'react'
import { checkSession, startAuth } from '../api/eb-client'
import type { SessionStatus, Account } from '../types'

interface UseSessionResult {
  status: SessionStatus | null
  isLoading: boolean
  isAuthenticating: boolean
  authMessage: string
  accounts: Account[]
  error: string | null
  startBankAuth: (bankName: string) => Promise<void>
}

export function useSession(): UseSessionResult {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const result = await checkSession()
        setStatus(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check session')
        setStatus({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to check session'
        })
      } finally {
        setIsLoading(false)
      }
    }

    check()
  }, [])

  async function startBankAuth(bankName: string) {
    setIsAuthenticating(true)
    setAuthMessage(`Starting authorization with ${bankName}... Browser opening for MitID`)

    try {
      const result = await startAuth(bankName)

      if (result.status === 'session_created') {
        setStatus({
          status: 'active',
          session_id: result.session_id,
          account_count: result.account_count,
          consent_expires: result.consent_expires,
          days_remaining: 90
        })
        if (result.accounts) {
          setAccounts(result.accounts)
        }
      } else if (result.error) {
        setError(result.error)
        setStatus({
          status: 'error',
          error: result.error
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setStatus({
        status: 'error',
        error: message
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  return {
    status,
    isLoading,
    isAuthenticating,
    authMessage,
    accounts,
    error,
    startBankAuth
  }
}
