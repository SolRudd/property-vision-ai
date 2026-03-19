'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { CLIENT_APP_CONFIG, getResizeSettings } from '../lib/appConfig'
import { OPTIONAL_NOTE_MAX_LENGTH, sanitizeOptionalNote } from '../lib/promptBuilder'
import {
  getPublicExperienceConfig,
  resolveExperienceConfig,
} from '../lib/companyConfigs'

const EMPTY_LEAD = { name: '', email: '', postcode: '', phone: '', notes: '' }

const STYLES = [
  { id: 'modern-minimal', label: 'Modern Minimal', emoji: '▪', desc: 'Porcelain paving, structured planting, sleek edges' },
  { id: 'luxury-patio', label: 'Luxury Patio', emoji: '◈', desc: 'Premium stone, statement features, refined finish' },
  { id: 'family-garden', label: 'Family Garden', emoji: '◉', desc: 'Safe lawn, colour, practical and beautiful' },
  { id: 'cottage-garden', label: 'Cottage Garden', emoji: '✿', desc: 'Flowering borders, naturalistic, romantic' },
  { id: 'contemporary', label: 'Contemporary Living', emoji: '◻', desc: 'Indoor-outdoor flow, architectural planting' },
  { id: 'low-maintenance', label: 'Low Maintenance', emoji: '◌', desc: 'Gravel, evergreens, minimal upkeep' },
  { id: 'premium-drive', label: 'Premium Driveway', emoji: '◆', desc: 'Block paving, lighting, kerb appeal' },
  { id: 'natural-planting', label: 'Natural Planting', emoji: '❧', desc: 'Wildflower, native species, ecological' },
  { id: 'entertaining', label: 'Entertaining Space', emoji: '◎', desc: 'Outdoor kitchen, dining, ambient lighting' },
  { id: 'pergola-seating', label: 'Pergola & Seating', emoji: '⌂', desc: 'Covered structure, climbing plants, shade' },
  { id: 'japanese-zen', label: 'Japanese Zen', emoji: '○', desc: 'Raked gravel, bamboo, stone, calm geometry' },
  { id: 'mediterranean', label: 'Mediterranean', emoji: '◑', desc: 'Terracotta, olives, lavender, warm tones' },
  { id: 'tropical', label: 'Tropical Garden', emoji: '❋', desc: 'Lush exotic foliage, bold planting, vivid' },
  { id: 'kitchen-garden', label: 'Kitchen Garden', emoji: '⊕', desc: 'Raised beds, herbs, fruit trees, productive beauty' },
  { id: 'modern-formal', label: 'Modern Formal', emoji: '⊞', desc: 'Symmetry, clipped hedging, elegant geometry' },
]

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

  if (!response.ok) {
    const err = await response.json()
    const error = new Error(err.error || 'Generation failed')
    error.usage = err.usage
    error.code = err.code
    error.config = err.config
    throw error
  }

  return response.json()
}

async function submitLeadAPI(data) {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
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

function normaliseStep(step, uploadedImage, selectedStyle, result) {
  if (step === 'lead' && result) return 'lead'
  if (step === 'result' && result) return 'result'
  if (selectedStyle && uploadedImage) return 'style'
  if (uploadedImage) return 'upload'
  return 'hero'
}

function buildVariationModifiers(baseModifiers, variationId) {
  const cleaned = baseModifiers.filter((modifier) => !VARIATION_IDS.has(modifier))
  const trimmed = cleaned.slice(0, 2)
  return variationId ? [...trimmed, variationId] : trimmed
}

function buildDesignCommentary(styleId, modifiers = [], preserveLayout = 'strong') {
  const styleLabel = STYLE_LABELS[styleId] || 'selected'
  const modifierNotes = modifiers
    .map((modifier) => MODIFIER_COMMENTARY[modifier])
    .filter(Boolean)
    .slice(0, 2)

  const emphasis = modifierNotes.length > 0
    ? `The ${styleLabel} direction introduces ${modifierNotes.join(' and ')}.`
    : `The ${styleLabel} direction focuses on premium materials, composed planting, and a polished exterior feel.`

  return `${emphasis} ${PRESERVE_LAYOUT_COMMENTARY[preserveLayout] || PRESERVE_LAYOUT_COMMENTARY.strong}`
}

export default function App({ experienceConfig } = {}) {
  const resolvedConfig = resolveExperienceConfig(
    experienceConfig || getPublicExperienceConfig()
  )
  const landingKey = resolvedConfig.slug || 'public'
  const journeyMetaKey = buildJourneyMetaKey(landingKey)
  const journeyAssetKey = buildJourneyAssetKey(landingKey)
  const themeStyle = buildThemeStyle(resolvedConfig.theme)
  const [runtimeConfig, setRuntimeConfig] = useState(CLIENT_APP_CONFIG)
  const [step, setStep] = useState('hero')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [resizedImage, setResizedImage] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
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
  const [sessionUsage, setSessionUsage] = useState(createInitialUsageState(CLIENT_APP_CONFIG))
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
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return
        if (data.config) setRuntimeConfig(data.config)
        if (data.usage) setSessionUsage(data.usage)
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [journeyAssetKey, journeyMetaKey])

  useEffect(() => {
    try {
      const storedMeta = window.localStorage.getItem(journeyMetaKey)
      const storedAssets = window.sessionStorage.getItem(journeyAssetKey)

      if (storedMeta) {
        const meta = JSON.parse(storedMeta)
        setSelectedStyle(meta.selectedStyle || null)
        setSelectedModifiers(Array.isArray(meta.selectedModifiers) ? meta.selectedModifiers : [])
        setPreserveLayout(meta.preserveLayout || 'strong')
        setOptionalNote(sanitizeOptionalNote(meta.optionalNote || ''))
        setCompareTab(meta.compareTab || 'after')
        setLeadSubmitted(Boolean(meta.leadSubmitted))
      }

      if (storedAssets) {
        const assets = JSON.parse(storedAssets)
        setUploadedImage(assets.uploadedImage || null)
        setResizedImage(assets.resizedImage || assets.uploadedImage || null)
        setResult(assets.result || null)
      }

      const meta = storedMeta ? JSON.parse(storedMeta) : {}
      const assets = storedAssets ? JSON.parse(storedAssets) : {}
      setStep(normaliseStep(meta.step, assets.uploadedImage, meta.selectedStyle, assets.result))
    } catch (error) {
      console.warn('Failed to restore local journey state', error)
    } finally {
      hasRestoredJourney.current = true
    }
  }, [])

  useEffect(() => {
    if (!hasRestoredJourney.current) return

    try {
      const resolvedStep = step === 'generating'
        ? normaliseStep('style', uploadedImage, selectedStyle, result)
        : step
      const shouldStoreMeta = Boolean(
        selectedStyle ||
        selectedModifiers.length > 0 ||
        optionalNote ||
        preserveLayout !== 'strong' ||
        compareTab !== 'after' ||
        leadSubmitted ||
        result
      )
      const shouldStoreAssets = Boolean(uploadedImage || resizedImage || result)

      if (shouldStoreMeta) {
        window.localStorage.setItem(
          journeyMetaKey,
          JSON.stringify({
            step: resolvedStep,
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

      if (shouldStoreAssets) {
        window.sessionStorage.setItem(
          journeyAssetKey,
          JSON.stringify({
            uploadedImage,
            resizedImage,
            result,
          })
        )
      } else {
        window.sessionStorage.removeItem(journeyAssetKey)
      }
    } catch (error) {
      console.warn('Failed to persist local journey state', error)
    }
  }, [
    step,
    uploadedImage,
    resizedImage,
    selectedStyle,
    selectedModifiers,
    preserveLayout,
    optionalNote,
    compareTab,
    result,
    leadSubmitted,
    journeyAssetKey,
    journeyMetaKey,
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

    const stageTimer = window.setInterval(() => {
      setGenStage((current) => Math.min(current + 1, GEN_STAGES.length - 1))
    }, 900)

    try {
      // The working image is the cost-controlled generation asset. The preview
      // image remains the original upload for the client-side journey UI.
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
      setResult({
        ...data,
        styleId: nextStyle,
        modifiers,
        preserveLayout: nextPreserveLayout,
        optionalNote: sanitizedOptionalNote,
      })
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
    setLeadLoading(false)
    setLeadSubmitted(true)
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

    setStep('hero')
    setUploadedImage(null)
    setResizedImage(null)
    setSelectedStyle(null)
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
    setLead(EMPTY_LEAD)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [journeyAssetKey, journeyMetaKey])
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
          {resolvedConfig.logo.imageSrc ? (
            <img
              src={resolvedConfig.logo.imageSrc}
              alt={resolvedConfig.logo.alt || resolvedConfig.companyName}
              className="gv-logo-img"
            />
          ) : (
            <>
              {resolvedConfig.logo.primaryText}
              {resolvedConfig.logo.accentText && <span>{resolvedConfig.logo.accentText}</span>}
            </>
          )}
        </div>
        <div className="gv-header-actions">
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
          <span className="gv-badge-green">✦ Free preview</span>
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
              See your garden redesigned in minutes
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
              Concept images are for inspiration and planning purposes only · Free to try
            </p>
          </section>

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

          <div className="gv-style-strip-wrap">
            <div className="gv-section-label center">Available styles</div>
            <div className="gv-style-strip">
              {STYLES.map((style) => (
                <div key={style.id} className="gv-strip-pill" onClick={() => setStep('upload')}>
                  <span>{style.emoji}</span> {style.label}
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
            <div className="gv-drop-icon">🌿</div>
            <h3 className="gv-drop-title">Drag your photo here</h3>
            <p className="gv-drop-sub">Or tap to browse from your device</p>
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
            <div className="gv-tip">✓ Use a photo taken in daylight</div>
            <div className="gv-tip">✓ Landscape orientation works best</div>
            <div className="gv-tip">✓ Include the full garden area if possible</div>
            <div className="gv-tip">✓ iPhone HEIC and HEIF photos are supported</div>
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
                <span className="gv-preview-label">📸 Your uploaded photo</span>
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
              >
                {selectedStyle === style.id && <div className="gv-style-check">✓</div>}
                <div className="gv-style-emoji">{style.emoji}</div>
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
              disabled={!selectedStyle || sessionUsage.cooldownRemainingSeconds > 0 || isGenerating || sessionUsage.activeGeneration}
              onClick={() => runGeneration()}
            >
              {remaining <= 0
                ? 'Upgrade to generate →'
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
          <div className="gv-gen-anim">
            <div className="gv-ring gv-ring1" />
            <div className="gv-ring gv-ring2" />
            <div className="gv-ring gv-ring3" />
            <div className="gv-gen-center">✦</div>
          </div>

          <h2 className="gv-gen-title">{GEN_STAGES[genStage]}</h2>
          <p className="gv-gen-sub">Creating your personalised landscaping concept</p>

          <ul className="gv-gen-steps">
            {GEN_STAGES.map((stage, index) => (
              <li key={stage} className={`gv-gstep${index === genStage ? ' active' : index < genStage ? ' done' : ''}`}>
                <div className="gv-gstep-dot" />
                {stage}
              </li>
            ))}
          </ul>

          <p className="gv-gen-note">This usually takes 30–60 seconds</p>
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
            <div className="gv-action-card primary" onClick={() => setStep('lead')}>
              <div className="gv-action-icon">✉</div>
              <div className="gv-action-name">Continue to consultation</div>
              <div className="gv-action-desc">Share this concept with {resolvedConfig.leadDestination.label} and keep the design direction intact</div>
            </div>
            <div className="gv-action-card" onClick={() => { setGenError(null); setStep('style') }}>
              <div className="gv-action-icon">↻</div>
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
              <div className="gv-lead-eyebrow">Concept continuation</div>
              <h2 className="gv-h2 gv-h2-tight">{resolvedConfig.leadFormHeading}</h2>
              <p className="gv-lead-sub">
                Share your details to continue this design direction with {resolvedConfig.leadDestination.label}, who can turn it into a real proposal.
              </p>

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
              <div className="gv-success-icon">✦</div>
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
          <div className="gv-footer-logo">{resolvedConfig.companyName}</div>
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
