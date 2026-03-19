import MarketingShell from '../../components/MarketingShell'
import { buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Pricing',
  description:
    'Honest pricing for the current landscaping concept MVP, including free homeowner previews, landscaper pilot rollout, and custom branded deployments.',
  path: '/pricing',
})

const PLANS = [
  {
    name: 'Homeowner preview',
    price: 'Free',
    copy:
      'The live public experience for testing the product and showing homeowners how the preview flow works today.',
    features: [
      'Upload a real garden or exterior photo',
      'Controlled styles, modifiers, and layout preservation',
      'Up to 3 free generations per session',
      'Lead continuation after the result',
    ],
    note: 'Best for public preview and early homeowner demand testing.',
  },
  {
    name: 'Landscaper pilot',
    price: 'Custom',
    copy:
      'A lean branded pilot for one landscaping company using the current app structure and today’s working feature set.',
    features: [
      'One branded company landing page',
      'Company logo, headline, copy, and theme tokens',
      'Lead destination metadata and webhook-ready handoff',
      'Supabase concept, usage, and lead storage',
    ],
    note: 'Quoted around setup scope, branding, routing, and rollout support.',
  },
  {
    name: 'Branded rollout',
    price: 'Custom / from scope',
    copy:
      'For agencies or landscaping groups that want a more tailored deployment, multi-brand support, or custom implementation work.',
    features: [
      'Additional branded landing pages',
      'Custom domain and rollout planning',
      'Lead routing and operational setup',
      'Future integrations scoped as custom work',
    ],
    note: 'Only offered as custom setup work at this stage.',
  },
]

const COMING_SOON = [
  'Company configs managed directly from Supabase',
  'Deeper usage reporting for B2B rollout',
  'More flexible operational workflows',
]

export default function PricingPage() {
  return (
    <MarketingShell
      eyebrow="Pricing"
      title="Honest pricing for the current stage of the product"
      description="The public homeowner experience is live now. Branded landscaper pilots and custom rollout work are available by consultation, based on the current feature set and setup scope."
      primaryCta={{ href: '/contact', label: 'Request a consultation' }}
      secondaryCta={{ href: '/for-landscapers', label: 'See B2B rollout' }}
      panel={
        <>
          <div className="mk-panel-kicker">No fake tiers</div>
          <div className="mk-panel-title">Priced around what exists</div>
          <p className="mk-panel-copy">
            This page only describes the current MVP, branded pilot setup, and custom rollout work. Features that do not exist yet are not sold as live product capability.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-pricing-grid">
          {PLANS.map((plan) => (
            <article key={plan.name} className="mk-card mk-price-card">
              <div className="mk-kicker">{plan.name}</div>
              <div className="mk-price">{plan.price}</div>
              <p className="mk-card-copy">{plan.copy}</p>
              <ul className="mk-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <p className="mk-note">{plan.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-grid mk-grid-2">
          <article className="mk-card">
            <div className="mk-kicker">Coming soon</div>
            <h2 className="mk-card-title">Planned, not sold as live today</h2>
            <ul className="mk-list">
              {COMING_SOON.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Best next step</div>
            <h2 className="mk-card-title">Request a demo or rollout consultation</h2>
            <p className="mk-card-copy">
              If you want to test a landscaper pilot, discuss branded rollout options, or scope a custom deployment, the right next step is a short demo conversation rather than a self-serve checkout.
            </p>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
