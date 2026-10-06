import type { LlmModelSpec } from '../types'

export const MODEL_SPECS: LlmModelSpec[] = [
  {
    id: 'qwen-3-8-27b',
    name: 'Qwen 3.8 27B',
    family: 'Qwen 3.8',
    architecture: 'Qwen3_5ForConditionalGeneration',
    layers: 64,
    attentionHeads: 24,
    kvHeads: 4,
    headDim: 256,
    hiddenSize: 5120,
    contextWindow: 262144,
    totalParamsB: 27,
    activeParamsB: 27,
    source: {
      url: 'https://huggingface.co/Qwen/Qwen3.8-27B',
      checkedAt: '2026-10-06',
      note: 'Dense model. config.json -> text_config; KV estimate conservatively counts all 64 layers.'
    }
  },
  {
    id: 'qwen-3-8-flash-next-125b',
    name: 'Qwen 3.8 Flash Next 125B',
    family: 'Qwen 3.8',
    architecture: 'Qwen4ExpForConditionalGeneration-moe',
    layers: 48,
    attentionHeads: 24,
    kvHeads: 2,
    headDim: 256,
    hiddenSize: 2560,
    contextWindow: 262144,
    totalParamsB: 125,
    activeParamsB: 6,
    moe: {
      totalExperts: 512,
      expertsPerToken: 10
    },
    source: {
      url: 'https://huggingface.co/Qwen/Qwen3.8-Flash-Next',
      checkedAt: '2026-10-06',
      note: 'MoE: 125B total / 6B active per model card. config.json -> text_config.'
    }
  },
  {
    id: 'llama-3.1-8b',
    name: 'Llama-3.1-8B-Instruct',
    family: 'Llama 3.1',
    architecture: 'decoder-transformer',
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDim: 128,
    hiddenSize: 4096,
    contextWindow: 131072,
    totalParamsB: 8.03,
    activeParamsB: 8.03,
    source: {
      url: 'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct',
      checkedAt: '2026-10-06',
      note: 'Model card and config metadata'
    }
  },
  {
    id: 'mistral-7b-v0.3',
    name: 'Mistral-7B-Instruct-v0.3',
    family: 'Mistral',
    architecture: 'decoder-transformer',
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDim: 128,
    hiddenSize: 4096,
    contextWindow: 32768,
    totalParamsB: 7.24,
    activeParamsB: 7.24,
    source: {
      url: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3',
      checkedAt: '2026-10-06',
      note: 'Model card and config metadata'
    }
  },
  {
    id: 'qwen2.5-72b',
    name: 'Qwen2.5-72B-Instruct',
    family: 'Qwen2.5',
    architecture: 'decoder-transformer',
    layers: 80,
    attentionHeads: 64,
    kvHeads: 8,
    headDim: 128,
    hiddenSize: 8192,
    contextWindow: 32768,
    totalParamsB: 72.7,
    activeParamsB: 72.7,
    source: {
      url: 'https://huggingface.co/Qwen/Qwen2.5-72B-Instruct',
      checkedAt: '2026-10-06',
      note: 'Model card and config metadata'
    }
  },
  {
    id: 'gemma-2-9b',
    name: 'Gemma-2-9B-It',
    family: 'Gemma 2',
    architecture: 'decoder-transformer',
    layers: 42,
    attentionHeads: 16,
    kvHeads: 8,
    headDim: 256,
    hiddenSize: 4096,
    contextWindow: 8192,
    totalParamsB: 9.24,
    activeParamsB: 9.24,
    source: {
      url: 'https://huggingface.co/google/gemma-2-9b-it',
      checkedAt: '2026-10-06',
      note: 'Model card and config metadata'
    }
  }
]

export const MODEL_BY_ID: Record<string, LlmModelSpec> = Object.fromEntries(
  MODEL_SPECS.map((model) => [model.id, model])
)
