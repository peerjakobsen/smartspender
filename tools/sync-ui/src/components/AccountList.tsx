import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { Account } from '../types'

interface Props {
  accounts: Account[]
  onSelect: (selectedUids: string[]) => void
}

export function AccountList({ accounts, onSelect }: Props): React.ReactElement {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [cursorIndex, setCursorIndex] = useState(0)

  // Add "All accounts" as last option
  const totalOptions = accounts.length + 1

  useInput((_, key) => {
    if (key.upArrow) {
      setCursorIndex(Math.max(0, cursorIndex - 1))
      return
    }

    if (key.downArrow) {
      setCursorIndex(Math.min(totalOptions - 1, cursorIndex + 1))
      return
    }

    if (key.return) {
      // If "All accounts" selected (or no selection made), select all
      if (cursorIndex === accounts.length || selectedIndices.size === 0) {
        const allUids = accounts.map(a => a.uid)
        onSelect(allUids)
      } else {
        const uids = Array.from(selectedIndices).map(i => accounts[i].uid)
        onSelect(uids)
      }
      return
    }

    // Space to toggle selection
    if (key.return === false && _ === ' ') {
      if (cursorIndex === accounts.length) {
        // "All accounts" option - select all
        const allIndices = new Set(accounts.map((_, i) => i))
        setSelectedIndices(allIndices)
      } else {
        const newSelection = new Set(selectedIndices)
        if (newSelection.has(cursorIndex)) {
          newSelection.delete(cursorIndex)
        } else {
          newSelection.add(cursorIndex)
        }
        setSelectedIndices(newSelection)
      }
    }
  })

  function maskIban(iban: string | null): string {
    if (!iban) return 'N/A'
    return `${iban.slice(0, 4)}...${iban.slice(-4)}`
  }

  function getDisplayName(account: Account): string {
    return account.product || account.name || 'Unknown'
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>Your accounts:</Text>
      <Text dimColor>  Space to toggle, Enter to confirm</Text>
      <Box flexDirection="column" marginTop={1}>
        {accounts.map((account, i) => {
          const isSelected = selectedIndices.has(i)
          const isCursor = i === cursorIndex

          return (
            <Box key={account.uid}>
              <Text color={isCursor ? 'cyan' : undefined}>
                {isCursor ? '>' : ' '}
                {isSelected ? ' [x]' : ' [ ]'}
                {' '}
                {getDisplayName(account)} ({maskIban(account.iban)}) - {account.currency}
              </Text>
            </Box>
          )
        })}

        {/* All accounts option */}
        <Box>
          <Text color={cursorIndex === accounts.length ? 'cyan' : undefined}>
            {cursorIndex === accounts.length ? '>' : ' '}
            {selectedIndices.size === accounts.length ? ' [x]' : ' [ ]'}
            {' All accounts'}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
