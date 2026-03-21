function normaliseSiteUrl(value) {
  const fallback = 'https://example.com'
  const candidate = String(value || fallback).trim()

  if (!candidate) return fallback

  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`)
    return url.toString().replace(/\/$/, '')
  } catch {
    return fallback
  }
}

export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'GardenVision AI',
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || 'GardenVision',
  logoPrimary: process.env.NEXT_PUBLIC_LOGO_PRIMARY || 'Garden',
  logoAccent: process.env.NEXT_PUBLIC_LOGO_ACCENT ?? 'Vision',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Upload a property photo and preview a premium landscaping concept that stays faithful to the real space.',
  url: normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  companyTag: process.env.NEXT_PUBLIC_COMPANY_TAG || null,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@example.com',
  leadFormHeading:
    process.env.NEXT_PUBLIC_LEAD_FORM_HEADING || 'Request a landscaping quote',
  leadFormCTA:
    process.env.NEXT_PUBLIC_LEAD_FORM_CTA || 'Continue with this design',
  ogImagePath: process.env.NEXT_PUBLIC_OG_IMAGE_PATH || '/opengraph-image',
  locale: 'en_GB',
}

export function getCanonicalUrl(path = '/') {
  return new URL(path, `${SITE_CONFIG.url}/`).toString()
}

function getDefaultOgImage() {
  return {
    url: SITE_CONFIG.ogImagePath,
    width: 1200,
    height: 630,
    alt: `${SITE_CONFIG.name} preview`,
  }
}

export function buildPageMetadata({ title, description, path }) {
  const canonicalUrl = getCanonicalUrl(path)
  const openGraphTitle = `${title} | ${SITE_CONFIG.name}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: SITE_CONFIG.locale,
      title: openGraphTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [getDefaultOgImage()],
    },
    twitter: {
      card: 'summary_large_image',
      title: openGraphTitle,
      description,
      images: [SITE_CONFIG.ogImagePath],
    },
  }
}

export function getSiteMetadata() {
  const defaultTitle = `${SITE_CONFIG.name} | Exterior Landscaping Visualisations`

  return {
    metadataBase: new URL(`${SITE_CONFIG.url}/`),
    title: {
      default: defaultTitle,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    applicationName: SITE_CONFIG.shortName,
    description: SITE_CONFIG.description,
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: SITE_CONFIG.locale,
      url: SITE_CONFIG.url,
      title: defaultTitle,
      description: SITE_CONFIG.description,
      siteName: SITE_CONFIG.name,
      images: [getDefaultOgImage()],
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: SITE_CONFIG.description,
      images: [SITE_CONFIG.ogImagePath],
    },
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg',
    },
  }
}
