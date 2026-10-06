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
  it('computes weight memory from resident params and effective bits', () => {
    const model = mustModel('llama-3.1-8b')
    const quantization = mustQuant('q4_k_m')
    const result = estimateMemory({
      model,
      quantization,
      contextTokens: 8192
    })

    expect(result.weightMemoryGB).toBeCloseTo(4.51, 1)
    expect(result.kvCacheGB).toBeCloseTo(1, 1)
  })

  it('uses TOTAL params for MoE weight residency (reference point)', () => {
    const model = mustModel('qwen-3-8-flash-next-125b')
    const quantization = mustQuant('q4_k_m')
    const result = estimateMemory({
      model,
      quantization,
      contextTokens: 32768
    })

    const expectedWeightGb = (125 * 1_000_000_000 * 4.83 / 8) / 1024 ** 3

    expect(model.activeParamsB).toBe(6)
    expect(model.totalParamsB).toBe(125)
    expect(result.residentParamsB).toBe(125)
    expect(result.weightMemoryGB).toBeCloseTo(expectedWeightGb, 4)
  })

  it('treats dense models as resident = active = total params', () => {
    const model = mustModel('qwen-3-8-27b')
    const result = estimateMemory({
      model,
      quantization: mustQuant('q4_k_m'),
      contextTokens: 16384
    })

    expect(result.residentParamsB).toBe(27)
    expect(result.activeParamsB).toBe(27)
    expect(result.kvCacheGB).toBeCloseTo(4, 4)
  })
})

describe('checkFitsOnDevice', () => {
  it('returns fit details for a target hardware', () => {
    const model = mustModel('llama-3.1-8b')
    const quantization = mustQuant('q4_k_m')
    const estimate = estimateMemory({
      model,
      quantization,
      contextTokens: 8192
    })
    const fit = checkFitsOnDevice({
      estimate,
      hardware: mustHardware('rtx-4090'),
      reserveGB: 1
    })

    expect(fit.fits).toBe(true)
    expect(fit.availableMemoryGB).toBe(23)
    expect(fit.deficitGB).toBe(0)
  })
})

describe('recommendQuantization', () => {
  it('returns a fitting quantization for a constrained card', () => {
    const recommendation = recommendQuantization({
      model: mustModel('qwen-3-8-27b'),
      hardware: mustHardware('rtx-4090'),
      contextTokens: 16384,
      reserveGB: 1
    })

    expect(recommendation.recommended?.id).toBe('q5_k_m')
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
    expect(tokensPerSecond.tokensPerSecond).toBeGreaterThan(10)
  })
})
