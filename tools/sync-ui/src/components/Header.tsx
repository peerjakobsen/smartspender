import React from 'react'
import { Box, Text } from 'ink'

export function Header(): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="blue">SmartSpender Sync</Text>
      <Text dimColor>{'─'.repeat(20)}</Text>
    </Box>
  )
}
