import { QUANTIZATION_BY_ID, QUANTIZATIONS } from '../data/quantizations'
import { estimateMemory } from './estimate'
import { checkFitsOnDevice } from './fits'
import type { RecommendQuantizationInput, RecommendQuantizationResult } from '../types'

export function recommendQuantization(input: RecommendQuantizationInput): RecommendQuantizationResult {
  const {
    model,
    hardware,
    contextTokens,
    batchSize = 1,
    reserveGB = 1,
    quantizationIds = QUANTIZATIONS.map((quantization) => quantization.id)
  } = input

  const quantizations = quantizationIds
    .map((quantizationId) => QUANTIZATION_BY_ID[quantizationId])
    .filter((quantization) => quantization !== undefined)
    .sort((left, right) => right.effectiveBits - left.effectiveBits)

  const attempted = quantizations.map((quantization) => {
    const estimate = estimateMemory({
      model,
      quantization,
      contextTokens,
      batchSize
    })
    const fits = checkFitsOnDevice({
      estimate,
      hardware,
      reserveGB
    })
    return {
      quantization,
      estimate,
      fits
    }
  })

  const recommended = attempted
    .find((result) => result.fits.fits && result.estimate.totalMemoryGB <= result.fits.availableMemoryGB * 0.9)
    ?.quantization ?? null

  return {
    recommended,
    attempted
  }
}
