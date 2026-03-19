import { NextResponse } from 'next/server'
import {
  buildPublicAppConfig,
  getServerAppConfig,
} from '../../../lib/appConfig'
import { getCachedGenerationMetadata } from '../../../lib/generation/metadataCache'
import {
  applySessionCookie,
  completeGeneration,
  getSessionContext,
  getUsageSnapshot,
  releaseGeneration,
  reserveGeneration,
} from '../../../lib/generation/sessionStore'
import { buildPrompt, sanitizeOptionalNote } from '../../../lib/promptBuilder'
import {
  generateConceptImage,
  getDefaultProviderId,
  getProvider,
} from '../../../lib/generation/providers'
import {
  saveConceptRecord,
  saveUsageRecord,
} from '../../../lib/supabaseAdmin'

function buildResponse(payload, { status = 200, sessionContext } = {}) {
  const response = NextResponse.json(payload, { status })

  if (sessionContext?.shouldSetCookie) {
    applySessionCookie(response, sessionContext.sessionId)
  }

  return response
}

function buildPromptPayload(prompt, providerId, imageQuality) {
  return getCachedGenerationMetadata(
    `${prompt.cacheKey}|${providerId}|${imageQuality}`,
    () => ({
      summary: prompt.summary,
      preview: prompt.preview,
      cacheKey: prompt.cacheKey,
      quality: imageQuality,
      optionalNote: prompt.optionalNote,
      preserveLayout: prompt.preserveLayout,
    })
  )
}

function getStyleLabel(promptSummary) {
  return String(promptSummary || '').split(' · ')[0] || null
}

async function persistConceptAndUsage({
  sessionId,
  companySlug,
  leadDestination,
  providerId,
  status,
  usage,
  prompt,
  imageQuality,
  result,
}) {
  let conceptRecord = null

  try {
    conceptRecord = await saveConceptRecord({
      sessionId,
      companySlug,
      leadDestination,
      provider: providerId,
      mode: result.isDemo ? 'demo' : 'live',
      quality: imageQuality,
      styleId: result.styleId,
      styleLabel: getStyleLabel(prompt.summary),
      modifiers: result.modifiers,
      preserveLayout: result.preserveLayout,
      optionalNote: prompt.optionalNote,
      promptSummary: prompt.summary,
      promptCacheKey: prompt.cacheKey,
      imageUrl: result.imageUrl,
      meta: result.meta,
    })
  } catch (persistError) {
    console.error('Supabase concept persistence failed:', persistError)
  }

  try {
    await saveUsageRecord({
      sessionId,
      conceptId: conceptRecord?.id || null,
      companySlug,
      eventType: 'generation',
      status,
      provider: providerId,
      styleId: result.styleId,
      modifiers: result.modifiers,
      preserveLayout: result.preserveLayout,
      optionalNote: prompt.optionalNote,
      completedGenerations: usage.completedGenerations,
      remainingGenerations: usage.remainingGenerations,
      maxFreeGenerations: usage.maxFreeGenerations,
      cooldownRemainingSeconds: usage.cooldownRemainingSeconds,
      errorCode: null,
    })
  } catch (persistError) {
    console.error('Supabase usage persistence failed:', persistError)
  }

  return conceptRecord
}

async function persistUsageFailure({
  sessionId,
  companySlug,
  providerId,
  styleId,
  modifiers,
  preserveLayout,
  optionalNote,
  usage,
  error,
  status,
}) {
  try {
    await saveUsageRecord({
      sessionId,
      conceptId: null,
      companySlug,
      eventType: 'generation',
      status,
      provider: providerId,
      styleId,
      modifiers,
      preserveLayout,
      optionalNote,
      completedGenerations: usage?.completedGenerations,
      remainingGenerations: usage?.remainingGenerations,
      maxFreeGenerations: usage?.maxFreeGenerations,
      cooldownRemainingSeconds: usage?.cooldownRemainingSeconds,
      errorCode: error?.code || error?.status || 'GENERATION_ERROR',
    })
  } catch (persistError) {
    console.error('Supabase failure usage persistence failed:', persistError)
  }
}

export async function POST(request) {
  const config = getServerAppConfig()
  const publicConfig = buildPublicAppConfig(config)
  const sessionContext = getSessionContext(request)
  const { sessionId } = sessionContext
  let lockAcquired = false
  let providerId = null
  let styleId = null
  let modifiers = []
  let preserveLayout = 'strong'
  let sanitizedOptionalNote = ''
  let companySlug = 'public'
  let leadDestination = null

  try {
    const body = await request.json()
    const { imageBase64, provider, optionalNote = '' } = body
    styleId = body.styleId
    modifiers = Array.isArray(body.modifiers) ? body.modifiers : []
    preserveLayout = body.preserveLayout || 'strong'
    companySlug = String(body.companySlug || 'public').trim() || 'public'
    leadDestination =
      body.leadDestination && typeof body.leadDestination === 'object'
        ? body.leadDestination
        : null
    // Free users cannot send arbitrary prompt text. The server only accepts preset style/modifier inputs.
    // Optional notes are sanitised and treated as a minor preference only.
    // Free users default to strong layout preservation unless a controlled override is introduced later.
    providerId = provider || getDefaultProviderId()
    const providerConfig = getProvider(providerId)
    sanitizedOptionalNote = sanitizeOptionalNote(optionalNote)

    if (!imageBase64) {
      return buildResponse(
        {
          error: 'Missing imageBase64',
          usage: getUsageSnapshot(sessionId, config),
          config: publicConfig,
        },
        { status: 400, sessionContext }
      )
    }

    if (!providerConfig) {
      return buildResponse(
        {
          error: `Unknown provider: ${providerId}`,
          usage: getUsageSnapshot(sessionId, config),
          config: publicConfig,
        },
        { status: 400, sessionContext }
      )
    }

    reserveGeneration(sessionId, config)
    lockAcquired = true

    const imageQuality = config.FREE_IMAGE_QUALITY
    const prompt = buildPrompt(styleId, modifiers, preserveLayout, sanitizedOptionalNote)
    const promptPayload = buildPromptPayload(prompt, providerId, imageQuality)

    if (!providerConfig.isConfigured()) {
      const usage = completeGeneration(sessionId, config)
      const conceptRecord = await persistConceptAndUsage({
        sessionId,
        companySlug,
        leadDestination,
        providerId,
        status: 'demo',
        usage,
        prompt,
        imageQuality,
        result: {
          imageUrl: imageBase64,
          isDemo: true,
          meta: {
            provider: providerConfig.id,
            mode: 'demo',
            quality: imageQuality,
          },
          styleId,
          modifiers,
          preserveLayout,
        },
      })

      return buildResponse(
        {
          imageUrl: imageBase64,
          isDemo: true,
          conceptId: conceptRecord?.id || null,
          prompt: promptPayload,
          usage,
          config: publicConfig,
          meta: {
            provider: providerConfig.id,
            mode: 'demo',
            quality: imageQuality,
          },
        },
        { sessionContext }
      )
    }

    const result = await generateConceptImage({
      provider: providerId,
      imageBase64,
      prompt,
      quality: imageQuality,
    })

    const usage = completeGeneration(sessionId, config)
    const conceptRecord = await persistConceptAndUsage({
      sessionId,
      companySlug,
      leadDestination,
      providerId,
      status: 'completed',
      usage,
      prompt,
      imageQuality,
      result: {
        ...result,
        styleId,
        modifiers,
        preserveLayout,
      },
    })

    return buildResponse(
      {
        ...result,
        conceptId: conceptRecord?.id || null,
        prompt: promptPayload,
        usage,
        config: publicConfig,
      },
      { sessionContext }
    )
  } catch (error) {
    console.error('Generate route error:', error)

    const usage = lockAcquired
      ? releaseGeneration(sessionId, config)
      : getUsageSnapshot(sessionId, config)

    await persistUsageFailure({
      sessionId,
      companySlug,
      providerId,
      styleId,
      modifiers,
      preserveLayout,
      optionalNote: sanitizedOptionalNote,
      usage: error.usage || usage,
      error,
      status: lockAcquired ? 'error' : 'blocked',
    })

    return buildResponse(
      {
        error: error.message || 'Internal server error',
        code: error.code || 'GENERATION_ERROR',
        usage: error.usage || usage,
        config: publicConfig,
      },
      {
        status: error.status || 500,
        sessionContext,
      }
    )
  }
}

export async function GET(request) {
  const config = getServerAppConfig()
  const publicConfig = buildPublicAppConfig(config)
  const sessionContext = getSessionContext(request)

  return buildResponse(
    {
      usage: getUsageSnapshot(sessionContext.sessionId, config),
      config: publicConfig,
    },
    { sessionContext }
  )
}
