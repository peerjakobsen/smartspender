import { homedir } from 'os'
import { join } from 'path'
import { existsSync, readFileSync, appendFileSync, mkdirSync, writeFileSync } from 'fs'
import type { Transaction } from '../types'

const OUTPUT_DIR = join(homedir(), 'Documents', 'SmartSpender')
const OUTPUT_FILE = join(OUTPUT_DIR, 'transactions.csv')

const CSV_HEADER = 'tx_id,tx_hash,date,amount,currency,description,raw_text,bank,account,synced_at'

function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function generateUUID(): string {
  return crypto.randomUUID()
}

function formatAmount(amount: string, indicator: 'CRDT' | 'DBIT'): string {
  const num = parseFloat(amount)
  const formatted = num.toFixed(2)
  return indicator === 'DBIT' ? `-${formatted}` : formatted
}

export function loadExistingHashes(): Set<string> {
  const hashes = new Set<string>()

  if (!existsSync(OUTPUT_FILE)) {
    return hashes
  }

  const content = readFileSync(OUTPUT_FILE, 'utf-8')
  const lines = content.split('\n').slice(1) // Skip header

  for (const line of lines) {
    if (!line.trim()) continue

    // Extract tx_hash (second column)
    const match = line.match(/^[^,]*,([^,]*)/)
    if (match && match[1]) {
      hashes.add(match[1])
    }
  }

  return hashes
}

export function ensureOutputFile(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  if (!existsSync(OUTPUT_FILE)) {
    writeFileSync(OUTPUT_FILE, CSV_HEADER + '\n')
  }
}

export interface TransformResult {
  csvRow: string
  txHash: string
}

export function transformTransaction(
  tx: Transaction,
  accountUid: string,
  syncedAt: string
): TransformResult | null {
  // Only process BOOK status
  if (tx.status !== 'BOOK') {
    return null
  }

  // Skip if no booking date
  if (!tx.booking_date) {
    return null
  }

  const bookingDate = tx.booking_date
  const amount = formatAmount(tx.transaction_amount.amount, tx.credit_debit_indicator)
  const currency = tx.transaction_amount.currency || 'DKK'

  // Build description
  let description = ''
  if (tx.credit_debit_indicator === 'DBIT') {
    description = tx.creditor?.name || ''
  } else {
    description = tx.debtor?.name || ''
  }

  if (!description && tx.remittance_information?.length) {
    description = tx.remittance_information[0]
  }

  if (!description && tx.bank_transaction_code?.description) {
    description = tx.bank_transaction_code.description
  }

  description = description?.trim().replace(/\s+/g, ' ') || 'Unknown'

  // Build raw text
  let rawText = ''
  if (tx.remittance_information?.length) {
    rawText = tx.remittance_information.join(' ')
  }
  if (!rawText) {
    rawText = description
  }

  // Calculate tx_hash for deduplication
  let txHash: string
  if (tx.balance_after_transaction?.amount) {
    const saldo = formatAmount(
      tx.balance_after_transaction.amount,
      tx.balance_after_transaction.credit_debit_indicator
    )
    txHash = `${accountUid}|${bookingDate}|${amount}|${saldo}`
  } else {
    // Fallback: use normalized raw_text
    const normalizedRaw = rawText.toLowerCase().trim()
    txHash = `${accountUid}|${bookingDate}|${amount}|${normalizedRaw}`
  }

  const txId = generateUUID()

  const csvRow = [
    escapeCSV(txId),
    escapeCSV(txHash),
    escapeCSV(bookingDate),
    escapeCSV(amount),
    escapeCSV(currency),
    escapeCSV(description),
    escapeCSV(rawText),
    'enable-banking',
    escapeCSV(accountUid),
    escapeCSV(syncedAt)
  ].join(',')

  return { csvRow, txHash }
}

export function appendTransaction(csvRow: string): void {
  appendFileSync(OUTPUT_FILE, csvRow + '\n')
}

export function getOutputPath(): string {
  return OUTPUT_FILE
}
