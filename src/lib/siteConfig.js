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
  ogImagePath: '/opengraph-image',
}

export function getCanonicalUrl(path = '/') {
  return new URL(path, `${SITE_CONFIG.url}/`).toString()
}

export function buildPageMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path),
    },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
      url: getCanonicalUrl(path),
      siteName: SITE_CONFIG.name,
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
    description: SITE_CONFIG.description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: SITE_CONFIG.url,
      title: defaultTitle,
      description: SITE_CONFIG.description,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: SITE_CONFIG.ogImagePath,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.name} preview`,
        },
      ],
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
