import type { QuantizationSpec } from '../types'

export const QUANTIZATIONS: QuantizationSpec[] = [
  { id: 'fp16', label: 'FP16', effectiveBits: 16, kvCacheBytesPerElement: 2 },
  { id: 'bf16', label: 'BF16', effectiveBits: 16, kvCacheBytesPerElement: 2 },
  { id: 'q8_0', label: 'Q8_0', effectiveBits: 8, kvCacheBytesPerElement: 2 },
  { id: 'q6_k', label: 'Q6_K', effectiveBits: 6.56, kvCacheBytesPerElement: 2 },
  { id: 'q5_k_m', label: 'Q5_K_M', effectiveBits: 5.52, kvCacheBytesPerElement: 2 },
  { id: 'q4_k_m', label: 'Q4_K_M', effectiveBits: 4.6, kvCacheBytesPerElement: 2 },
  { id: 'q4_0', label: 'Q4_0', effectiveBits: 4, kvCacheBytesPerElement: 2 },
  { id: 'q3_k_m', label: 'Q3_K_M', effectiveBits: 3.89, kvCacheBytesPerElement: 2 }
]

export const QUANTIZATION_BY_ID: Record<string, QuantizationSpec> = Object.fromEntries(
  QUANTIZATIONS.map((quantization) => [quantization.id, quantization])
)
