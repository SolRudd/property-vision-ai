import { getCanonicalUrl } from '../lib/siteConfig'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: getCanonicalUrl('/sitemap.xml'),
  }
}
