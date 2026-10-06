# llmram

[![CI](https://github.com/hoipo/llmram/actions/workflows/ci.yml/badge.svg)](https://github.com/hoipo/llmram/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Tiny open-source TypeScript library + CLI to estimate LLM VRAM/RAM usage and rough tokens/sec.

👉 **Try the web calculator at https://llmram.com**

- Example model page: [Qwen 3.8 27B VRAM requirements](https://llmram.com/models/qwen-3-8-27b)
- Example model page: [Mistral 7B Instruct v0.3 VRAM requirements](https://llmram.com/models/mistral-7b-instruct-v0-3)
- Example GPU page: [What LLMs can an RTX 4090 run?](https://llmram.com/gpu/rtx-4090)

## Quick start

Not published to npm yet. Install from GitHub or clone the repo:

```bash
npm i github:hoipo/llmram
# or
git clone https://github.com/hoipo/llmram && cd llmram && npm install && npm run build
```

### CLI

From a clone (after `npm run build`):

```bash
node dist/cli.cjs qwen-3-8-27b --quant q4_k_m --ctx 16384 --gpu rtx-4090
```

Or, once installed as a dependency:

```bash
npx llmram qwen-3-8-27b --quant q4_k_m --ctx 16384 --gpu rtx-4090
```

List built-in data:

```bash
npx llmram --list-models
npx llmram --list-hardware
```

### API

```ts
import {
  MODEL_BY_ID,
  HARDWARE_BY_ID,
  QUANTIZATION_BY_ID,
  estimateMemory,
  checkFitsOnDevice,
  estimateTokensPerSecond,
  recommendQuantization
} from 'llmram'

const model = MODEL_BY_ID['qwen-3-8-27b']
const hardware = HARDWARE_BY_ID['rtx-4090']
const quantization = QUANTIZATION_BY_ID.q4_k_m

const estimate = estimateMemory({
  model,
  quantization,
  contextTokens: 16384,
  batchSize: 1
})

const fit = checkFitsOnDevice({
  estimate,
  hardware,
  reserveGB: 1
})

const tps = estimateTokensPerSecond({
  model,
  quantization,
  hardware
})

const recommended = recommendQuantization({
  model,
  hardware,
  contextTokens: 16384
})

console.log({ estimate, fit, tps, recommended: recommended.recommended?.id })
```

## Formula and assumptions

`llmram` intentionally uses transparent, fast heuristics:

1. **Weights memory (bytes)**  
   `residentParams * effectiveBits / 8`
   - For MoE models, `residentParams = TOTAL params` (all experts stay resident, not just the active ones)
   - For dense models, `residentParams = TOTAL params` too
2. **KV cache memory (bytes)**  
   `2 * layers * kvHeads * headDim * kvBytes * context * batch`
3. **Runtime overhead (GB)**  
   `0.5 + 0.05 * weightsGB + 0.02 * kvGB`
4. **Tokens/sec (estimate only)**  
   `bandwidthBytesPerSec * efficiency / (activeParams * effectiveBits / 8)`
   - Uses **ACTIVE params** for MoE throughput estimate
   - Labelled as rough estimate, not benchmark replacement

## Supported models (bundled)

| id | total params | active params | source |
| --- | ---: | ---: | --- |
| qwen-3-8-27b | 27B | 27B (dense) | https://huggingface.co/Qwen/Qwen3.8-27B |
| qwen-3-8-flash-next-125b | 125B | 6B (MoE) | https://huggingface.co/Qwen/Qwen3.8-Flash-Next |
| llama-3.1-8b | 8.03B | 8.03B | https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct |
| mistral-7b-v0.3 | 7.24B | 7.24B | https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3 |
| qwen2.5-72b | 72.7B | 72.7B | https://huggingface.co/Qwen/Qwen2.5-72B-Instruct |
| gemma-2-9b | 9.24B | 9.24B | https://huggingface.co/google/gemma-2-9b-it |

All model sources are stored with `checkedAt` dates in `src/data/models.ts`.

## Supported hardware (bundled)

Includes:

- NVIDIA GPUs (e.g. RTX 4090, A100, H100)
- Apple Silicon unified-memory profiles (M2 Max, M3 Max)

Each hardware entry includes official spec links + `checkedAt` in `src/data/hardware.ts`.

## Add a model from Hugging Face config.json

Use the helper script to generate a model entry scaffold:

```bash
npx tsx scripts/add-model-from-hf.ts \
  --id qwen-custom \
  --name "Qwen Custom" \
  --family Qwen \
  --repo Qwen/Qwen3.8-27B \
  --total-params-b 27
```

Programmatic helper:

```ts
import { buildModelFromHfConfig } from 'llmram'
```

## Development

```bash
npm install
npm run lint
npm run test
npm run build
```

## License

MIT © Potter
