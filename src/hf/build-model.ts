import type { BuildModelFromHfInput, LlmModelSpec } from '../types'

export function buildModelFromHfConfig(input: BuildModelFromHfInput): LlmModelSpec {
  const { id, name, family, hfRepo, sourceDate, totalParamsB, activeParamsB = totalParamsB } = input
  const config = input.config.text_config
    ? { architectures: input.config.architectures, ...input.config.text_config }
    : input.config

  if (totalParamsB <= 0)
    throw new Error('totalParamsB must be > 0')
  if (activeParamsB <= 0)
    throw new Error('activeParamsB must be > 0')
  if (activeParamsB > totalParamsB)
    throw new Error('activeParamsB cannot be greater than totalParamsB')

  const layers = config.num_hidden_layers
  const hiddenSize = config.hidden_size
  const attentionHeads = config.num_attention_heads
  const kvHeads = config.num_key_value_heads ?? config.num_attention_heads

  if (!layers)
    throw new Error('config.num_hidden_layers is required')
  if (!hiddenSize)
    throw new Error('config.hidden_size is required')
  if (!attentionHeads)
    throw new Error('config.num_attention_heads is required')
  if (!kvHeads)
    throw new Error('config.num_key_value_heads or config.num_attention_heads is required')

  const headDim = config.head_dim ?? Math.floor(hiddenSize / attentionHeads)
  const contextWindow = config.max_position_embeddings ?? 8192
  const architecture = config.model_type ?? config.architectures?.[0] ?? 'decoder-transformer'
  const totalExperts = config.num_local_experts ?? config.num_experts
  const expertsPerToken = config.num_experts_per_tok
  const isMoe = Boolean(totalExperts && totalExperts > 1) || activeParamsB < totalParamsB

  const baseModel: LlmModelSpec = {
    id,
    name,
    family,
    architecture: isMoe ? `${architecture}-moe` : architecture,
    layers,
    attentionHeads,
    kvHeads,
    headDim,
    hiddenSize,
    contextWindow,
    totalParamsB,
    activeParamsB,
    source: {
      url: `https://huggingface.co/${hfRepo}`,
      checkedAt: sourceDate,
      note: 'Generated from Hugging Face config.json'
    }
  }

  if (!isMoe || !totalExperts || !expertsPerToken)
    return baseModel

  return {
    ...baseModel,
    moe: {
      totalExperts,
      expertsPerToken
    }
  }
}
