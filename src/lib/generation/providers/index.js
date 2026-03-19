import { anthropicProvider } from './anthropic'
import { geminiProvider } from './gemini'

const DEFAULT_PROVIDER = 'gemini'
const MAX_PROVIDER_ATTEMPTS = 2

const PROVIDERS = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
}

function normaliseProviderId(providerId) {
  return String(providerId || '').trim().toLowerCase()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getDefaultProviderId() {
  // Gemini is the default provider for prompt orchestration and image generation for now.
  // Swap this default when another provider is ready.
  return normaliseProviderId(process.env.GENERATION_PROVIDER) || DEFAULT_PROVIDER
}

export function getProvider(providerId) {
  return PROVIDERS[normaliseProviderId(providerId)]
}

export async function generateConceptImage({ provider, imageBase64, prompt }) {
  const providerConfig = getProvider(provider)

  if (!providerConfig) {
    const error = new Error(`Unknown provider: ${provider}`)
    error.status = 400
    throw error
  }

  let lastError

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      const result = await providerConfig.generate({ imageBase64, prompt })

      return {
        ...result,
        meta: {
          ...result.meta,
          attempts: attempt,
        },
      }
    } catch (error) {
      lastError = error
      if (!error.retryable || attempt === MAX_PROVIDER_ATTEMPTS) {
        break
      }

      await sleep(250 * attempt)
    }
  }

  throw lastError
}
