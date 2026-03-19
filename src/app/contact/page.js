import MarketingShell from '../../components/MarketingShell'
import { SITE_CONFIG, buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'Request a demo, discuss a landscaper pilot, or scope a branded rollout for the landscaping concept preview tool.',
  path: '/contact',
})

const REQUEST_POINTS = [
  'Your company name and website',
  'Whether you want a pilot page or a broader branded rollout',
  'Where leads should be sent',
  'Any deadline, campaign, or rollout timing',
]

const USE_CASES = [
  {
    title: 'Request a demo',
    body:
      'Best if you want to see the current homeowner flow, branded company routes, and lead capture process before deciding on rollout scope.',
  },
  {
    title: 'Discuss a pilot',
    body:
      'Best if you want one branded landing page for a landscaping company and need a lean launch plan rather than a full platform commitment.',
  },
  {
    title: 'Scope custom rollout',
    body:
      'Best if you want multi-brand support, custom routing, or a more tailored deployment built on top of the current app foundation.',
  },
]

export default function ContactPage() {
  const mailtoHref = `mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent('Demo / rollout enquiry')}`

  return (
    <MarketingShell
      eyebrow="Contact"
      title="Request a demo or rollout conversation"
      description="Use this page to start a pilot discussion, ask about branded company landing pages, or scope a custom rollout for your landscaping business."
      primaryCta={{ href: mailtoHref, label: `Email ${SITE_CONFIG.contactEmail}` }}
      secondaryCta={{ href: '/pricing', label: 'View pricing' }}
      panel={
        <>
          <div className="mk-panel-kicker">Simple next step</div>
          <div className="mk-panel-title">No heavy sales flow</div>
          <p className="mk-panel-copy">
            A short demo or rollout conversation is the right fit at this stage. The product is ready for pilot discussions, not a complex enterprise procurement flow.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-grid mk-grid-3">
          {USE_CASES.map((item) => (
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
            <div className="mk-kicker">What to send</div>
            <h2 className="mk-card-title">Helpful context for a fast reply</h2>
            <ul className="mk-list">
              {REQUEST_POINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Direct contact</div>
            <h2 className="mk-card-title">{SITE_CONFIG.contactEmail}</h2>
            <p className="mk-card-copy">
              Email is the leanest contact route for this stage of the product. It keeps demo requests, pilot setup, and custom rollout discussions simple without adding a separate dashboard or CRM layer.
            </p>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
