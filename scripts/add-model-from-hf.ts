import { writeFileSync } from 'node:fs'
import { buildModelFromHfConfig } from '../src/hf/build-model'
import type { HuggingFaceConfigLike } from '../src/types'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const id = getRequiredFlag({ args, flag: '--id' })
  const name = getRequiredFlag({ args, flag: '--name' })
  const family = getRequiredFlag({ args, flag: '--family' })
  const repo = getRequiredFlag({ args, flag: '--repo' })
  const totalParamsB = Number.parseFloat(getRequiredFlag({ args, flag: '--total-params-b' }))
  const activeParamsBValue = getOptionalFlag({ args, flag: '--active-params-b' })
  const activeParamsB = activeParamsBValue ? Number.parseFloat(activeParamsBValue) : totalParamsB
  const sourceDate = getOptionalFlag({ args, flag: '--source-date' }) ?? new Date().toISOString().slice(0, 10)
  const outputPath = getOptionalFlag({ args, flag: '--out' })

  if (Number.isNaN(totalParamsB) || totalParamsB <= 0)
    throw new Error('--total-params-b must be a positive number')
  if (Number.isNaN(activeParamsB) || activeParamsB <= 0)
    throw new Error('--active-params-b must be a positive number')

  const configUrl = `https://huggingface.co/${repo}/resolve/main/config.json`
  const response = await fetch(configUrl)
  if (!response.ok)
    throw new Error(`Failed to fetch ${configUrl} (${response.status})`)

  const config = (await response.json()) as HuggingFaceConfigLike
  const model = buildModelFromHfConfig({
    id,
    name,
    family,
    hfRepo: repo,
    sourceDate,
    config,
    totalParamsB,
    activeParamsB
  })

  const output = `${JSON.stringify(model, null, 2)}\n`
  if (outputPath) {
    writeFileSync(outputPath, output, 'utf8')
    console.log(`Wrote model entry to ${outputPath}`)
    return
  }

  console.log(output)
}

interface FlagInput {
  args: string[]
  flag: string
}

function getRequiredFlag(input: FlagInput): string {
  const value = getOptionalFlag(input)
  if (!value)
    throw new Error(`Missing required flag: ${input.flag}`)

  return value
}

function getOptionalFlag(input: FlagInput): string | undefined {
  const { args, flag } = input
  const index = args.indexOf(flag)
  if (index === -1)
    return undefined

  const value = args[index + 1]
  if (!value || value.startsWith('--'))
    return undefined

  return value
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(`add-model-from-hf failed: ${message}`)
  process.exitCode = 1
})
