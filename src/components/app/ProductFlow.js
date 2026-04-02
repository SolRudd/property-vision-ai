'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import BrandMark from '../BrandMark'
import { CLIENT_APP_CONFIG, getResizeSettings } from '../../lib/appConfig'
import { OPTIONAL_NOTE_MAX_LENGTH, sanitizeOptionalNote } from '../../lib/promptBuilder'
import {
  getPublicExperienceConfig,
  resolveExperienceConfig,
} from '../../lib/companyConfigs'
import { STYLES } from '../../lib/stylesCatalog'

const EMPTY_LEAD = { name: '', email: '', postcode: '', phone: '', notes: '' }

const MODIFIERS = [
  { id: 'more-premium', label: 'More premium' },
  { id: 'more-planting', label: 'More planting' },
  { id: 'lower-maintenance', label: 'Lower maintenance' },
  { id: 'more-patio', label: 'More patio' },
]

const PRESERVE_LAYOUT_OPTIONS = [
  { id: 'strong', label: 'Strict', desc: 'Preserve geometry and boundaries as closely as possible' },
  { id: 'medium', label: 'Balanced', desc: 'Allow modest refinement while keeping the same structure' },
  { id: 'loose', label: 'Bolder', desc: 'Permit more visible styling changes within the same property' },
]

const VARIATIONS = [
  { id: 'more-premium', label: 'More premium' },
  { id: 'more-natural', label: 'More natural' },
  { id: 'more-practical', label: 'More practical' },
]

const STYLE_IDS = new Set(STYLES.map((style) => style.id))
const MODIFIER_IDS = new Set([
  ...MODIFIERS.map((modifier) => modifier.id),
  ...VARIATIONS.map((variation) => variation.id),
])
const PRESERVE_LAYOUT_IDS = new Set(PRESERVE_LAYOUT_OPTIONS.map((option) => option.id))
const COMPARE_TABS = new Set(['before', 'after'])
const VARIATION_IDS = new Set(VARIATIONS.map((variation) => variation.id))
const STYLE_LABELS = Object.fromEntries(STYLES.map((style) => [style.id, style.label]))
const MODIFIER_COMMENTARY = {
  'more-premium': 'richer hardscape materials and a more tailored finish',
  'more-planting': 'deeper planting layers and softer green structure',
  'lower-maintenance': 'practical planting choices with cleaner upkeep',
  'more-patio': 'a stronger patio focus for outdoor living',
  'more-natural': 'a softer, more natural planting character',
  'more-practical': 'more usable circulation and everyday practicality',
}
const PRESERVE_LAYOUT_COMMENTARY = {
  strong: 'The layout is kept closely aligned to the original property, so the concept feels realistic and immediately relatable.',
  medium: 'The layout is refined carefully, balancing stronger design moves with the original site structure.',
  loose: 'The layout takes a slightly bolder design direction while staying recognisably true to the same property.',
}

const GEN_STAGES = [
  'Analysing your outdoor space…',
  'Interpreting your style choices…',
  'Composing landscaping concept…',
  'Generating visual preview…',
  'Applying finishing details…',
]

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])
const HEIC_EXTENSION_PATTERN = /\.(heic|heif)$/i

function buildJourneyMetaKey(landingKey) {
  return `gv-journey-meta-v1:${landingKey}`
}

function buildJourneyAssetKey(landingKey) {
  return `gv-journey-assets-v1:${landingKey}`
}

function buildThemeStyle(theme) {
  return {
    '--gv-bg': theme.background,
    '--gv-ink': theme.ink,
    '--gv-dark': theme.dark,
    '--gv-dark-hover': theme.darkHover,
    '--gv-accent': theme.accent,
    '--gv-accent-soft': theme.accentSoft,
    '--gv-accent-muted': theme.accentMuted,
    '--gv-surface': theme.surface,
    '--gv-surface-muted': theme.surfaceMuted,
    '--gv-border': theme.border,
    '--gv-subtle': theme.subtle,
    '--gv-subtle-muted': theme.subtleMuted,
    '--gv-cream': theme.cream,
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normaliseStyleId(value) {
  return typeof value === 'string' && STYLE_IDS.has(value) ? value : null
}

function normaliseModifierIds(value, max = 4) {
  if (!Array.isArray(value)) return []

  return value
    .filter((modifier) => typeof modifier === 'string' && MODIFIER_IDS.has(modifier))
    .slice(0, max)
}

function normalisePreserveLayout(value) {
  return typeof value === 'string' && PRESERVE_LAYOUT_IDS.has(value)
    ? value
    : 'strong'
}

function normaliseCompareTab(value) {
  return typeof value === 'string' && COMPARE_TABS.has(value) ? value : 'after'
}

function normaliseStoredResult(value) {
  if (!isRecord(value)) return null

  const imageUrl =
    typeof value.imageUrl === 'string' && value.imageUrl
      ? value.imageUrl
      : null

  if (!imageUrl) {
    return null
  }

  const prompt = isRecord(value.prompt)
    ? {
        ...value.prompt,
        summary:
          typeof value.prompt.summary === 'string' ? value.prompt.summary : null,
        preview:
          typeof value.prompt.preview === 'string' ? value.prompt.preview : null,
        preserveLayout: normalisePreserveLayout(
          value.prompt.preserveLayout || value.preserveLayout
        ),
      }
    : null

  return {
    ...value,
    imageUrl,
    isDemo: Boolean(value.isDemo),
    styleId: normaliseStyleId(value.styleId),
    modifiers: normaliseModifierIds(value.modifiers),
    preserveLayout: normalisePreserveLayout(value.preserveLayout),
    optionalNote: sanitizeOptionalNote(value.optionalNote || ''),
    prompt,
    meta: isRecord(value.meta) ? value.meta : {},
    conceptId: typeof value.conceptId === 'string' ? value.conceptId : null,
  }
}

function isQuotaExceededError(error) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  )
}

async function readJsonSafely(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function resizeImage(dataUrl, resizeSettings) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, resizeSettings.maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('This browser could not prepare your image. Please try another photo.'))
        return
      }

      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', resizeSettings.jpegQuality))
    }
    img.onerror = () => {
      reject(new Error('This image could not be prepared. Please try another photo.'))
    }
    img.src = dataUrl
  })
}

function isHeicLikeFile(file) {
  const fileType = String(file?.type || '').toLowerCase()
  const fileName = String(file?.name || '').toLowerCase()

  return HEIC_MIME_TYPES.has(fileType) || HEIC_EXTENSION_PATTERN.test(fileName)
}

function isAcceptedUploadFile(file) {
  if (!file) return false

  const fileType = String(file.type || '').toLowerCase()
  return fileType.startsWith('image/') || isHeicLikeFile(file)
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('This image could not be read. Please try another photo.'))
    reader.readAsDataURL(blob)
  })
}

async function normaliseUploadPreview(file) {
  if (!isHeicLikeFile(file)) {
    return {
      previewDataUrl: await readBlobAsDataUrl(file),
      convertedFromHeic: false,
    }
  }

  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })
    const convertedBlob = Array.isArray(converted) ? converted[0] : converted

    if (!(convertedBlob instanceof Blob)) {
      throw new Error('Unexpected HEIC conversion result')
    }

    return {
      // HEIC/HEIF is normalised to JPEG because browser support is inconsistent,
      // especially across iPhone upload flows and non-Safari browsers.
      previewDataUrl: await readBlobAsDataUrl(convertedBlob),
      convertedFromHeic: true,
    }
  } catch (error) {
    console.error('HEIC/HEIF conversion failed:', error)
    throw new Error(
      'This HEIC photo could not be prepared in this browser. Please try a different photo or export it as JPEG first.'
    )
  }
}

async function callGenerateAPI(
  imageBase64,
  styleId,
  modifiers,
  preserveLayout,
  optionalNote = '',
  companySlug = 'public',
  leadDestination = null
) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      styleId,
      modifiers,
      preserveLayout,
      optionalNote,
      companySlug,
      leadDestination,
    }),
  })

  const payload = await readJsonSafely(response)

  if (!response.ok) {
    const error = new Error(payload?.error || 'Generation failed')
    error.usage = payload?.usage
    error.code = payload?.code
    error.config = payload?.config
    throw error
  }

  if (!isRecord(payload)) {
    throw new Error('Generation service returned an unexpected response')
  }

  return payload
}

async function submitLeadAPI(data) {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const payload = await readJsonSafely(response)

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to submit lead')
  }

  return payload || { success: true }
}

function createInitialUsageState(config) {
  return {
    maxFreeGenerations: config.MAX_FREE_GENERATIONS,
    completedGenerations: 0,
    remainingGenerations: config.MAX_FREE_GENERATIONS,
    cooldownRemainingSeconds: 0,
    cooldownEndsAt: null,
    activeGeneration: false,
  }
}

function createInitialAuthState() {
  return {
    ready: false,
    enabled: false,
    signedIn: false,
    email: null,
  }
}

function normaliseStep(step, uploadedImage, selectedStyle, result) {
  if (step === 'lead' && result) return 'lead'
  if (step === 'result' && result) return 'result'
  if (selectedStyle && uploadedImage) return 'style'
  if (uploadedImage) return 'upload'
  return 'hero'
}

function resolveEntryStep(step, uploadedImage, selectedStyle, result, allowHero) {
  const nextStep = normaliseStep(step, uploadedImage, selectedStyle, result)
  return !allowHero && nextStep === 'hero' ? 'upload' : nextStep
}

function buildVariationModifiers(baseModifiers, variationId) {
  const cleaned = normaliseModifierIds(baseModifiers).filter(
    (modifier) => !VARIATION_IDS.has(modifier)
  )
  const trimmed = cleaned.slice(0, 2)
  return variationId ? [...trimmed, variationId] : trimmed
}

function buildDesignCommentary(styleId, modifiers = [], preserveLayout = 'strong') {
  const styleLabel = STYLE_LABELS[styleId] || 'selected'
  const modifierNotes = normaliseModifierIds(modifiers)
    .map((modifier) => MODIFIER_COMMENTARY[modifier])
    .filter(Boolean)
    .slice(0, 2)

  const emphasis = modifierNotes.length > 0
    ? `The ${styleLabel} direction introduces ${modifierNotes.join(' and ')}.`
    : `The ${styleLabel} direction focuses on premium materials, composed planting, and a polished exterior feel.`

  return `${emphasis} ${PRESERVE_LAYOUT_COMMENTARY[preserveLayout] || PRESERVE_LAYOUT_COMMENTARY.strong}`
}

export default function ProductFlow({
  experienceConfig,
  initialStep = 'hero',
  allowHero = true,
  basePath,
  initialSelectedStyle = null,
} = {}) {
  const resolvedConfig = resolveExperienceConfig(
    experienceConfig || getPublicExperienceConfig()
  )
  const initialRouteStep =
    !allowHero && initialStep === 'hero' ? 'upload' : initialStep
  const initialStyleId = normaliseStyleId(initialSelectedStyle)
  const landingPath =
    basePath || (resolvedConfig.slug === 'public' ? '/' : `/${resolvedConfig.slug}`)
  const authHref = `/auth?next=${encodeURIComponent(landingPath)}`
  const landingKey = resolvedConfig.slug || 'public'
  const journeyMetaKey = buildJourneyMetaKey(landingKey)
  const journeyAssetKey = buildJourneyAssetKey(landingKey)
  const themeStyle = buildThemeStyle(resolvedConfig.theme)
  const [runtimeConfig, setRuntimeConfig] = useState(CLIENT_APP_CONFIG)
  const [step, setStep] = useState(initialRouteStep)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [resizedImage, setResizedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(initialStyleId)
  const [selectedModifiers, setSelectedModifiers] = useState([])
  const [preserveLayout, setPreserveLayout] = useState('strong')
  const [optionalNote, setOptionalNote] = useState('')
  const [result, setResult] = useState(null)
  const [compareTab, setCompareTab] = useState('after')
  const [genStage, setGenStage] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [genError, setGenError] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadError, setLeadError] = useState(null)
  const [sessionUsage, setSessionUsage] = useState(createInitialUsageState(CLIENT_APP_CONFIG))
  const [authState, setAuthState] = useState(createInitialAuthState())
  const [lead, setLead] = useState(EMPTY_LEAD)

  const fileRef = useRef(null)
  const fileInputId = useId()
  const hasRestoredJourney = useRef(false)

  const remaining = sessionUsage.remainingGenerations
  const isGenerating = step === 'generating'

  useEffect(() => {
    if (!sessionUsage.cooldownEndsAt) return undefined

    const syncCooldown = () => {
      setSessionUsage((prev) => {
        if (!prev.cooldownEndsAt) return prev

        const remainingSeconds = Math.max(
          0,
          Math.ceil((prev.cooldownEndsAt - Date.now()) / 1000)
        )

        if (remainingSeconds === prev.cooldownRemainingSeconds) {
          return prev
        }

        return {
          ...prev,
          cooldownRemainingSeconds: remainingSeconds,
          cooldownEndsAt: remainingSeconds > 0 ? prev.cooldownEndsAt : null,
        }
      })
    }

    syncCooldown()
    const intervalId = window.setInterval(syncCooldown, 1000)

    return () => window.clearInterval(intervalId)
  }, [sessionUsage.cooldownEndsAt])

  useEffect(() => {
    let ignore = false

    fetch('/api/generate')
      .then((response) => readJsonSafely(response))
      .then((data) => {
        if (ignore) return
        if (data?.config) setRuntimeConfig(data.config)
        if (data?.usage) setSessionUsage(data.usage)
        if (data?.auth) {
          setAuthState({
            ready: true,
            enabled: Boolean(data.auth.enabled),
            signedIn: Boolean(data.auth.signedIn),
            email: data.auth.email || null,
          })
        } else {
          setAuthState((prev) => ({ ...prev, ready: true }))
        }
      })
      .catch(() => {
        if (!ignore) {
          setAuthState((prev) => ({ ...prev, ready: true }))
        }
      })

    return () => {
      ignore = true
    }
  }, [journeyAssetKey, journeyMetaKey])

  useEffect(() => {
    try {
      const storedMeta = window.localStorage.getItem(journeyMetaKey)
      const meta = storedMeta ? JSON.parse(storedMeta) : {}
      const nextSelectedStyle = normaliseStyleId(meta.selectedStyle)
      const nextSelectedModifiers = normaliseModifierIds(meta.selectedModifiers)
      const nextPreserveLayout = normalisePreserveLayout(meta.preserveLayout)
      const nextOptionalNote = sanitizeOptionalNote(meta.optionalNote || '')
      const nextCompareTab = normaliseCompareTab(meta.compareTab)

      // Legacy asset persistence stored large base64 payloads and can exceed browser quota.
      // Clear any previous sessionStorage asset key and keep only lightweight metadata.
      try {
        window.sessionStorage.removeItem(journeyAssetKey)
      } catch (storageError) {
        console.warn('Failed to clear legacy journey assets', storageError)
      }

      const restoredStyle = nextSelectedStyle || initialStyleId

      if (storedMeta) {
        setSelectedStyle(restoredStyle)
        setSelectedModifiers(nextSelectedModifiers)
        setPreserveLayout(nextPreserveLayout)
        setOptionalNote(nextOptionalNote)
        setCompareTab(nextCompareTab)
        setLeadSubmitted(Boolean(meta.leadSubmitted))
      } else if (initialStyleId) {
        setSelectedStyle(initialStyleId)
      }

      setStep(
        storedMeta
          ? resolveEntryStep(meta.step, null, restoredStyle, null, allowHero)
          : initialRouteStep
      )
    } catch (error) {
      console.warn('Failed to restore local journey state', error)
    } finally {
      hasRestoredJourney.current = true
    }
  }, [allowHero, initialRouteStep, initialStyleId, journeyAssetKey, journeyMetaKey])

  useEffect(() => {
    if (!hasRestoredJourney.current) return

    try {
      const shouldStoreMeta = Boolean(
        selectedStyle ||
        selectedModifiers.length > 0 ||
        optionalNote ||
        preserveLayout !== 'strong' ||
        compareTab !== 'after' ||
        leadSubmitted ||
        result
      )

      try {
        window.sessionStorage.removeItem(journeyAssetKey)
      } catch (storageError) {
        console.warn('Failed to clear legacy journey assets', storageError)
      }

      if (shouldStoreMeta) {
        window.localStorage.setItem(
          journeyMetaKey,
          JSON.stringify({
            selectedStyle,
            selectedModifiers,
            preserveLayout,
            optionalNote,
            compareTab,
            resultSummary: result?.prompt?.summary || null,
            leadSubmitted,
          })
        )
      } else {
        window.localStorage.removeItem(journeyMetaKey)
      }
    } catch (error) {
      if (isQuotaExceededError(error)) {
        try {
          window.sessionStorage.removeItem(journeyAssetKey)
        } catch {}
        console.warn('Skipped journey persistence because browser storage is full.', error)
        return
      }

      console.warn('Failed to persist local journey state', error)
    }
  }, [
    selectedStyle,
    selectedModifiers,
    preserveLayout,
    optionalNote,
    compareTab,
    result,
    leadSubmitted,
    journeyMetaKey,
    journeyAssetKey,
  ])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!isAcceptedUploadFile(file)) {
      setUploadError('Please use a JPG, PNG, WEBP, HEIC, or HEIF image.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Please use an image under 25MB.')
      return
    }

    setUploadError(null)
    setGenError(null)
    setLeadError(null)

    try {
      const { previewDataUrl } = await normaliseUploadPreview(file)
      const resized = await resizeImage(
        previewDataUrl,
        getResizeSettings(runtimeConfig.FREE_IMAGE_QUALITY)
      )

      // Keep the UI preview faithful to the uploaded photo, but use the resized
      // working image for Gemini generation requests to reduce payload cost.
      setUploadedImage(previewDataUrl)
      setResizedImage(resized)
      setResult(null)
      setLeadSubmitted(false)
      setCompareTab('after')
      setStep('style')
    } catch (error) {
      setUploadError(
        error.message || 'This photo could not be prepared. Please try another image.'
      )
    }
  }, [runtimeConfig.FREE_IMAGE_QUALITY])

  const openFilePicker = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const onDrop = useCallback((event) => {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files[0])
  }, [handleFile])

  const runGeneration = async ({
    modifiers = selectedModifiers,
    nextStyle = selectedStyle,
    nextPreserveLayout = preserveLayout,
    nextOptionalNote = optionalNote,
  } = {}) => {
    if (!nextStyle || !resizedImage) return
    if (remaining <= 0) {
      setStep('lead')
      return
    }
    if (sessionUsage.cooldownRemainingSeconds > 0) {
      setGenError(`Please wait ${sessionUsage.cooldownRemainingSeconds}s before generating again.`)
      return
    }
    if (isGenerating || sessionUsage.activeGeneration) {
      setGenError('A generation is already in progress for this session.')
      return
    }

    setStep('generating')
    setGenStage(0)
    setGenError(null)
    setLeadError(null)

    const stageTimer = window.setInterval(() => {
      setGenStage((current) => Math.min(current + 1, GEN_STAGES.length - 1))
    }, 900)

    try {
      // Send only the resized working image to keep the request body lean.
      // The original-looking preview stays client-side for the UI only.
      const sanitizedOptionalNote = sanitizeOptionalNote(nextOptionalNote)
      const data = await callGenerateAPI(
        resizedImage,
        nextStyle,
        modifiers,
        nextPreserveLayout,
        sanitizedOptionalNote,
        resolvedConfig.slug,
        resolvedConfig.leadDestination
      )
      window.clearInterval(stageTimer)
      setGenStage(GEN_STAGES.length - 1)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setRuntimeConfig(data.config || CLIENT_APP_CONFIG)
      setSessionUsage(data.usage || createInitialUsageState(CLIENT_APP_CONFIG))
      setSelectedStyle(nextStyle)
      setSelectedModifiers(modifiers)
      setPreserveLayout(nextPreserveLayout)
      setOptionalNote(sanitizedOptionalNote)
      setResult(normaliseStoredResult({
        ...data,
        styleId: nextStyle,
        modifiers,
        preserveLayout: nextPreserveLayout,
        optionalNote: sanitizedOptionalNote,
      }))
      setCompareTab('after')
      setLeadSubmitted(false)
      setStep('result')
    } catch (error) {
      window.clearInterval(stageTimer)
      if (error.config) setRuntimeConfig(error.config)
      if (error.usage) setSessionUsage(error.usage)
      setGenError(error.message || 'Something went wrong. Please try again.')
      setStep('style')
    }
  }

  const submitLead = async (event) => {
    event.preventDefault()
    setLeadLoading(true)
    setLeadError(null)

    try {
      await submitLeadAPI({
        ...lead,
        conceptId: result?.conceptId || null,
        companySlug: resolvedConfig.slug,
        companyName: resolvedConfig.companyName,
        websiteLink: resolvedConfig.websiteLink,
        leadDestination: resolvedConfig.leadDestination,
        conceptSummary: result?.prompt?.summary,
        styleId: result?.styleId,
        styleLabel: STYLE_LABELS[result?.styleId] || null,
        modifiers: result?.modifiers || selectedModifiers,
        preserveLayout: result?.preserveLayout || preserveLayout,
        optionalNote: result?.optionalNote || optionalNote,
        generationUsage: {
          completedGenerations: sessionUsage.completedGenerations,
          remainingGenerations: sessionUsage.remainingGenerations,
          maxFreeGenerations: sessionUsage.maxFreeGenerations,
        },
      })
      setLeadSubmitted(true)
    } catch (error) {
      setLeadError(error.message || 'We could not submit your details just now. Please try again.')
    } finally {
      setLeadLoading(false)
    }
  }

  const toggleModifier = (modifierId) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifierId)
        ? prev.filter((value) => value !== modifierId)
        : [...prev, modifierId]
    )
  }

  const selectedModifierLabels = selectedModifiers
    .map((modifierId) => MODIFIERS.find((modifier) => modifier.id === modifierId)?.label)
    .filter(Boolean)
  const hasJourneyState = Boolean(
    uploadedImage ||
    resizedImage ||
    selectedStyle ||
    selectedModifiers.length > 0 ||
    optionalNote ||
    result ||
    lead.name ||
    lead.email ||
    lead.postcode ||
    lead.phone ||
    lead.notes
  )
  const resetJourney = useCallback(() => {
    try {
      window.localStorage.removeItem(journeyMetaKey)
      window.sessionStorage.removeItem(journeyAssetKey)
    } catch (error) {
      console.warn('Failed to clear local journey state', error)
    }

    if (fileRef.current) {
      fileRef.current.value = ''
    }

    setStep(initialRouteStep)
    setUploadedImage(null)
    setResizedImage(null)
    setSelectedStyle(initialStyleId)
    setSelectedModifiers([])
    setPreserveLayout('strong')
    setOptionalNote('')
    setResult(null)
    setCompareTab('after')
    setGenStage(0)
    setDragging(false)
    setGenError(null)
    setUploadError(null)
    setLeadSubmitted(false)
    setLeadLoading(false)
    setLeadError(null)
    setLead(EMPTY_LEAD)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [initialRouteStep, initialStyleId, journeyAssetKey, journeyMetaKey])
  const activeResult = result || {
    styleId: selectedStyle,
    modifiers: selectedModifiers,
    preserveLayout,
    optionalNote,
  }
  const resultCommentary = buildDesignCommentary(
    activeResult?.styleId,
    activeResult?.modifiers,
    activeResult?.preserveLayout
  )

  return (
    <div className="gv-app" style={themeStyle}>
      <header className="gv-header">
        <div className="gv-logo">
          <BrandMark
            logo={resolvedConfig.logo}
            companyName={resolvedConfig.companyName}
            imageClassName="gv-logo-img"
          />
        </div>
        <div className="gv-header-actions">
          {authState.ready && authState.enabled && authState.signedIn ? (
            <>
              <Link href={authHref} className="gv-header-link">
                Account
              </Link>
              <span className="gv-badge-dark">Signed in</span>
              <form action="/auth/logout" method="post" className="gv-header-form">
                <input type="hidden" name="next" value={landingPath} />
                <button type="submit" className="gv-header-reset">
                  Log out
                </button>
              </form>
            </>
          ) : authState.ready && authState.enabled ? (
            <Link href={authHref} className="gv-header-link">
              Optional sign in
            </Link>
          ) : null}
          {authState.ready && !authState.enabled && (
            <span className="gv-badge-dark">Public preview mode</span>
          )}
          {hasJourneyState && (
            <button
              type="button"
              className="gv-header-reset"
              onClick={resetJourney}
              disabled={isGenerating}
            >
              Start again
            </button>
          )}
          {resolvedConfig.companyTag && <span className="gv-badge-dark">{resolvedConfig.companyTag}</span>}
          <span className="gv-badge-green">Free preview</span>
        </div>
      </header>

      {step !== 'hero' && (
        <div className="gv-progress">
          {['upload', 'style', 'generating', 'result'].map((progressStep, index, arr) => {
            const stepOrder = ['upload', 'style', 'generating', 'result', 'lead']
            const currentIdx = stepOrder.indexOf(step)
            const thisIdx = stepOrder.indexOf(progressStep)
            const isDone = currentIdx > thisIdx
            const isActive = currentIdx === thisIdx

            return (
              <div
                key={progressStep}
                className={`gv-progress-item${index < arr.length - 1 ? ' fill' : ''}`}
              >
                <div className={`gv-pstep${isActive ? ' active' : isDone ? ' done' : ''}`}>
                  <div className="gv-pdot" />
                  <span>
                    {progressStep === 'upload'
                      ? 'Upload'
                      : progressStep === 'style'
                        ? 'Style'
                        : progressStep === 'generating'
                          ? 'Generating'
                          : 'Result'}
                  </span>
                </div>
                {index < arr.length - 1 && <div className="gv-pline" />}
              </div>
            )
          })}
        </div>
      )}

      {step === 'hero' && (
        <div className="gv-fade">
          <section className="gv-hero">
            <div className="gv-eyebrow">
              <span className="gv-eyebrow-dot" />
              AI garden visualisation
            </div>
            <h1 className="gv-h1">
              {resolvedConfig.heroHeadline.split('\n').map((part, index, parts) => (
                <span key={part}>
                  {index === parts.length - 1 ? <em>{part}</em> : part}
                  {index < parts.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="gv-hero-p">
              {resolvedConfig.heroSubtext}
            </p>
            <button type="button" className="gv-cta" onClick={() => setStep('upload')}>
              {resolvedConfig.ctaLabel}
              <span className="gv-cta-arrow">→</span>
            </button>
            <p className="gv-hero-note">
              Free to try · No sign-up required · Based on your actual photo
            </p>
          </section>

          <div className="gv-how-strip">
            <div className="gv-how-step">
              <div className="gv-how-num">01</div>
              <div className="gv-how-label">Upload a photo</div>
              <div className="gv-how-sub">Your real garden, taken in daylight</div>
            </div>
            <div className="gv-how-arrow">→</div>
            <div className="gv-how-step">
              <div className="gv-how-num">02</div>
              <div className="gv-how-label">Choose a direction</div>
              <div className="gv-how-sub">Style, layout, and modifiers</div>
            </div>
            <div className="gv-how-arrow">→</div>
            <div className="gv-how-step">
              <div className="gv-how-num">03</div>
              <div className="gv-how-label">Compare concepts</div>
              <div className="gv-how-sub">Before and after, side by side</div>
            </div>
          </div>

          <div className="gv-trust-row">
            {[
              { n: '15+', label: 'Design styles' },
              { n: '60s', label: 'Average generation time' },
              { n: '100%', label: 'Based on your photo' },
            ].map((item) => (
              <div key={item.n} className="gv-trust-card">
                <div className="gv-trust-n">{item.n}</div>
                <div className="gv-trust-label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="gv-audience-wrap">
            <div className="gv-section-label center">Choose your path</div>
            <div className="gv-audience-grid">
              <Link href="/pricing" className="gv-audience-card">
                <div className="gv-audience-kicker">For homeowners</div>
                <div className="gv-audience-title">Customer image plans</div>
                <p className="gv-audience-copy">
                  Start with the free preview and see the simple customer plan structure for ongoing image generation.
                </p>
                <span className="gv-audience-link">View customer plans →</span>
              </Link>

              <Link href="/for-landscapers" className="gv-audience-card gv-audience-card-dark">
                <div className="gv-audience-kicker">For landscaping companies</div>
                <div className="gv-audience-title">Branded rollout</div>
                <p className="gv-audience-copy">
                  Use a branded AI visualiser, stronger lead capture, and consultation-led rollout options for your business.
                </p>
                <span className="gv-audience-link">Explore the landscaper path →</span>
              </Link>
            </div>
          </div>

          <div className="gv-style-strip-wrap">
            <div className="gv-section-label center">Available styles</div>
            <div className="gv-style-strip">
              {STYLES.map((style) => (
                <div
                  key={style.id}
                  className="gv-strip-pill"
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelectedStyle(style.id); setStep('upload') }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStyle(style.id); setStep('upload') } }}
                >
                  {style.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="gv-upload-wrap gv-fade">
          <div className="gv-step-header center">
            <div className="gv-step-num">Step 1 of 3</div>
            <h2 className="gv-h2">Upload your garden photo</h2>
            <p className="gv-step-sub">A clear daylight photo gives the best results</p>
          </div>

          {uploadError && <div className="gv-error">⚠ {uploadError}</div>}

          {uploadedImage && (
            <div className="gv-upload-return-card">
              <img src={uploadedImage} alt="Current upload" className="gv-upload-return-img" />
              <div className="gv-upload-return-footer">
                <div>
                  <div className="gv-upload-return-title">Current photo saved</div>
                  <div className="gv-upload-return-sub">You can continue where you left off or replace the upload.</div>
                </div>
                <button
                  type="button"
                  className="gv-change-btn"
                  onClick={() => setStep(selectedStyle ? 'style' : 'upload')}
                >
                  Resume journey
                </button>
              </div>
            </div>
          )}

          <div
            className={`gv-dropzone${dragging ? ' dragging' : ''}`}
            onDrop={onDrop}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onClick={openFilePicker}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openFilePicker()
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="gv-drop-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="gv-drop-title">Drop your garden photo here</h3>
            <p className="gv-drop-sub">Or select a file from your device</p>
            <label
              htmlFor={fileInputId}
              className="gv-upload-btn"
              onClick={(event) => event.stopPropagation()}
            >
              Select property photo
            </label>
            <p className="gv-drop-formats">JPG · PNG · WEBP · up to 25MB</p>
          </div>

          <input
            id={fileInputId}
            ref={fileRef}
            className="gv-file-input"
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(event) => {
              handleFile(event.target.files[0])
              event.target.value = ''
            }}
          />

          <div className="gv-upload-tips">
            <div className="gv-tip">Use a photo taken in daylight for best results</div>
            <div className="gv-tip">Landscape orientation and full garden in frame works best</div>
            <div className="gv-tip">Include any existing structures, paths, or features</div>
            <div className="gv-tip">iPhone HEIC and HEIF photos are fully supported</div>
          </div>

          {uploadedImage && (
            <div className="gv-back-row">
              <button type="button" className="gv-text-btn" onClick={() => setStep(selectedStyle ? 'style' : 'hero')}>
                Continue to design selections →
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'style' && (
        <div className="gv-main gv-fade">
          {uploadedImage && (
            <div className="gv-preview-card">
              <img src={uploadedImage} alt="Your garden" className="gv-preview-img" />
              <div className="gv-preview-footer">
                <span className="gv-preview-label">Your uploaded photo</span>
                <button type="button" className="gv-change-btn" onClick={() => setStep('upload')}>
                  Back to upload
                </button>
              </div>
            </div>
          )}

          <div className="gv-usage-bar">
            <span className="gv-usage-label">Free concepts remaining</span>
            <div className="gv-usage-track">
              <div
                className="gv-usage-fill"
                style={{ width: `${Math.max(0, remaining / sessionUsage.maxFreeGenerations) * 100}%` }}
              />
            </div>
            <span className="gv-usage-count">{remaining} of {sessionUsage.maxFreeGenerations}</span>
          </div>

          {sessionUsage.cooldownRemainingSeconds > 0 && (
            <div className="gv-cooldown-note">
              Next generation available in {sessionUsage.cooldownRemainingSeconds}s
            </div>
          )}

          {genError && <div className="gv-error">⚠ {genError}</div>}

          <div className="gv-step-header">
            <div className="gv-step-num">Step 2 of 3</div>
            <h2 className="gv-h2">Choose your landscaping style</h2>
            <p className="gv-step-sub">
              Select the look and feel you&apos;d like to explore. Free concepts use preset styles and quick modifiers only.
            </p>
          </div>

          <div className="gv-style-grid">
            {STYLES.map((style) => (
              <div
                key={style.id}
                className={`gv-style-card${selectedStyle === style.id ? ' selected' : ''}`}
                onClick={() => setSelectedStyle(style.id)}
                role="radio"
                aria-checked={selectedStyle === style.id}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStyle(style.id) } }}
              >
                {selectedStyle === style.id && <div className="gv-style-check" aria-hidden="true">✓</div>}
                <div className="gv-style-cat">{style.category}</div>
                <div className="gv-style-name">{style.label}</div>
                <div className="gv-style-desc">{style.desc}</div>
              </div>
            ))}
          </div>

          <div className="gv-preserve-section">
            <div className="gv-section-label">Preserve the existing layout</div>
            <div className="gv-preserve-grid">
              {PRESERVE_LAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`gv-preserve-card${preserveLayout === option.id ? ' selected' : ''}`}
                  onClick={() => setPreserveLayout(option.id)}
                >
                  <div className="gv-preserve-name">{option.label}</div>
                  <div className="gv-preserve-desc">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="gv-features-section">
            <div className="gv-section-label">
              Refine the concept <span className="gv-optional">(optional)</span>
            </div>
            <div className="gv-features-grid">
              {MODIFIERS.map((modifier) => (
                <button
                  key={modifier.id}
                  type="button"
                  className={`gv-feature-toggle${selectedModifiers.includes(modifier.id) ? ' selected' : ''}`}
                  onClick={() => toggleModifier(modifier.id)}
                >
                  {modifier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="gv-note-section">
            <div className="gv-section-label">
              Optional note <span className="gv-optional">(kept short)</span>
            </div>
            <input
              type="text"
              maxLength={OPTIONAL_NOTE_MAX_LENGTH}
              className="gv-form-input gv-note-input"
              value={optionalNote}
              placeholder="e.g. keep lawn, porcelain patio, lavender planting"
              onChange={(event) => setOptionalNote(sanitizeOptionalNote(event.target.value))}
            />
            <div className="gv-note-meta">
              <span className="gv-note-help">Used as a small styling preference only.</span>
              <span className="gv-note-count">{optionalNote.length}/{OPTIONAL_NOTE_MAX_LENGTH}</span>
            </div>
          </div>

          {selectedStyle && (
            <div className="gv-selection-summary">
              <div className="gv-summary-label">Your selection</div>
              <div className="gv-summary-text">
                {STYLES.find((style) => style.id === selectedStyle)?.label}
                {selectedModifierLabels.length > 0 && ` · ${selectedModifierLabels.join(' · ')}`}
                {` · ${PRESERVE_LAYOUT_OPTIONS.find((option) => option.id === preserveLayout)?.label}`}
              </div>
              {optionalNote && (
                <div className="gv-summary-sub">Preference note: {optionalNote}</div>
              )}
            </div>
          )}

          <div className="gv-style-cta-row">
            <button
              type="button"
              className="gv-cta"
              disabled={
                !selectedStyle ||
                sessionUsage.cooldownRemainingSeconds > 0 ||
                isGenerating ||
                sessionUsage.activeGeneration
              }
              onClick={() => {
                runGeneration()
              }}
            >
              {remaining <= 0
                ? 'Free previews used · Continue →'
                : sessionUsage.cooldownRemainingSeconds > 0
                  ? `Cooldown ${sessionUsage.cooldownRemainingSeconds}s`
                  : 'Create my design preview →'}
            </button>
            {!selectedStyle || sessionUsage.activeGeneration ? (
              <span className="gv-cta-hint">
                {!selectedStyle
                  ? 'Select a style above to continue'
                  : 'One generation can run at a time per session'}
              </span>
            ) : sessionUsage.cooldownRemainingSeconds > 0 ? (
              <span className="gv-cta-hint">Server cooldown is active between free generations</span>
            ) : null}
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="gv-gen-panel gv-fade">
          <div className="gv-gen-anim" aria-hidden="true" />

          <h2 className="gv-gen-title">{GEN_STAGES[genStage]}</h2>
          <p className="gv-gen-sub">Creating your personalised concept</p>

          <div className="gv-gen-track-wrap" aria-hidden="true">
            <div className="gv-gen-track-bar" />
          </div>

          <ul className="gv-gen-steps">
            {GEN_STAGES.map((stage, index) => (
              <li key={stage} className={`gv-gstep${index === genStage ? ' active' : index < genStage ? ' done' : ''}`}>
                <div className="gv-gstep-dot" />
                {stage}
              </li>
            ))}
          </ul>

          <p className="gv-gen-note">Usually takes 30–60 seconds</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="gv-main gv-fade gv-result-reveal">
          <div className="gv-result-stage">
            <div className="gv-step-header gv-result-header">
              <div>
                <div className="gv-step-num gv-step-num-ready">Your concept is ready</div>
                <h2 className="gv-h2">Your landscaping concept</h2>
                <p className="gv-step-sub">A faithful premium preview based on your property photo and design direction.</p>
              </div>
              <div className="gv-result-badges">
                <span className="gv-result-badge">{STYLE_LABELS[result.styleId]}</span>
                <span className="gv-result-badge muted">{PRESERVE_LAYOUT_OPTIONS.find((option) => option.id === result.preserveLayout)?.label} layout</span>
              </div>
            </div>
          </div>

          <div className="gv-compare-card">
            <div className="gv-compare-topbar">
              <div className="gv-compare-copy">
                <div className="gv-result-summary-label">Design preview</div>
                <div className="gv-compare-title">Before and after</div>
              </div>
              <div className="gv-compare-switch" role="tablist" aria-label="Compare original and concept">
                {['before', 'after'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`gv-compare-chip${compareTab === tab ? ' active' : ''}`}
                    onClick={() => setCompareTab(tab)}
                  >
                    {tab === 'before' ? 'Original' : 'Concept'}
                  </button>
                ))}
              </div>
            </div>

            <div className="gv-compare-frame">
              <div className="gv-compare-state">
                <span className="gv-compare-state-label">{compareTab === 'before' ? 'Original photo' : 'Landscape concept'}</span>
                <span className="gv-compare-state-line" />
              </div>
              <div className="gv-compare-img-wrap">
                {compareTab === 'before' ? (
                  <img src={uploadedImage} alt="Before" className="gv-compare-img" />
                ) : (
                  <>
                    <img
                      src={result.isDemo ? uploadedImage : result.imageUrl}
                      alt="After concept"
                      className={`gv-compare-img${result.isDemo ? ' gv-demo-img' : ''}`}
                    />
                    {result.isDemo && (
                      <div className="gv-demo-notice">
                        <div className="gv-demo-inner">
                          <div className="gv-demo-tag">Gemini key not configured</div>
                          <div className="gv-demo-msg">
                            Add your <code>GEMINI_API_KEY</code> to <code>.env.local</code> to generate live concepts.
                            Gemini remains the default live provider, with Anthropic reserved as a future fallback slot.
                          </div>
                          <div className="gv-demo-prompt">
                            <strong>Prompt ready:</strong> {result.prompt?.preview?.slice(0, 120)}…
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {runtimeConfig.ENABLE_WATERMARK && (
                  <div className="gv-watermark">{resolvedConfig.companyName} · Concept Preview</div>
                )}
              </div>
            </div>

            <div className="gv-result-summary">
              <div className="gv-result-summary-label">Design overview</div>
              <div className="gv-result-summary-text">{result.prompt?.summary}</div>
              <p className="gv-result-commentary">{resultCommentary}</p>
              {result.optionalNote && (
                <div className="gv-result-disclaimer">Preference note: {result.optionalNote}</div>
              )}
              {result.meta?.provider && (
                <div className="gv-result-disclaimer">
                  Provider: {result.meta.provider} · Quality: {result.meta.quality} · Layout: {result.prompt?.preserveLayout}
                </div>
              )}
              <div className="gv-result-disclaimer">
                Concept images are for inspiration and planning purposes only. Results may vary.
              </div>
            </div>
          </div>

          <div className="gv-variation-card">
            <div className="gv-section-label">Refine this direction</div>
            <div className="gv-variation-grid">
              {VARIATIONS.map((variation) => (
                <button
                  key={variation.id}
                  type="button"
                  className="gv-variation-btn"
                  onClick={() => runGeneration({
                    modifiers: buildVariationModifiers(result.modifiers || selectedModifiers, variation.id),
                    nextStyle: result.styleId || selectedStyle,
                    nextPreserveLayout: result.preserveLayout || preserveLayout,
                    nextOptionalNote: result.optionalNote || optionalNote,
                  })}
                  disabled={sessionUsage.cooldownRemainingSeconds > 0 || isGenerating || sessionUsage.activeGeneration}
                >
                  {variation.label}
                </button>
              ))}
            </div>
            <p className="gv-variation-note">Each variation keeps the same property view and layout guidance while refining the styling direction.</p>
          </div>

          <div className="gv-action-grid">
            <div className="gv-action-card primary" onClick={() => setStep('lead')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStep('lead') }}>
              <div className="gv-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="gv-action-name">Continue to consultation</div>
              <div className="gv-action-desc">Share this concept with {resolvedConfig.leadDestination.label} and keep the design direction intact</div>
            </div>
            <div className="gv-action-card" onClick={() => { setGenError(null); setStep('style') }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setGenError(null); setStep('style') } }}>
              <div className="gv-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
              </div>
              <div className="gv-action-name">Refine my selections</div>
              <div className="gv-action-desc">Return to styles, modifiers, and layout preservation without losing your current result</div>
            </div>
          </div>

          {remaining <= 1 && (
            <div className="gv-upgrade-card">
              <div className="gv-upgrade-inner">
                <div>
                  <h3 className="gv-upgrade-title">Unlock unlimited concepts</h3>
                  <p className="gv-upgrade-sub">You&apos;ve used most of your free generations. Upgrade to explore further.</p>
                  <ul className="gv-upgrade-list">
                    <li>Unlimited concept generations</li>
                    <li>Higher resolution outputs</li>
                    <li>Multiple style variants at once</li>
                    <li>No watermark — download and share</li>
                    <li>Day to night and seasonal variations</li>
                  </ul>
                </div>
                <button type="button" className="gv-upgrade-btn" onClick={() => setStep('lead')}>
                  Upgrade my plan →
                </button>
              </div>
            </div>
          )}

          <button type="button" className="gv-cta gv-cta-full" onClick={() => setStep('lead')}>
            Continue with this concept
          </button>
        </div>
      )}

      {step === 'lead' && (
        <div className="gv-main gv-fade">
          {!leadSubmitted ? (
            <div className="gv-lead-card">
              <div className="gv-back-row">
                <button type="button" className="gv-text-btn" onClick={() => setStep('result')}>
                  ← Return to concept
                </button>
              </div>
              <div className="gv-lead-eyebrow">Take this concept further</div>
              <h2 className="gv-h2 gv-h2-tight">{resolvedConfig.leadFormHeading}</h2>
              <p className="gv-lead-sub">
                Share your details to continue this design direction with {resolvedConfig.leadDestination.label}, who can turn it into a real proposal.
              </p>

              {leadError && <div className="gv-error">⚠ {leadError}</div>}

              {result && (
                <div className="gv-lead-preview">
                  <img
                    src={result.isDemo ? uploadedImage : result.imageUrl}
                    alt="Concept preview"
                    className="gv-lead-preview-img"
                  />
                  <div className="gv-lead-preview-copy">
                    <div className="gv-lead-preview-label">Your selected concept</div>
                    <div className="gv-lead-preview-title">{result.prompt?.summary}</div>
                    <p className="gv-lead-preview-text">{resultCommentary}</p>
                    {result.optionalNote && (
                      <p className="gv-lead-preview-note">Preference note: {result.optionalNote}</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={submitLead} className="gv-lead-form">
                <div className="gv-form-row">
                  <div className="gv-form-group">
                    <label className="gv-form-label">Your name *</label>
                    <input
                      className="gv-form-input"
                      required
                      placeholder="Jane Smith"
                      value={lead.name}
                      onChange={(event) => setLead((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="gv-form-group">
                    <label className="gv-form-label">Email address *</label>
                    <input
                      className="gv-form-input"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={lead.email}
                      onChange={(event) => setLead((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="gv-form-row">
                  <div className="gv-form-group">
                    <label className="gv-form-label">Postcode / area *</label>
                    <input
                      className="gv-form-input"
                      required
                      placeholder="SS1 1AA"
                      value={lead.postcode}
                      onChange={(event) => setLead((prev) => ({ ...prev, postcode: event.target.value }))}
                    />
                  </div>
                  <div className="gv-form-group">
                    <label className="gv-form-label">
                      Phone number <span className="gv-optional">(optional)</span>
                    </label>
                    <input
                      className="gv-form-input"
                      type="tel"
                      placeholder="+44 7700 000 000"
                      value={lead.phone}
                      onChange={(event) => setLead((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="gv-form-group">
                  <label className="gv-form-label">
                    Tell us about your project <span className="gv-optional">(optional)</span>
                  </label>
                  <textarea
                    className="gv-form-input gv-textarea"
                    placeholder="Timeline, budget, specific questions…"
                    value={lead.notes}
                    onChange={(event) => setLead((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>

                <button type="submit" className="gv-cta gv-cta-form" disabled={leadLoading}>
                  {leadLoading ? 'Preparing your consultation…' : `${resolvedConfig.leadFormCTA} →`}
                </button>

                <p className="gv-form-legal">
                  Your details are used only to continue this concept conversation with {resolvedConfig.leadDestination.label}.
                  We won&apos;t share them with third parties or send you unsolicited marketing.
                </p>
              </form>
            </div>
          ) : (
            <div className="gv-lead-card center">
              <div className="gv-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="gv-h2" style={{ marginBottom: 12 }}>
                Thank you, {lead.name.split(' ')[0] || 'there'}
              </h2>
              <p className="gv-lead-sub gv-lead-sub-bottom">
                Your concept has been shared. A landscaping specialist will be in touch at <strong>{lead.email}</strong>.
              </p>
              <button
                type="button"
                className="gv-cta"
                onClick={() => {
                  setLeadSubmitted(false)
                  setStep('result')
                }}
              >
                Return to my concept →
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="gv-footer">
        <div className="gv-footer-inner">
          {resolvedConfig.logo.imageSrc ? (
            <img
              src={resolvedConfig.logo.imageSrc}
              alt={resolvedConfig.logo.alt || resolvedConfig.companyName}
              className="gv-footer-logo-img"
            />
          ) : (
            <div className="gv-footer-logo">{resolvedConfig.companyName}</div>
          )}
          {resolvedConfig.websiteLink && (
            <p>
              <a href={resolvedConfig.websiteLink} className="gv-footer-link" target="_blank" rel="noreferrer">
                Visit website
              </a>
            </p>
          )}
          <p>Concept images are for inspiration and planning purposes only.</p>
          <p>Results may not reflect exact final outcomes. Always consult a qualified landscaper before commencing work.</p>
        </div>
      </footer>
    </div>
  )
}
