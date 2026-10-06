import {
  HARDWARE_BY_ID,
  HARDWARE_SPECS,
  MODEL_BY_ID,
  MODEL_SPECS,
  QUANTIZATION_BY_ID,
  QUANTIZATIONS,
  checkFitsOnDevice,
  estimateMemory,
  estimateTokensPerSecond,
  recommendQuantization
} from './index'
import { renderTable } from './cli-table'

export function runCli(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || hasFlag({ args, flag: '--help' })) {
    printHelp()
    return
  }

  if (hasFlag({ args, flag: '--list-models' })) {
    printModels()
    return
  }

  if (hasFlag({ args, flag: '--list-hardware' })) {
    printHardware()
    return
  }

  const modelId = args[0]
  if (!modelId) {
    printHelp()
    return
  }

  const model = MODEL_BY_ID[modelId]

  if (!model) {
    console.error(`Unknown model "${modelId}". Use --list-models to see valid ids.`)
    process.exitCode = 1
    return
  }

  const quantOption = getOptionValue({ args, flag: '--quant' })
  if (quantOption.error) {
    console.error(quantOption.error)
    process.exitCode = 1
    return
  }
  const quantId = quantOption.value ?? 'q4_k_m'
  const quantization = QUANTIZATION_BY_ID[quantId]

  if (!quantization) {
    console.error(`Unknown quant "${quantId}". Valid ids: ${QUANTIZATIONS.map((item) => item.id).join(', ')}`)
    process.exitCode = 1
    return
  }

  const contextOption = getOptionValue({ args, flag: '--ctx' })
  if (contextOption.error) {
    console.error(contextOption.error)
    process.exitCode = 1
    return
  }
  const contextTokens = parsePositiveInteger({
    value: contextOption.value ?? `${model.contextWindow}`,
    flag: '--ctx'
  })
  if (contextTokens === null) {
    process.exitCode = 1
    return
  }

  const batchOption = getOptionValue({ args, flag: '--batch' })
  if (batchOption.error) {
    console.error(batchOption.error)
    process.exitCode = 1
    return
  }
  const batchSize = parsePositiveInteger({
    value: batchOption.value ?? '1',
    flag: '--batch'
  })
  if (batchSize === null) {
    process.exitCode = 1
    return
  }

  const reserveOption = getOptionValue({ args, flag: '--reserve' })
  if (reserveOption.error) {
    console.error(reserveOption.error)
    process.exitCode = 1
    return
  }
  const reserveGB = parseNonNegativeNumber({
    value: reserveOption.value ?? '1',
    flag: '--reserve'
  })
  if (reserveGB === null) {
    process.exitCode = 1
    return
  }

  const gpuOption = getOptionValue({ args, flag: '--gpu' })
  if (gpuOption.error) {
    console.error(gpuOption.error)
    process.exitCode = 1
    return
  }
  const gpuId = gpuOption.value
  const hardware = gpuId ? HARDWARE_BY_ID[gpuId] : undefined
  if (gpuId && !hardware) {
    console.error(`Unknown hardware "${gpuId}". Use --list-hardware to see valid ids.`)
    process.exitCode = 1
    return
  }

  const estimate = estimateMemory({
    model,
    quantization,
    contextTokens,
    batchSize
  })

  const tableRows = [
    ['Model', `${model.name} (${model.id})`],
    ['Quantization', `${quantization.label} (${quantization.id}, ${formatNumber({ value: quantization.effectiveBits, digits: 2 })} bits)`],
    ['Resident params', `${formatNumber({ value: estimate.residentParamsB, digits: 2 })}B`],
    ['Active params', `${formatNumber({ value: estimate.activeParamsB, digits: 2 })}B`],
    ['Weights', `${formatNumber({ value: estimate.weightMemoryGB, digits: 2 })} GB`],
    ['KV cache', `${formatNumber({ value: estimate.kvCacheGB, digits: 2 })} GB`],
    ['Runtime overhead', `${formatNumber({ value: estimate.runtimeOverheadGB, digits: 2 })} GB`],
    ['Total memory', `${formatNumber({ value: estimate.totalMemoryGB, digits: 2 })} GB`]
  ]

  if (hardware) {
    const fit = checkFitsOnDevice({
      estimate,
      hardware,
      reserveGB
    })
    const tps = estimateTokensPerSecond({
      model,
      quantization,
      hardware
    })
    const recommendation = recommendQuantization({
      model,
      hardware,
      contextTokens,
      batchSize,
      reserveGB
    })

    tableRows.push(['Hardware', `${hardware.name} (${hardware.id})`])
    tableRows.push(['Available after reserve', `${formatNumber({ value: fit.availableMemoryGB, digits: 2 })} GB`])
    tableRows.push(['Fits', fit.fits ? 'yes' : `no (needs +${formatNumber({ value: fit.deficitGB, digits: 2 })} GB)`])
    tableRows.push(['Est. tokens/sec', `${formatNumber({ value: tps.tokensPerSecond, digits: 1 })} tok/s (estimate)`])
    tableRows.push(['Recommended quant', recommendation.recommended ? recommendation.recommended.id : 'none fits'])
  }

  console.log(renderTable({
    headers: ['Metric', 'Value'],
    rows: tableRows
  }))
}

function printHelp(): void {
  const help = `
llmram - estimate LLM memory needs and rough tokens/sec

Usage:
  llmram <model-id> [options]

Examples:
  llmram qwen-3-8-27b --quant q4_k_m --ctx 32768 --gpu rtx-4090
  llmram llama-3.1-8b --quant q8_0 --ctx 8192 --gpu m2-max-64gb

Options:
  --quant <id>       Quantization id (default: q4_k_m)
  --ctx <tokens>     Context length tokens (default: model context)
  --batch <n>        Batch size (default: 1)
  --gpu <id>         Hardware id for fit and tokens/sec estimate
  --reserve <gb>     Reserved memory not used by model (default: 1)
  --list-models      List built-in models
  --list-hardware    List built-in hardware
  --help             Show this help
`

  console.log(help.trim())
}

function printModels(): void {
  const rows = MODEL_SPECS.map((model) => [
    model.id,
    model.name,
    `${formatNumber({ value: model.totalParamsB, digits: 2 })}B`,
    `${formatNumber({ value: model.activeParamsB, digits: 2 })}B`,
    model.source.url
  ])

  console.log(renderTable({
    headers: ['id', 'name', 'total params', 'active params', 'source'],
    rows
  }))
}

function printHardware(): void {
  const rows = HARDWARE_SPECS.map((hardware) => [
    hardware.id,
    hardware.name,
    `${formatNumber({ value: hardware.memoryGB, digits: 0 })} GB`,
    `${formatNumber({ value: hardware.bandwidthGBps, digits: 0 })} GB/s`,
    hardware.source.url
  ])

  console.log(renderTable({
    headers: ['id', 'name', 'memory', 'bandwidth', 'source'],
    rows
  }))
}

interface HasFlagInput {
  args: string[]
  flag: string
}

function hasFlag(input: HasFlagInput): boolean {
  const { args, flag } = input
  return args.includes(flag)
}

interface GetOptionValueInput {
  args: string[]
  flag: string
}

interface GetOptionValueResult {
  value?: string
  error?: string
}

function getOptionValue(input: GetOptionValueInput): GetOptionValueResult {
  const { args, flag } = input
  const flagIndex = args.indexOf(flag)
  if (flagIndex === -1)
    return {}

  const value = args[flagIndex + 1]
  if (!value || value.startsWith('--'))
    return { error: `${flag} requires a value` }

  return { value }
}

interface ParsePositiveIntegerInput {
  value: string
  flag: string
}

function parsePositiveInteger(input: ParsePositiveIntegerInput): number | null {
  const { value, flag } = input

  if (!/^\d+$/.test(value)) {
    console.error(`${flag} must be a positive integer`)
    return null
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    console.error(`${flag} must be a positive integer`)
    return null
  }

  return parsed
}

interface ParseNonNegativeNumberInput {
  value: string
  flag: string
}

function parseNonNegativeNumber(input: ParseNonNegativeNumberInput): number | null {
  const { value, flag } = input

  if (!/^\d+(\.\d+)?$/.test(value)) {
    console.error(`${flag} must be a non-negative number`)
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.error(`${flag} must be a non-negative number`)
    return null
  }

  return parsed
}

interface FormatNumberInput {
  value: number
  digits: number
}

function formatNumber(input: FormatNumberInput): string {
  const { value, digits } = input
  return value.toFixed(digits)
}
