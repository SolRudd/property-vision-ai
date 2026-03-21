import MarketingShell from '../../components/MarketingShell'
import { SITE_CONFIG, buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'Get in touch about customer plans, branded landscaper rollout, or a custom consultation for the landscaping visual preview product.',
  path: '/contact',
})

const CONTACT_PATHS = [
  {
    title: 'Homeowners',
    body:
      'Use this route if you want to ask about the customer image plans or the current free preview experience.',
  },
  {
    title: 'Landscaping companies',
    body:
      'Use this route if you want to discuss a branded AI visualiser, better enquiry capture, or a hosted company page.',
  },
  {
    title: 'Custom rollout',
    body:
      'Use this route if you need embed scoping, multi-brand setup, or a broader consultation-led deployment.',
  },
]

const REQUEST_POINTS = [
  'Which path you are interested in: homeowner plans or landscaper rollout',
  'Your company name and website if this is a B2B enquiry',
  'Any preferred timing or campaign deadline',
  'Where you would want leads or enquiries to go',
]

export default function ContactPage() {
  const mailtoHref = `mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent('GardenVision enquiry')}`

  return (
    <MarketingShell
      eyebrow="Contact"
      title="Talk through plans, rollout, or the next step"
      description="This page supports both audience paths. Use it for customer plan questions, landscaper demos, or custom rollout conversations."
      primaryCta={{ href: mailtoHref, label: `Email ${SITE_CONFIG.contactEmail}` }}
      secondaryCta={{ href: '/', label: 'Try the preview' }}
      panel={
        <>
          <div className="mk-panel-kicker">Lean by design</div>
          <div className="mk-panel-title">Simple contact, not a heavy sales funnel</div>
          <p className="mk-panel-copy">
            Email is the cleanest route for this stage. It keeps customer questions and B2B rollout discussions clear without adding extra account or CRM complexity.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-grid mk-grid-3">
          {CONTACT_PATHS.map((item) => (
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
            <div className="mk-kicker">Helpful context</div>
            <h2 className="mk-card-title">What to include</h2>
            <ul className="mk-list">
              {REQUEST_POINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Direct email</div>
            <h2 className="mk-card-title">{SITE_CONFIG.contactEmail}</h2>
            <p className="mk-card-copy">
              Best for customer plan questions, branded landscaper demos, and custom rollout discussions.
            </p>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
