import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { SessionStatus as SessionStatusType } from '../types'

interface Props {
  status: SessionStatusType | null
  isLoading: boolean
}

export function SessionStatus({ status, isLoading }: Props): React.ReactElement {
  if (isLoading) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Checking session...</Text>
      </Box>
    )
  }

  if (!status) {
    return <></>
  }

  switch (status.status) {
    case 'active':
      return (
        <Box>
          <Text color="green">✓</Text>
          <Text> Session active ({status.days_remaining} days remaining)</Text>
        </Box>
      )
    case 'expired':
      return (
        <Box>
          <Text color="yellow">!</Text>
          <Text> Session expired. Starting authorization...</Text>
        </Box>
      )
    case 'no_session':
      return (
        <Box>
          <Text color="yellow">!</Text>
          <Text> No active session. Starting authorization...</Text>
        </Box>
      )
    case 'error':
      return (
        <Box>
          <Text color="red">✗</Text>
          <Text> {status.error || status.message || 'Unknown error'}</Text>
        </Box>
      )
    default:
      return (
        <Box>
          <Text color="yellow">?</Text>
          <Text> Unknown status: {status.status}</Text>
        </Box>
      )
  }
}
