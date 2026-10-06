import type { HardwareSpec } from '../types'

export const HARDWARE_SPECS: HardwareSpec[] = [
  {
    id: 'rtx-4060-8gb',
    name: 'GeForce RTX 4060 8GB',
    vendor: 'NVIDIA',
    kind: 'gpu',
    memoryGB: 8,
    bandwidthGBps: 272,
    source: {
      url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/',
      checkedAt: '2026-10-06',
      note: 'NVIDIA official product page'
    }
  },
  {
    id: 'rtx-4090',
    name: 'GeForce RTX 4090 24GB',
    vendor: 'NVIDIA',
    kind: 'gpu',
    memoryGB: 24,
    bandwidthGBps: 1008,
    source: {
      url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/',
      checkedAt: '2026-10-06',
      note: 'NVIDIA official product page'
    }
  },
  {
    id: 'a100-80gb',
    name: 'NVIDIA A100 80GB PCIe',
    vendor: 'NVIDIA',
    kind: 'gpu',
    memoryGB: 80,
    bandwidthGBps: 1935,
    source: {
      url: 'https://www.nvidia.com/en-us/data-center/a100/',
      checkedAt: '2026-10-06',
      note: 'NVIDIA data center product page'
    }
  },
  {
    id: 'h100-80gb',
    name: 'NVIDIA H100 80GB SXM',
    vendor: 'NVIDIA',
    kind: 'gpu',
    memoryGB: 80,
    bandwidthGBps: 3350,
    source: {
      url: 'https://www.nvidia.com/en-us/data-center/h100/',
      checkedAt: '2026-10-06',
      note: 'NVIDIA data center product page'
    }
  },
  {
    id: 'm2-max-64gb',
    name: 'Apple M2 Max (64GB Unified Memory)',
    vendor: 'Apple',
    kind: 'unified-memory',
    memoryGB: 64,
    bandwidthGBps: 400,
    source: {
      url: 'https://www.apple.com/macbook-pro/specs/',
      checkedAt: '2026-10-06',
      note: 'Apple MacBook Pro specs'
    }
  },
  {
    id: 'm3-max-128gb',
    name: 'Apple M3 Max (128GB Unified Memory)',
    vendor: 'Apple',
    kind: 'unified-memory',
    memoryGB: 128,
    bandwidthGBps: 400,
    source: {
      url: 'https://www.apple.com/macbook-pro/specs/',
      checkedAt: '2026-10-06',
      note: 'Apple MacBook Pro specs'
    }
  }
]

export const HARDWARE_BY_ID: Record<string, HardwareSpec> = Object.fromEntries(
  HARDWARE_SPECS.map((hardware) => [hardware.id, hardware])
)
