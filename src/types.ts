export interface SourceMeta {
  url: string
  checkedAt: string
  note?: string
}

export interface ModelMoeSpec {
  totalExperts: number
  expertsPerToken: number
}

export interface LlmModelSpec {
  id: string
  name: string
  family: string
  architecture: string
  layers: number
  attentionHeads: number
  kvHeads: number
  headDim: number
  hiddenSize: number
  contextWindow: number
  totalParamsB: number
  activeParamsB: number
  source: SourceMeta
  moe?: ModelMoeSpec
}

export interface HardwareSpec {
  id: string
  name: string
  vendor: string
  kind: 'gpu' | 'unified-memory'
  memoryGB: number
  bandwidthGBps: number
  source: SourceMeta
}

export interface QuantizationSpec {
  id: string
  label: string
  effectiveBits: number
  kvCacheBytesPerElement: number
}

export interface MemoryEstimateInput {
  model: LlmModelSpec
  quantization: QuantizationSpec
  contextTokens: number
  batchSize?: number
  runtimeOverheadGB?: number
}

export interface MemoryEstimateResult {
  residentParamsB: number
  activeParamsB: number
  weightMemoryGB: number
  kvCacheGB: number
  runtimeOverheadGB: number
  totalMemoryGB: number
}

export interface FitsOnDeviceInput {
  estimate: MemoryEstimateResult
  hardware: HardwareSpec
  reserveGB?: number
}

export interface FitsOnDeviceResult {
  fits: boolean
  reserveGB: number
  availableMemoryGB: number
  requiredMemoryGB: number
  deficitGB: number
}

export interface TokensPerSecondInput {
  model: LlmModelSpec
  quantization: QuantizationSpec
  hardware: HardwareSpec
  efficiency?: number
}

export interface TokensPerSecondResult {
  tokensPerSecond: number
  efficiency: number
  activeParamsB: number
  note: string
}

export interface RecommendQuantizationInput {
  model: LlmModelSpec
  hardware: HardwareSpec
  contextTokens: number
  batchSize?: number
  reserveGB?: number
  quantizationIds?: string[]
}

export interface RecommendQuantizationResult {
  recommended: QuantizationSpec | null
  attempted: Array<{
    quantization: QuantizationSpec
    estimate: MemoryEstimateResult
    fits: FitsOnDeviceResult
  }>
}

export interface HuggingFaceConfigLike {
  model_type?: string
  architectures?: string[]
  num_hidden_layers?: number
  hidden_size?: number
  num_attention_heads?: number
  num_key_value_heads?: number
  head_dim?: number
  max_position_embeddings?: number
  num_local_experts?: number
  num_experts?: number
  num_experts_per_tok?: number
  /** Multimodal configs (e.g. Qwen 3.5+/3.8) nest the language model fields here. */
  text_config?: HuggingFaceConfigLike
}

export interface BuildModelFromHfInput {
  id: string
  name: string
  family: string
  hfRepo: string
  sourceDate: string
  config: HuggingFaceConfigLike
  totalParamsB: number
  activeParamsB?: number
}
