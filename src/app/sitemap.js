import { getCanonicalUrl } from '../lib/siteConfig'

export default function sitemap() {
  return [
    {
      url: getCanonicalUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
