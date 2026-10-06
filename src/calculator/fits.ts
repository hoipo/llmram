import type { FitsOnDeviceInput, FitsOnDeviceResult } from '../types'

export function checkFitsOnDevice(input: FitsOnDeviceInput): FitsOnDeviceResult {
  const { estimate, hardware, reserveGB = 1 } = input

  if (reserveGB < 0)
    throw new Error('reserveGB must be >= 0')

  const availableMemoryGB = hardware.memoryGB - reserveGB
  const requiredMemoryGB = estimate.totalMemoryGB
  const deficitGB = Math.max(0, requiredMemoryGB - availableMemoryGB)
  const fits = deficitGB === 0

  return {
    fits,
    reserveGB,
    availableMemoryGB,
    requiredMemoryGB,
    deficitGB
  }
}
