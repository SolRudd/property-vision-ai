import MarketingShell from '../../components/MarketingShell'
import { buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Customer Pricing',
  description:
    'Simple customer image plans for homeowners, with clear monthly image allowances and a premium, minimal pricing structure.',
  path: '/pricing',
})

const CUSTOMER_PLANS = [
  {
    name: 'Free',
    allowance: '3 images / month',
    copy:
      'A light monthly allowance for trying the visual preview flow and exploring one direction for your outdoor space.',
  },
  {
    name: 'Plus',
    allowance: '10 images / month',
    copy:
      'For homeowners comparing multiple styles, materials, or layout directions across a single garden or exterior project.',
  },
  {
    name: 'Pro',
    allowance: '100 images / month',
    copy:
      'For heavier concept exploration across larger projects, repeated revisions, or multiple exterior spaces.',
  },
]

const CUSTOMER_NOTES = [
  'The current public MVP remains a free preview while customer billing is prepared.',
  'These tiers describe the intended customer plan structure and monthly image allowances.',
  'Landscaper rollout pricing is handled separately under the B2B path.',
]

export default function PricingPage() {
  return (
    <MarketingShell
      eyebrow="For homeowners"
      title="Simple customer image plans"
      description="This page is for customer image plans only. It keeps the homeowner path separate from branded rollout for landscaping companies."
      primaryCta={{ href: '/', label: 'Try the free preview' }}
      secondaryCta={{ href: '/contact', label: 'Ask a question' }}
      panel={
        <>
          <div className="mk-panel-kicker">Customer pricing</div>
          <div className="mk-panel-title">Clear monthly image allowances</div>
          <p className="mk-panel-copy">
            Premium, simple, and customer-facing. Landscaper rollout is priced separately through the B2B path.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-pricing-grid">
          {CUSTOMER_PLANS.map((plan) => (
            <article key={plan.name} className="mk-card mk-price-card">
              <div className="mk-kicker">{plan.name}</div>
              <div className="mk-price">{plan.allowance}</div>
              <p className="mk-card-copy">{plan.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-grid mk-grid-2">
          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Current status</div>
            <h2 className="mk-card-title">Free preview live now</h2>
            <p className="mk-card-copy">
              The current public product is still positioned as a free preview. The customer plans above define the intended structure for the next stage, without pretending billing is already live.
            </p>
          </article>

          <article className="mk-card">
            <div className="mk-kicker">Notes</div>
            <h2 className="mk-card-title">Kept separate on purpose</h2>
            <ul className="mk-list">
              {CUSTOMER_NOTES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
