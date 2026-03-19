const DEFAULT_STYLE_ID = 'modern-minimal'
const MODIFIER_LIMIT = 3
const CACHE_LIMIT = 100
const DEFAULT_PRESERVE_LAYOUT = 'strong'
export const OPTIONAL_NOTE_MAX_LENGTH = 60

const CORE_SCOPE_FRAGMENT =
  'Photorealistic landscaping visualisation for the same real UK residential property photo.'

const PRESERVATION_FRAGMENT =
  'Preserve the exact camera angle, lens perspective, house position, garden footprint, fence and wall positions, level changes, and patio, driveway, and lawn structure where possible.'

const QUALITY_FRAGMENT =
  'Believable premium after-version suitable for a landscaping quote, homeowner preview, or lead-generation tool.'

const NEGATIVE_FRAGMENT =
  'Do not invent new fences, move boundaries, alter major built structures unless requested, create impossible geometry, or turn the image into fantasy concept art.'

const PRESERVE_LAYOUT_FRAGMENTS = {
  strong:
    'Preserve layout strength strong. Keep all major built structure, boundaries, levels, steps, and hardscape geometry highly faithful to the original scene.',
  medium:
    'Preserve layout strength medium. Keep the main geometry, boundaries, and hardscape structure consistent while allowing modest refinements.',
  loose:
    'Preserve layout strength loose. Stay recognisably faithful to the same property while allowing more visible but still plausible landscaping refinement.',
}

export const STYLE_PROMPTS = {
  'modern-minimal': 'Modern minimal styling with large-format paving, crisp edging, and restrained structural planting.',
  'luxury-patio': 'Luxury patio styling with premium stone, refined detailing, and layered planting.',
  'family-garden': 'Family garden styling with practical lawn, soft planting, and durable outdoor living areas.',
  'cottage-garden': 'Cottage garden styling with flowering borders, softer paths, and natural planting density.',
  contemporary: 'Contemporary exterior styling with clean lines, architectural planting, and outdoor living focus.',
  'low-maintenance': 'Low-maintenance landscaping with practical materials, evergreen structure, and tidy planting.',
  'premium-drive': 'Premium driveway styling with smart paving, crisp frontage, and strong kerb appeal.',
  'natural-planting': 'Naturalistic garden styling with meadow character, native shrubs, and relaxed ecological planting.',
  entertaining: 'Outdoor entertaining styling with dining, lounge seating, and polished evening atmosphere.',
  'pergola-seating': 'Pergola-led styling with covered seating, climbing plants, and comfortable shade.',
  'japanese-zen': 'Japanese-inspired styling with gravel, stepping stones, calm planting, and simple geometry.',
  mediterranean: 'Mediterranean styling with warm stone, terracotta tones, and drought-tolerant planting.',
  tropical: 'Tropical-inspired styling with layered foliage, bold planting, and warm mood lighting.',
  'kitchen-garden': 'Kitchen garden styling with raised beds, productive planting, gravel paths, and ordered structure.',
  'modern-formal': 'Modern formal styling with symmetry, clipped greenery, stone hardscape, and elegant structure.',
}

const STYLE_LABELS = {
  'modern-minimal': 'Modern Minimal',
  'luxury-patio': 'Luxury Patio',
  'family-garden': 'Family Garden',
  'cottage-garden': 'Cottage Garden',
  contemporary: 'Contemporary Living',
  'low-maintenance': 'Low Maintenance',
  'premium-drive': 'Premium Driveway',
  'natural-planting': 'Natural Planting',
  entertaining: 'Entertaining Space',
  'pergola-seating': 'Pergola & Seating',
  'japanese-zen': 'Japanese Zen',
  mediterranean: 'Mediterranean',
  tropical: 'Tropical Garden',
  'kitchen-garden': 'Kitchen Garden',
  'modern-formal': 'Modern Formal',
}

const MODIFIER_FRAGMENTS = {
  'more-premium': 'Use better materials, cleaner detailing, and more refined styling without major structural change.',
  'more-planting': 'Increase planting density within realistic border areas and soften the space with attractive greenery.',
  'lower-maintenance': 'Simplify upkeep with practical planting and durable materials while keeping the garden attractive.',
  'more-patio': 'Give slightly more patio emphasis or finish within the existing space without replacing the full layout.',
  'more-natural': 'Shift toward a softer, more natural planting character without changing the main structure.',
  'more-practical': 'Improve usability, circulation, and day-to-day practicality within the same layout.',
}

const MODIFIER_LABELS = {
  'more-premium': 'More Premium',
  'more-planting': 'More Planting',
  'lower-maintenance': 'Lower Maintenance',
  'more-patio': 'More Patio',
  'more-natural': 'More Natural',
  'more-practical': 'More Practical',
}

const STYLE_FRAGMENT_CACHE = new Map()
const PROMPT_CACHE = new Map()

function getStyleFragment(styleId) {
  const key = STYLE_PROMPTS[styleId] ? styleId : DEFAULT_STYLE_ID

  if (!STYLE_FRAGMENT_CACHE.has(key)) {
    STYLE_FRAGMENT_CACHE.set(key, STYLE_PROMPTS[key])
  }

  return STYLE_FRAGMENT_CACHE.get(key)
}

function normaliseModifiers(modifiers = []) {
  const unique = []
  const seen = new Set()

  for (const modifier of modifiers) {
    if (!MODIFIER_FRAGMENTS[modifier] || seen.has(modifier)) continue

    seen.add(modifier)
    unique.push(modifier)

    if (unique.length === MODIFIER_LIMIT) break
  }

  return unique
}

function setCachedPrompt(cacheKey, value) {
  PROMPT_CACHE.set(cacheKey, value)

  if (PROMPT_CACHE.size > CACHE_LIMIT) {
    const oldestKey = PROMPT_CACHE.keys().next().value
    PROMPT_CACHE.delete(oldestKey)
  }

  return value
}

function normalisePreserveLayout(preserveLayout) {
  return PRESERVE_LAYOUT_FRAGMENTS[preserveLayout]
    ? preserveLayout
    : DEFAULT_PRESERVE_LAYOUT
}

export function sanitizeOptionalNote(optionalNote = '') {
  return String(optionalNote || '')
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9\s,.'/&()-]/g, '')
    .trim()
    .slice(0, OPTIONAL_NOTE_MAX_LENGTH)
}

function buildOptionalNoteFragment(optionalNote) {
  return optionalNote
    ? `Small preference only if compatible with the existing layout: ${optionalNote}. Do not treat this as permission for structural redesign.`
    : ''
}

export function buildPrompt(
  styleId,
  modifiers = [],
  preserveLayout = DEFAULT_PRESERVE_LAYOUT,
  optionalNote = ''
) {
  const normalisedStyleId = STYLE_PROMPTS[styleId] ? styleId : DEFAULT_STYLE_ID
  const selectedModifiers = normaliseModifiers(modifiers)
  const normalisedPreserveLayout = normalisePreserveLayout(preserveLayout)
  const normalisedOptionalNote = sanitizeOptionalNote(optionalNote)
  const cacheKey = [
    normalisedStyleId,
    normalisedPreserveLayout,
    ...selectedModifiers,
    normalisedOptionalNote ? `note:${normalisedOptionalNote}` : '',
  ]
    .filter(Boolean)
    .join('|')

  if (PROMPT_CACHE.has(cacheKey)) {
    return PROMPT_CACHE.get(cacheKey)
  }

  const modifierFragment = selectedModifiers.length
    ? selectedModifiers.map((modifier) => MODIFIER_FRAGMENTS[modifier]).join(' ')
    : ''
  const optionalNoteFragment = buildOptionalNoteFragment(normalisedOptionalNote)

  const positive = [
    CORE_SCOPE_FRAGMENT,
    PRESERVATION_FRAGMENT,
    PRESERVE_LAYOUT_FRAGMENTS[normalisedPreserveLayout],
    `Apply ${STYLE_LABELS[normalisedStyleId] || 'selected'} style through materials, planting character, edges, hardscape finish, and atmosphere.`,
    getStyleFragment(normalisedStyleId),
    modifierFragment,
    optionalNoteFragment,
    QUALITY_FRAGMENT,
    NEGATIVE_FRAGMENT,
  ]
    .filter(Boolean)
    .join(' ')

  return setCachedPrompt(cacheKey, {
    cacheKey,
    positive,
    preview: positive,
    optionalNote: normalisedOptionalNote,
    preserveLayout: normalisedPreserveLayout,
    summary: buildSummary(normalisedStyleId, selectedModifiers),
  })
}

function buildSummary(styleId, modifiers) {
  const label = STYLE_LABELS[styleId] || 'Custom Style'
  const modifierLabels = modifiers.map((modifier) => MODIFIER_LABELS[modifier])
  return modifierLabels.length > 0 ? `${label} · ${modifierLabels.join(' · ')}` : label
}
