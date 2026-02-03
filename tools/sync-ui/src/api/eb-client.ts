import { resolve } from 'path'
import type {
  SessionStatus,
  AccountsResponse,
  TransactionsResponse,
  AuthResponse
} from '../types'

const SCRIPT_DIR = resolve(import.meta.dir, '../../..')
const EB_API_PATH = resolve(SCRIPT_DIR, 'eb-api.py')

async function runEbApi(args: string[]): Promise<string> {
  const proc = Bun.spawn(['python3', EB_API_PATH, ...args], {
    stdout: 'pipe',
    stderr: 'pipe'
  })

  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  await proc.exited

  if (proc.exitCode !== 0 && !stdout.trim()) {
    throw new Error(stderr || `eb-api.py exited with code ${proc.exitCode}`)
  }

  return stdout.trim()
}

function parseJson<T>(output: string): T {
  try {
    return JSON.parse(output) as T
  } catch {
    throw new Error(`Failed to parse API response: ${output}`)
  }
}

export async function checkSession(): Promise<SessionStatus> {
  const output = await runEbApi(['status'])
  return parseJson<SessionStatus>(output)
}

export async function getAccounts(): Promise<AccountsResponse> {
  const output = await runEbApi(['accounts'])
  return parseJson<AccountsResponse>(output)
}

export async function getTransactions(
  accountUid: string,
  dateFrom: string,
  dateTo: string
): Promise<TransactionsResponse> {
  const output = await runEbApi([
    'transactions',
    '--account', accountUid,
    '--from', dateFrom,
    '--to', dateTo
  ])
  return parseJson<TransactionsResponse>(output)
}

export async function startAuth(bankName: string): Promise<AuthResponse> {
  const output = await runEbApi(['auth', '--bank', bankName])
  return parseJson<AuthResponse>(output)
}

export function getDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const dateTo = now.toISOString().split('T')[0]

  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const dateFrom = ninetyDaysAgo.toISOString().split('T')[0]

  return { dateFrom, dateTo }
}
