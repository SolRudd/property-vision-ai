import { SITE_CONFIG, buildPageMetadata } from './siteConfig'

// Lean MVP config source for partner/company landing pages.
// This can move to Supabase later without changing the route shape.

const DEFAULT_THEME = {
  accent: '#4a7c59',
  accentSoft: '#e8f4eb',
  accentMuted: '#7cb986',
  dark: '#18261a',
  darkHover: '#2e4831',
  background: '#f5f2ec',
  surface: '#ffffff',
  surfaceMuted: '#faf7f2',
  border: '#e4dfd6',
  ink: '#18261a',
  subtle: '#556b57',
  subtleMuted: '#94a895',
  cream: '#e6d9c0',
}

export const PUBLIC_EXPERIENCE_CONFIG = {
  slug: 'public',
  companyName: SITE_CONFIG.name,
  logo: {
    imageSrc: null,
    primaryText: SITE_CONFIG.logoPrimary,
    accentText: SITE_CONFIG.logoAccent,
    alt: SITE_CONFIG.name,
  },
  heroHeadline: 'Your outdoor space,\nbeautifully reimagined',
  heroSubtext:
    'Upload a photo of your garden, patio, or driveway. Choose a style. Get a professionally inspired landscaping concept — ready to share with your landscaper.',
  ctaLabel: 'Begin your preview',
  leadFormHeading: SITE_CONFIG.leadFormHeading,
  leadFormCTA: SITE_CONFIG.leadFormCTA,
  companyTag: SITE_CONFIG.companyTag,
  websiteLink: SITE_CONFIG.url,
  leadDestination: {
    type: 'default',
    label: SITE_CONFIG.name,
    routingKey: 'public',
  },
  theme: DEFAULT_THEME,
}

export const COMPANY_CONFIGS = {
  'oakleaf-landscapes': {
    slug: 'oakleaf-landscapes',
    companyName: 'Oakleaf Landscapes',
    logo: {
      imageSrc: null,
      primaryText: 'Oakleaf',
      accentText: 'Landscapes',
      alt: 'Oakleaf Landscapes',
    },
    heroHeadline: 'See your next garden concept before the first spade goes in',
    heroSubtext:
      'Upload a property photo and preview a premium Oakleaf-inspired landscaping direction in minutes.',
    ctaLabel: 'Start your Oakleaf preview',
    companyTag: 'Prepared for Oakleaf Landscapes',
    websiteLink: 'https://oakleaflandscapes.example',
    leadDestination: {
      type: 'landscaper-team',
      label: 'Oakleaf Landscapes Enquiries',
      routingKey: 'oakleaf-landscapes',
    },
    theme: {
      accent: '#7a6a2f',
      accentSoft: '#f4ede0',
      accentMuted: '#b69755',
      dark: '#1d2118',
      darkHover: '#303626',
    },
  },
  'northstone-outdoors': {
    slug: 'northstone-outdoors',
    companyName: 'Northstone Outdoors',
    logo: {
      imageSrc: null,
      primaryText: 'Northstone',
      accentText: 'Outdoors',
      alt: 'Northstone Outdoors',
    },
    heroHeadline: 'Preview a refined outdoor renovation tailored to your property',
    heroSubtext:
      'Create a faithful before-and-after landscaping concept aligned to the Northstone Outdoors design approach.',
    ctaLabel: 'Create your Northstone preview',
    companyTag: 'Prepared for Northstone Outdoors',
    websiteLink: 'https://northstoneoutdoors.example',
    leadDestination: {
      type: 'landscaper-team',
      label: 'Northstone Outdoors Consultations',
      routingKey: 'northstone-outdoors',
    },
    theme: {
      accent: '#316a70',
      accentSoft: '#e5f1f1',
      accentMuted: '#6da4aa',
      dark: '#162225',
      darkHover: '#24343a',
    },
  },
}

function mergeTheme(theme = {}) {
  return {
    ...DEFAULT_THEME,
    ...theme,
  }
}

export function resolveExperienceConfig(config) {
  const merged = {
    ...PUBLIC_EXPERIENCE_CONFIG,
    ...config,
    logo: {
      ...PUBLIC_EXPERIENCE_CONFIG.logo,
      ...(config?.logo || {}),
    },
    leadDestination: {
      ...PUBLIC_EXPERIENCE_CONFIG.leadDestination,
      ...(config?.leadDestination || {}),
    },
    theme: mergeTheme(config?.theme),
  }

  return merged
}

export function getCompanyExperienceConfig(companySlug) {
  const companyConfig = companySlug ? COMPANY_CONFIGS[companySlug] : null
  return companyConfig ? resolveExperienceConfig(companyConfig) : null
}

export function getPublicExperienceConfig() {
  return resolveExperienceConfig(PUBLIC_EXPERIENCE_CONFIG)
}

export function listCompanySlugs() {
  return Object.keys(COMPANY_CONFIGS)
}

export function buildCompanyMetadata(config) {
  const resolved = resolveExperienceConfig(config)
  const title = `${resolved.companyName} | Landscaping Visualisations`
  const description = resolved.heroSubtext

  return buildPageMetadata({
    title,
    description,
    path: `/${resolved.slug}`,
  })
}
