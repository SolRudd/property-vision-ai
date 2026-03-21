import MarketingShell from '../../components/MarketingShell'
import { buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'For Landscaping Companies',
  description:
    'See how landscaping businesses can use a branded AI visualiser, stronger lead capture, and hosted or embedded rollout options without overbuilding the product.',
  path: '/for-landscapers',
})

const VALUE_CARDS = [
  {
    title: 'Branded AI visualiser',
    body:
      'Present the current concept flow under your own company brand, with your logo, hero copy, theme colours, and lead destination metadata.',
  },
  {
    title: 'Lead generation',
    body:
      'Turn a static enquiry into a more visual consultation journey, so prospects arrive with a clearer sense of style, layout preference, and project direction.',
  },
  {
    title: 'Better enquiry capture',
    body:
      'The lead handoff includes concept summary, selected style, modifiers, and layout guidance, which is more useful than a plain contact form alone.',
  },
]

const DELIVERY_OPTIONS = [
  'Hosted branded page is the default rollout path for speed and simplicity.',
  'Optional embed can be scoped where it suits the landscaper’s site and workflow.',
  'Lead routing, webhook handoff, and company metadata can be configured per rollout.',
]

const BUSINESS_FIT = [
  'Landscaping companies that want a premium lead magnet',
  'Design-and-build firms that want better early-stage enquiry quality',
  'Teams that want a branded experience without building a full software platform',
]

export default function ForLandscapersPage() {
  return (
    <MarketingShell
      eyebrow="For landscaping businesses"
      title="A branded visual enquiry experience for landscaping companies"
      description="This path is for landscaping businesses, not homeowners. Use the current product as a branded AI visualiser that helps generate leads, improve enquiry quality, and support consultation-led sales conversations."
      primaryCta={{ href: '/for-landscapers/rollout', label: 'See rollout options' }}
      secondaryCta={{ href: '/contact', label: 'Request a demo' }}
      panel={
        <>
          <div className="mk-panel-kicker">Current B2B value</div>
          <div className="mk-panel-title">Lean rollout, premium presentation</div>
          <p className="mk-panel-copy">
            The current app already supports branded company routes, lead capture, Supabase-backed storage, and consultation-ready concept summaries.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-grid mk-grid-3">
          {VALUE_CARDS.map((item) => (
            <article key={item.title} className="mk-card">
              <h2 className="mk-card-title">{item.title}</h2>
              <p className="mk-card-copy">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-grid mk-grid-2">
          <article className="mk-card">
            <div className="mk-kicker">Delivery options</div>
            <h2 className="mk-card-title">Hosted branded page first, embed if needed</h2>
            <ul className="mk-list">
              {DELIVERY_OPTIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Best fit</div>
            <h2 className="mk-card-title">Who this is built for</h2>
            <ul className="mk-list mk-list-dark">
              {BUSINESS_FIT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
