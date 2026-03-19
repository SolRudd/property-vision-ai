const DEFAULTS = {
  MAX_FREE_GENERATIONS: 3,
  GENERATION_COOLDOWN_SECONDS: 30,
  ENABLE_WATERMARK: true,
  FREE_IMAGE_QUALITY: 'standard',
  PAID_IMAGE_QUALITY: 'high',
}

const VALID_QUALITIES = new Set(['economy', 'standard', 'high'])

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseBoolean(value, fallback) {
  if (value == null || value === '') return fallback
  const normalised = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalised)) return true
  if (['0', 'false', 'no', 'off'].includes(normalised)) return false
  return fallback
}

function parseQuality(value, fallback) {
  const normalised = String(value || '').trim().toLowerCase()
  return VALID_QUALITIES.has(normalised) ? normalised : fallback
}

export const CLIENT_APP_CONFIG = { ...DEFAULTS }

export function getServerAppConfig() {
  return {
    MAX_FREE_GENERATIONS: parsePositiveInt(
      process.env.MAX_FREE_GENERATIONS,
      DEFAULTS.MAX_FREE_GENERATIONS
    ),
    GENERATION_COOLDOWN_SECONDS: parsePositiveInt(
      process.env.GENERATION_COOLDOWN_SECONDS,
      DEFAULTS.GENERATION_COOLDOWN_SECONDS
    ),
    ENABLE_WATERMARK: parseBoolean(
      process.env.ENABLE_WATERMARK,
      DEFAULTS.ENABLE_WATERMARK
    ),
    FREE_IMAGE_QUALITY: parseQuality(
      process.env.FREE_IMAGE_QUALITY,
      DEFAULTS.FREE_IMAGE_QUALITY
    ),
    PAID_IMAGE_QUALITY: parseQuality(
      process.env.PAID_IMAGE_QUALITY,
      DEFAULTS.PAID_IMAGE_QUALITY
    ),
  }
}

export function buildPublicAppConfig(config) {
  return {
    MAX_FREE_GENERATIONS: config.MAX_FREE_GENERATIONS,
    GENERATION_COOLDOWN_SECONDS: config.GENERATION_COOLDOWN_SECONDS,
    ENABLE_WATERMARK: config.ENABLE_WATERMARK,
    FREE_IMAGE_QUALITY: config.FREE_IMAGE_QUALITY,
    PAID_IMAGE_QUALITY: config.PAID_IMAGE_QUALITY,
  }
}

export function getResizeSettings(quality) {
  switch (quality) {
    case 'economy':
      return { maxWidth: 1280, jpegQuality: 0.78 }
    case 'high':
      return { maxWidth: 1600, jpegQuality: 0.9 }
    default:
      return { maxWidth: 1440, jpegQuality: 0.84 }
  }
}
