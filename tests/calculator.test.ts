import { describe, expect, it } from 'vitest'
import {
  HARDWARE_BY_ID,
  MODEL_BY_ID,
  QUANTIZATION_BY_ID,
  checkFitsOnDevice,
  estimateMemory,
  estimateTokensPerSecond,
  recommendQuantization
} from '../src'
import type { HardwareSpec } from '../src'

function mustModel(id: string) {
  const model = MODEL_BY_ID[id]
  if (!model)
    throw new Error(`Missing model fixture: ${id}`)

  return model
}

function mustQuant(id: string) {
  const quantization = QUANTIZATION_BY_ID[id]
  if (!quantization)
    throw new Error(`Missing quant fixture: ${id}`)

  return quantization
}

function mustHardware(id: string) {
  const hardware = HARDWARE_BY_ID[id]
  if (!hardware)
    throw new Error(`Missing hardware fixture: ${id}`)

  return hardware
}

describe('estimateMemory', () => {
  it('matches live-site reference values for qwen-3-8-27b at 16k context', () => {
    const result = estimateMemory({
      model: mustModel('qwen-3-8-27b'),
      quantization: mustQuant('q4_k_m'),
      contextTokens: 16000
    })

    expect(result.weightMemoryGB).toBeCloseTo(14.4588, 2)
    expect(result.kvCacheGB).toBeCloseTo(3.9063, 2)
    expect(result.runtimeOverheadGB).toBeCloseTo(1.4172, 2)
    expect(result.totalMemoryGB).toBeCloseTo(19.7822, 2)
  })

  it('matches live-site reference values for qwen-3-8-27b at 64k context', () => {
    const result = estimateMemory({
      model: mustModel('qwen-3-8-27b'),
      quantization: mustQuant('q4_k_m'),
      contextTokens: 64000
    })

    expect(result.totalMemoryGB).toBeCloseTo(31.8525, 2)
  })

  it('matches live-site reference values for qwen-3-8-flash-next-125b at 32k context', () => {
    const result = estimateMemory({
      model: mustModel('qwen-3-8-flash-next-125b'),
      quantization: mustQuant('q4_k_m'),
      contextTokens: 32000
    })

    expect(result.residentParamsB).toBe(125)
    expect(result.activeParamsB).toBe(6)
    expect(result.totalMemoryGB).toBeCloseTo(71.2564, 2)
  })
})

describe('checkFitsOnDevice', () => {
  it('fits qwen-3-8-27b 16k q4_k_m on rtx-4090 and keeps ~44 tok/s estimate', () => {
    const estimate = estimateMemory({
      model: mustModel('qwen-3-8-27b'),
      quantization: mustQuant('q4_k_m'),
      contextTokens: 16000
    })
    const hardware = mustHardware('rtx-4090')
    const fit = checkFitsOnDevice({
      estimate,
      hardware,
      reserveGB: 1
    })
    const tps = estimateTokensPerSecond({
      model: mustModel('qwen-3-8-27b'),
      quantization: mustQuant('q4_k_m'),
      hardware
    })

    expect(fit.fits).toBe(true)
    expect(fit.availableMemoryGB).toBe(23)
    expect(fit.deficitGB).toBe(0)
    expect(tps.tokensPerSecond).toBeCloseTo(44, 0)
  })

  it('applies unified memory usable ratio for apple silicon', () => {
    const estimate = estimateMemory({
      model: mustModel('llama-3.1-8b'),
      quantization: mustQuant('q4_k_m'),
      contextTokens: 16000
    })
    const apple64: HardwareSpec = {
      id: 'apple-64',
      name: 'Apple 64',
      vendor: 'Apple',
      kind: 'unified-memory',
      memoryGB: 64,
      bandwidthGBps: 300,
      source: { url: 'https://example.com', checkedAt: '2026-10-07' }
    }
    const apple16: HardwareSpec = {
      id: 'apple-16',
      name: 'Apple 16',
      vendor: 'Apple',
      kind: 'unified-memory',
      memoryGB: 16,
      bandwidthGBps: 200,
      source: { url: 'https://example.com', checkedAt: '2026-10-07' }
    }

    const fit64 = checkFitsOnDevice({ estimate, hardware: apple64, reserveGB: 0 })
    const fit16 = checkFitsOnDevice({ estimate, hardware: apple16, reserveGB: 0 })

    expect(fit64.usableMemoryRatio).toBe(0.75)
    expect(fit64.usableMemoryGB).toBe(48)
    expect(fit16.usableMemoryRatio).toBe(0.68)
    expect(fit16.usableMemoryGB).toBeCloseTo(10.88, 2)
  })
})

describe('recommendQuantization', () => {
  it('requires 10% headroom when recommending quantization', () => {
    const recommendation = recommendQuantization({
      model: mustModel('qwen-3-8-27b'),
      hardware: mustHardware('rtx-4090'),
      contextTokens: 16000,
      reserveGB: 1
    })

    expect(recommendation.recommended?.id).toBe('q4_k_m')
  })
})

describe('estimateTokensPerSecond', () => {
  it('uses active parameters for throughput estimate (MoE)', () => {
    const tokensPerSecond = estimateTokensPerSecond({
      model: mustModel('qwen-3-8-flash-next-125b'),
      quantization: mustQuant('q4_k_m'),
      hardware: mustHardware('rtx-4090')
    })

    expect(tokensPerSecond.activeParamsB).toBe(6)
    expect(tokensPerSecond.tokensPerSecond).toBeGreaterThan(100)
  })
})
