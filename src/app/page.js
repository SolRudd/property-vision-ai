import Link from 'next/link'
import HomeAudiencePaths from '../components/home/HomeAudiencePaths'
import HomeFinalCta from '../components/home/HomeFinalCta'
import HomeHero from '../components/home/HomeHero'
import HomeHowItWorks from '../components/home/HomeHowItWorks'
import HomeStylesSection from '../components/home/HomeStylesSection'
import HomeTrustStrip from '../components/home/HomeTrustStrip'
import SiteFooter from '../components/site/SiteFooter'
import SiteHeader from '../components/site/SiteHeader'
import { buildPageMetadata } from '../lib/siteConfig'

const HOME_NAV_ITEMS = [
  { href: '/pricing', label: 'Customer Plans' },
  { href: '/for-landscapers', label: 'For Landscapers' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
]

const HOME_FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/generate', label: 'Try free' },
      { href: '/pricing', label: 'Customer Plans' },
      { href: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'Professionals',
    links: [
      { href: '/for-landscapers', label: 'For Landscapers' },
      { href: '/contact', label: 'Contact Sales' },
    ],
  },
]

export const metadata = buildPageMetadata({
  title: 'AI Garden Visualisation — See Your Space Transformed',
  description:
    'Upload a photo of your garden and get a premium AI concept showing how it could look — based on your real outdoor space. Free to try.',
  path: '/',
})

export default function HomePage() {
  return (
    <div className="lp-root">
      <div className="lp-ambient-glow lp-glow-top" aria-hidden="true" />
      <div className="lp-ambient-glow lp-glow-bottom" aria-hidden="true" />

      <SiteHeader
        variant="landing"
        navItems={HOME_NAV_ITEMS}
        actions={
          <div className="lp-nav-actions">
            <Link href="/generate" className="lp-btn-outline lp-btn-sm">
              Try free
            </Link>
          </div>
        }
      />

      <main>
        <HomeHero />
        <HomeTrustStrip />
        <HomeHowItWorks />
        <HomeStylesSection />
        <HomeAudiencePaths />
        <HomeFinalCta />
      </main>

      <SiteFooter
        variant="landing"
        copy="Premium AI garden and outdoor visualisation for homeowners and landscaping professionals."
        footerColumns={HOME_FOOTER_COLUMNS}
      />
    </div>
  )
}
