import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import Spinner from 'ink-spinner'

const DANISH_BANKS = [
  'Nykredit',
  'Danske Bank',
  'Nordea',
  'Jyske Bank',
  'Sydbank',
  'Spar Nord',
  'Arbejdernes Landsbank',
  'Ringkjøbing Landbobank'
]

interface Props {
  onSubmit: (bankName: string) => void
  isAuthenticating: boolean
  authMessage?: string
}

export function BankInput({ onSubmit, isAuthenticating, authMessage }: Props): React.ReactElement {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useInput((inputChar, key) => {
    if (isAuthenticating) return

    if (key.return) {
      const value = suggestions.length > 0 ? suggestions[selectedIndex] : input
      if (value.trim()) {
        onSubmit(value.trim())
      }
      return
    }

    if (key.backspace || key.delete) {
      const newInput = input.slice(0, -1)
      setInput(newInput)
      updateSuggestions(newInput)
      return
    }

    if (key.upArrow && suggestions.length > 0) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
      return
    }

    if (key.downArrow && suggestions.length > 0) {
      setSelectedIndex(Math.min(suggestions.length - 1, selectedIndex + 1))
      return
    }

    if (key.tab && suggestions.length > 0) {
      setInput(suggestions[selectedIndex])
      setSuggestions([])
      return
    }

    if (inputChar && !key.ctrl && !key.meta) {
      const newInput = input + inputChar
      setInput(newInput)
      updateSuggestions(newInput)
    }
  })

  function updateSuggestions(query: string) {
    if (!query) {
      setSuggestions([])
      setSelectedIndex(0)
      return
    }

    const matches = DANISH_BANKS.filter(bank =>
      bank.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 4)

    setSuggestions(matches)
    setSelectedIndex(0)
  }

  if (isAuthenticating) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {authMessage || 'Authenticating...'}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Complete MitID login in browser to continue...</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>Which bank do you want to connect?</Text>
      <Text dimColor>  Common: Nykredit, Danske Bank, Nordea, Jyske Bank</Text>
      <Box marginTop={1}>
        <Text>Bank: </Text>
        <Text color="cyan">{input}</Text>
        <Text color="gray">|</Text>
      </Box>

      {suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {suggestions.map((bank, i) => (
            <Box key={bank}>
              <Text color={i === selectedIndex ? 'cyan' : 'gray'}>
                {i === selectedIndex ? '> ' : '  '}
                {bank}
              </Text>
            </Box>
          ))}
          <Box marginTop={1}>
            <Text dimColor>  ↑/↓ select, Tab complete, Enter confirm</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}
