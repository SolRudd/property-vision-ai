import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
import { getSupabaseAuthState } from '../../../lib/supabaseAuth'
import { uploadConceptImageAsset } from '../../../lib/supabaseStorage'

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

function buildAuthPayload(authState) {
  return {
    enabled: Boolean(authState?.enabled),
    signedIn: Boolean(authState?.user),
    email: authState?.user?.email || null,
  }
}

async function persistConceptAndUsage({
  sessionId,
  userId,
  companySlug,
  leadDestination,
  providerId,
  status,
  usage,
  prompt,
  imageQuality,
  originalImageBase64,
  result,
}) {
  let conceptRecord = null
  let storageMeta = null

  try {
    const sourceAsset = await uploadConceptImageAsset({
      dataUrl: originalImageBase64,
      kind: 'source',
      userId,
      sessionId,
      companySlug,
    })
    const resultAsset =
      result.imageUrl === originalImageBase64 && sourceAsset
        ? sourceAsset
        : await uploadConceptImageAsset({
            dataUrl: result.imageUrl,
            kind: 'result',
            userId,
            sessionId,
            companySlug,
          })

    if (sourceAsset || resultAsset) {
      storageMeta = {
        source: sourceAsset || null,
        result: resultAsset || null,
      }
    }
  } catch (storageError) {
    console.error('Supabase concept image upload failed:', storageError)
  }

  try {
    conceptRecord = await saveConceptRecord({
      sessionId,
      userId,
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
      meta: storageMeta
        ? {
            ...(result.meta || {}),
            storage: storageMeta,
          }
        : result.meta,
    })
  } catch (persistError) {
    console.error('Supabase concept persistence failed:', persistError)
  }

  try {
    await saveUsageRecord({
      sessionId,
      userId,
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
  userId,
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
      userId,
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
  const authState = await getSupabaseAuthState(cookies())
  const auth = buildAuthPayload(authState)
  const { sessionId } = sessionContext
  let lockAcquired = false
  let providerId = null
  let styleId = null
  let modifiers = []
  let preserveLayout = 'strong'
  let sanitizedOptionalNote = ''
  let companySlug = 'public'
  let leadDestination = null
  let userId = authState.user?.id || null
  let originalImageBase64 = null

  try {
    const body = await request.json()
    const { imageBase64, originalImageBase64: sourceImageBase64, provider, optionalNote = '' } = body
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
    originalImageBase64 =
      typeof sourceImageBase64 === 'string' && sourceImageBase64.startsWith('data:image/')
        ? sourceImageBase64
        : imageBase64

    if (!auth.enabled) {
      const usage = getUsageSnapshot(sessionId, config)

      await persistUsageFailure({
        sessionId,
        userId: null,
        companySlug,
        providerId,
        styleId,
        modifiers,
        preserveLayout,
        optionalNote: sanitizedOptionalNote,
        usage,
        error: {
          code: 'AUTH_UNAVAILABLE',
        },
        status: 'blocked',
      })

      return buildResponse(
        {
          error: 'Account access is not configured yet. Please try again later.',
          code: 'AUTH_UNAVAILABLE',
          usage,
          config: publicConfig,
          auth,
        },
        { status: 503, sessionContext }
      )
    }

    if (!authState.user) {
      const usage = getUsageSnapshot(sessionId, config)

      await persistUsageFailure({
        sessionId,
        userId: null,
        companySlug,
        providerId,
        styleId,
        modifiers,
        preserveLayout,
        optionalNote: sanitizedOptionalNote,
        usage,
        error: {
          code: 'AUTH_REQUIRED',
        },
        status: 'blocked',
      })

      return buildResponse(
        {
          error: 'Please sign in to create free landscaping concepts.',
          code: 'AUTH_REQUIRED',
          usage,
          config: publicConfig,
          auth,
        },
        { status: 401, sessionContext }
      )
    }

    if (!imageBase64) {
      return buildResponse(
        {
          error: 'Missing imageBase64',
          usage: getUsageSnapshot(sessionId, config),
          config: publicConfig,
          auth,
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
          auth,
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
        userId,
        companySlug,
        leadDestination,
        providerId,
        status: 'demo',
        usage,
        prompt,
        imageQuality,
        originalImageBase64,
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
          auth,
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
      userId,
      companySlug,
      leadDestination,
      providerId,
      status: 'completed',
      usage,
      prompt,
      imageQuality,
      originalImageBase64,
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
        auth,
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
      userId,
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
        auth,
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
  const authState = await getSupabaseAuthState(cookies())

  return buildResponse(
    {
      usage: getUsageSnapshot(sessionContext.sessionId, config),
      config: publicConfig,
      auth: buildAuthPayload(authState),
    },
    { sessionContext }
  )
}
