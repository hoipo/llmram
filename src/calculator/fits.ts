import type { FitsOnDeviceInput, FitsOnDeviceResult } from '../types'

export function checkFitsOnDevice(input: FitsOnDeviceInput): FitsOnDeviceResult {
  const { estimate, hardware, reserveGB = 1 } = input

  if (reserveGB < 0)
    throw new Error('reserveGB must be >= 0')

  const usableMemoryRatio = getUsableMemoryRatio({
    vendor: hardware.vendor,
    kind: hardware.kind,
    memoryGB: hardware.memoryGB
  })
  const usableMemoryGB = hardware.memoryGB * usableMemoryRatio
  const availableMemoryGB = Math.max(0, usableMemoryGB - reserveGB)
  const requiredMemoryGB = estimate.totalMemoryGB
  const deficitGB = Math.max(0, requiredMemoryGB - availableMemoryGB)
  const fits = deficitGB === 0

  return {
    fits,
    reserveGB,
    usableMemoryGB,
    usableMemoryRatio,
    availableMemoryGB,
    requiredMemoryGB,
    deficitGB
  }
}

interface GetUsableMemoryRatioInput {
  vendor: string
  kind: 'gpu' | 'unified-memory'
  memoryGB: number
}

function getUsableMemoryRatio(input: GetUsableMemoryRatioInput): number {
  if (input.vendor.toLowerCase() !== 'apple')
    return 1

  if (input.kind !== 'unified-memory')
    return 1

  if (input.memoryGB <= 16)
    return 0.68

  return 0.75
}
