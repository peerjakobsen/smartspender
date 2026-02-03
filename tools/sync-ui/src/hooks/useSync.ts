import { useState, useCallback } from 'react'
import { getTransactions, getDateRange } from '../api/eb-client'
import {
  loadExistingHashes,
  ensureOutputFile,
  transformTransaction,
  appendTransaction,
  getOutputPath
} from '../utils/csv'
import type { Account, SyncResult, Transaction } from '../types'

interface UseSyncResult {
  results: SyncResult[]
  isSyncing: boolean
  isComplete: boolean
  dateFrom: string
  dateTo: string
  outputPath: string
  startSync: (accounts: Account[], selectedUids: string[]) => Promise<void>
}

export function useSync(): UseSyncResult {
  const [results, setResults] = useState<SyncResult[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const { dateFrom, dateTo } = getDateRange()
  const outputPath = getOutputPath()

  const startSync = useCallback(async (accounts: Account[], selectedUids: string[]) => {
    setIsSyncing(true)
    setIsComplete(false)

    // Prepare output file
    ensureOutputFile()
    const existingHashes = loadExistingHashes()

    // Initialize results for selected accounts
    const initialResults: SyncResult[] = selectedUids.map(uid => {
      const account = accounts.find(a => a.uid === uid)
      return {
        accountUid: uid,
        accountName: account?.product || account?.name || 'Unknown',
        status: 'pending' as const
      }
    })
    setResults(initialResults)

    const syncedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // Sync each account sequentially
    for (let i = 0; i < selectedUids.length; i++) {
      const uid = selectedUids[i]
      const account = accounts.find(a => a.uid === uid)
      const accountName = account?.product || account?.name || 'Unknown'

      // Mark as syncing
      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'syncing' as const } : r
      ))

      try {
        const response = await getTransactions(uid, dateFrom, dateTo)

        if (response.error) {
          // Check if rate limited
          if (response.error === 'rate_limit') {
            setResults(prev => prev.map((r, idx) =>
              idx === i ? { ...r, status: 'rate_limited' as const } : r
            ))
            continue
          }

          setResults(prev => prev.map((r, idx) =>
            idx === i ? {
              ...r,
              status: 'error' as const,
              error: response.message || response.details || response.error
            } : r
          ))
          continue
        }

        // Process transactions
        const transactions = response.transactions || []
        let newCount = 0
        let duplicateCount = 0

        for (const tx of transactions) {
          const result = transformTransaction(tx as Transaction, uid, syncedAt)
          if (!result) continue

          if (existingHashes.has(result.txHash)) {
            duplicateCount++
            continue
          }

          appendTransaction(result.csvRow)
          existingHashes.add(result.txHash)
          newCount++
        }

        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'success' as const,
            newCount,
            fetchedCount: transactions.length,
            duplicateCount,
            warning: response.warning
          } : r
        ))
      } catch (err) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Unknown error'
          } : r
        ))
      }
    }

    setIsSyncing(false)
    setIsComplete(true)
  }, [dateFrom, dateTo])

  return {
    results,
    isSyncing,
    isComplete,
    dateFrom,
    dateTo,
    outputPath,
    startSync
  }
}
