import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { SyncResult } from '../types'

interface Props {
  results: SyncResult[]
  dateFrom: string
  dateTo: string
}

export function SyncProgress({ results, dateFrom, dateTo }: Props): React.ReactElement {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>Syncing transactions from {dateFrom} to {dateTo}...</Text>
      <Box flexDirection="column" marginTop={1}>
        {results.map(result => (
          <AccountSyncStatus key={result.accountUid} result={result} />
        ))}
      </Box>
    </Box>
  )
}

function AccountSyncStatus({ result }: { result: SyncResult }): React.ReactElement {
  switch (result.status) {
    case 'pending':
      return (
        <Box>
          <Text dimColor>  </Text>
          <Text dimColor>{result.accountName}: waiting...</Text>
        </Box>
      )

    case 'syncing':
      return (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {result.accountName}: fetching...</Text>
        </Box>
      )

    case 'success': {
      const details = []
      if (result.fetchedCount !== undefined) {
        details.push(`fetched: ${result.fetchedCount}`)
      }
      if (result.duplicateCount && result.duplicateCount > 0) {
        details.push(`${result.duplicateCount} duplicates skipped`)
      }
      const detailStr = details.length > 0 ? ` (${details.join(', ')})` : ''

      return (
        <Box flexDirection="column">
          <Box>
            <Text color="green">✓</Text>
            <Text> {result.accountName}: {result.newCount} new transactions{detailStr}</Text>
          </Box>
          {result.warning && (
            <Box marginLeft={2}>
              <Text color="yellow">! {result.warning}</Text>
            </Box>
          )}
        </Box>
      )
    }

    case 'error':
      return (
        <Box>
          <Text color="red">✗</Text>
          <Text> {result.accountName}: {result.error || 'Unknown error'}</Text>
        </Box>
      )

    case 'rate_limited':
      return (
        <Box>
          <Text color="yellow">!</Text>
          <Text> {result.accountName}: PSD2 rate limit reached. Skipping.</Text>
        </Box>
      )

    default:
      return <></>
  }
}
