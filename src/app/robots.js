import { SITE_CONFIG, getCanonicalUrl } from '../lib/siteConfig'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth', '/gallery'],
      },
    ],
    host: SITE_CONFIG.url,
    sitemap: getCanonicalUrl('/sitemap.xml'),
  }
}
