import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCli } from '../src/cli'

const originalArgv = [...process.argv]
const originalExitCode = process.exitCode

afterEach(() => {
  process.argv = [...originalArgv]
  process.exitCode = originalExitCode
  vi.restoreAllMocks()
})

interface CliRunResult {
  stdout: string[]
  stderr: string[]
  exitCode: number | undefined
}

function runWithArgs(args: string[]): CliRunResult {
  const stdout: string[] = []
  const stderr: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
    stdout.push(String(message ?? ''))
  })
  const errorSpy = vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
    stderr.push(String(message ?? ''))
  })

  process.argv = ['node', 'llmram', ...args]
  process.exitCode = undefined

  runCli()

  logSpy.mockRestore()
  errorSpy.mockRestore()

  return {
    stdout,
    stderr,
    exitCode: process.exitCode
  }
}

describe('runCli', () => {
  it('errors when --quant has no value', () => {
    const result = runWithArgs(['qwen-3-8-27b', '--quant'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('--quant requires a value')
  })

  it('errors when --gpu has no value', () => {
    const result = runWithArgs(['qwen-3-8-27b', '--gpu'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('--gpu requires a value')
  })

  it('errors on non-integer ctx', () => {
    const result = runWithArgs(['qwen-3-8-27b', '--ctx', '32768abc'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr[0]).toContain('--ctx must be a positive integer')
  })

  it('prints table for valid command', () => {
    const result = runWithArgs(['qwen-3-8-27b', '--quant', 'q4_k_m', '--ctx', '16000', '--gpu', 'rtx-4090'])

    expect(result.exitCode).toBeUndefined()
    expect(result.stdout[0]).toContain('Total memory')
    expect(result.stdout[0]).toContain('GiB')
    expect(result.stdout[0]).toContain('tok/s (estimate)')
    expect(result.stdout[0]).toContain('Recommended quant')
  })

  it('shows n/a tokens/sec when estimate does not fit', () => {
    const result = runWithArgs(['qwen-3-8-flash-next-125b', '--quant', 'q4_k_m', '--ctx', '32000', '--gpu', 'rtx-4090'])

    expect(result.exitCode).toBeUndefined()
    expect(result.stdout[0]).toContain('n/a (does not fit)')
  })
})
