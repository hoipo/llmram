import type { TokensPerSecondInput, TokensPerSecondResult } from '../types'

export function estimateTokensPerSecond(input: TokensPerSecondInput): TokensPerSecondResult {
  const { model, quantization, hardware, efficiency = 0.72 } = input

  if (efficiency <= 0 || efficiency > 1)
    throw new Error('efficiency must be > 0 and <= 1')

  const activeParamsB = model.activeParamsB
  const bytesPerToken = activeParamsB * 1_000_000_000 * (quantization.effectiveBits / 8)
  const bandwidthBytesPerSecond = hardware.bandwidthGBps * 1_000_000_000
  const tokensPerSecond = (bandwidthBytesPerSecond * efficiency) / bytesPerToken

  return {
    tokensPerSecond,
    efficiency,
    activeParamsB,
    note: 'Rough decode estimate derived from memory bandwidth and active parameters'
  }
}
