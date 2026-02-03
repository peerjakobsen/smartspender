import React from 'react'
import { Box, Text } from 'ink'
import type { SyncResult } from '../types'

interface Props {
  results: SyncResult[]
  outputPath: string
}

export function ResultsSummary({ results, outputPath }: Props): React.ReactElement {
  const totalNew = results.reduce((sum, r) => sum + (r.newCount || 0), 0)
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const rateLimitedCount = results.filter(r => r.status === 'rate_limited').length

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>{'─'.repeat(40)}</Text>
      <Box marginTop={1}>
        {totalNew > 0 ? (
          <Box flexDirection="column">
            <Box>
              <Text color="green">✓</Text>
              <Text> Total: {totalNew} new transactions saved</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Output: {outputPath}</Text>
            </Box>
          </Box>
        ) : (
          <Text>No new transactions to sync.</Text>
        )}
      </Box>

      {(errorCount > 0 || rateLimitedCount > 0) && (
        <Box marginTop={1} flexDirection="column">
          {errorCount > 0 && (
            <Text color="red">{errorCount} account(s) failed</Text>
          )}
          {rateLimitedCount > 0 && (
            <Text color="yellow">{rateLimitedCount} account(s) rate limited</Text>
          )}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Synced {successCount}/{results.length} accounts</Text>
      </Box>
    </Box>
  )
}
