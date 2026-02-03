import React, { useState, useEffect } from 'react'
import { Box, useApp } from 'ink'
import {
  Header,
  SessionStatus,
  BankInput,
  AccountList,
  SyncProgress,
  ResultsSummary
} from './components'
import { useSession, useAccounts, useSync } from './hooks'
import type { AppPhase, Account } from './types'

export function App(): React.ReactElement {
  const { exit } = useApp()
  const [phase, setPhase] = useState<AppPhase>('checking')
  const [allAccounts, setAllAccounts] = useState<Account[]>([])

  const {
    status: sessionStatus,
    isLoading: isSessionLoading,
    isAuthenticating,
    authMessage,
    accounts: authAccounts,
    startBankAuth
  } = useSession()

  const shouldFetchAccounts = phase === 'accounts' && sessionStatus?.status === 'active'
  const {
    accounts: fetchedAccounts,
    isLoading: isAccountsLoading
  } = useAccounts(shouldFetchAccounts)

  const {
    results: syncResults,
    isSyncing,
    isComplete: isSyncComplete,
    dateFrom,
    dateTo,
    outputPath,
    startSync
  } = useSync()

  // Phase transitions based on session status
  useEffect(() => {
    if (isSessionLoading) return

    if (!sessionStatus) return

    if (sessionStatus.status === 'active') {
      // If we have accounts from auth, use them
      if (authAccounts.length > 0) {
        setAllAccounts(authAccounts)
      }
      setPhase('accounts')
    } else if (sessionStatus.status === 'no_session' || sessionStatus.status === 'expired') {
      setPhase('auth')
    } else if (sessionStatus.status === 'error') {
      // Check if config error
      if (sessionStatus.error?.includes('Config not found')) {
        exit()
      }
    }
  }, [sessionStatus, isSessionLoading, authAccounts, exit])

  // Update accounts when fetched
  useEffect(() => {
    if (fetchedAccounts.length > 0 && allAccounts.length === 0) {
      setAllAccounts(fetchedAccounts)
    }
  }, [fetchedAccounts, allAccounts.length])

  // Handle bank auth submission
  async function handleBankSubmit(bankName: string) {
    await startBankAuth(bankName)
  }

  // Handle account selection
  function handleAccountSelect(selectedUids: string[]) {
    setPhase('syncing')
    startSync(allAccounts, selectedUids)
  }

  // Exit on complete if no interaction needed
  useEffect(() => {
    if (isSyncComplete) {
      setPhase('complete')
    }
  }, [isSyncComplete])

  return (
    <Box flexDirection="column">
      <Header />

      {/* Session status - always shown during checking */}
      {(phase === 'checking' || isSessionLoading) && (
        <SessionStatus status={sessionStatus} isLoading={isSessionLoading} />
      )}

      {/* Show session success after loading */}
      {!isSessionLoading && sessionStatus?.status === 'active' && phase === 'accounts' && !isAccountsLoading && (
        <SessionStatus status={sessionStatus} isLoading={false} />
      )}

      {/* Auth phase */}
      {phase === 'auth' && (
        <Box flexDirection="column">
          <SessionStatus status={sessionStatus} isLoading={false} />
          <BankInput
            onSubmit={handleBankSubmit}
            isAuthenticating={isAuthenticating}
            authMessage={authMessage}
          />
        </Box>
      )}

      {/* Account selection */}
      {phase === 'accounts' && allAccounts.length > 0 && (
        <AccountList
          accounts={allAccounts}
          onSelect={handleAccountSelect}
        />
      )}

      {/* Syncing progress */}
      {(phase === 'syncing' || phase === 'complete') && (
        <SyncProgress
          results={syncResults}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {/* Final summary */}
      {phase === 'complete' && (
        <ResultsSummary
          results={syncResults}
          outputPath={outputPath}
        />
      )}
    </Box>
  )
}
