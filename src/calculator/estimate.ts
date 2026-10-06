import type { MemoryEstimateInput, MemoryEstimateResult } from '../types'

const BYTES_IN_GB = 1024 ** 3

export function estimateMemory(input: MemoryEstimateInput): MemoryEstimateResult {
  const { model, quantization, contextTokens, batchSize = 1, runtimeOverheadGB } = input

  if (contextTokens <= 0)
    throw new Error('contextTokens must be > 0')
  if (batchSize <= 0)
    throw new Error('batchSize must be > 0')

  const residentParamsB = model.totalParamsB
  const activeParamsB = model.activeParamsB
  const weightBytes = (residentParamsB * 1_000_000_000 * quantization.effectiveBits) / 8
  const kvCacheBytes = 2 * model.layers * model.kvHeads * model.headDim * quantization.kvCacheBytesPerElement * contextTokens * batchSize
  const computedRuntimeOverheadGB = runtimeOverheadGB ?? estimateRuntimeOverhead({
    weightBytes,
    kvCacheBytes
  })

  const weightMemoryGB = weightBytes / BYTES_IN_GB
  const kvCacheGB = kvCacheBytes / BYTES_IN_GB
  const totalMemoryGB = weightMemoryGB + kvCacheGB + computedRuntimeOverheadGB

  return {
    residentParamsB,
    activeParamsB,
    weightMemoryGB,
    kvCacheGB,
    runtimeOverheadGB: computedRuntimeOverheadGB,
    totalMemoryGB
  }
}

interface RuntimeOverheadInput {
  weightBytes: number
  kvCacheBytes: number
}

function estimateRuntimeOverhead(input: RuntimeOverheadInput): number {
  const { weightBytes, kvCacheBytes } = input
  const weightGB = weightBytes / BYTES_IN_GB
  const kvGB = kvCacheBytes / BYTES_IN_GB
  const baseGB = 0.5

  return baseGB + weightGB * 0.05 + kvGB * 0.02
}
