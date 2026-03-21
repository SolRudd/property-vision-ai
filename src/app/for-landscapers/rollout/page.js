import MarketingShell from '../../../components/MarketingShell'
import { buildPageMetadata } from '../../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Landscaper Rollout',
  description:
    'Consultation-led rollout options for landscaping companies, including pilot, branded rollout, and custom deployment paths.',
  path: '/for-landscapers/rollout',
})

const ROLLOUT_OPTIONS = [
  {
    name: 'Pilot',
    copy:
      'A lean branded launch for one landscaping business using the current app and the existing branded route structure.',
    items: [
      'One branded company page',
      'Hosted rollout by default',
      'Lead destination setup',
      'Premium presentation without dashboard overhead',
    ],
  },
  {
    name: 'Branded rollout',
    copy:
      'A more tailored company setup for businesses that want a stronger brand fit, richer lead flow, or a more polished rollout path.',
    items: [
      'Expanded branded page setup',
      'Hosted page or embed scoping where appropriate',
      'Refined lead-routing and consultation flow',
      'Setup support around launch and handoff',
    ],
  },
  {
    name: 'Custom',
    copy:
      'For multi-brand businesses, agencies, or more bespoke rollout needs that go beyond the standard pilot shape.',
    items: [
      'Multiple brand variants',
      'Custom workflow and routing discussions',
      'Broader implementation scope',
      'Consultation-led quoting',
    ],
  },
]

export default function LandscaperRolloutPage() {
  return (
    <MarketingShell
      eyebrow="Landscaper rollout"
      title="Consultation-led rollout options for landscaping companies"
      description="Choose the level of branded rollout that fits your business. This is positioned as setup work, not as a self-serve software package."
      primaryCta={{ href: '/contact', label: 'Discuss rollout' }}
      secondaryCta={{ href: '/for-landscapers', label: 'Back to landscaper overview' }}
      panel={
        <>
          <div className="mk-panel-kicker">Simple structure</div>
          <div className="mk-panel-title">Pilot, branded rollout, or custom</div>
          <p className="mk-panel-copy">
            The goal is to keep rollout options clear and consultation-led, without inventing unnecessary tiers or enterprise packaging.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-pricing-grid">
          {ROLLOUT_OPTIONS.map((option) => (
            <article key={option.name} className="mk-card mk-price-card">
              <div className="mk-kicker">{option.name}</div>
              <h2 className="mk-card-title">{option.name}</h2>
              <p className="mk-card-copy">{option.copy}</p>
              <ul className="mk-list">
                {option.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
