import { getCanonicalUrl } from '../lib/siteConfig'
import { listCompanySlugs } from '../lib/companyConfigs'

export default function sitemap() {
  const staticRoutes = ['/', '/pricing', '/for-landscapers', '/for-landscapers/rollout', '/contact']

  return [
    ...staticRoutes.map((path, index) => ({
      url: getCanonicalUrl(path),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: index === 0 ? 1 : 0.85,
    })),
    ...listCompanySlugs().map((companySlug) => ({
      url: getCanonicalUrl(`/${companySlug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ]
}
