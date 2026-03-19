import MarketingShell from '../../components/MarketingShell'
import { buildPageMetadata } from '../../lib/siteConfig'

export const metadata = buildPageMetadata({
  title: 'For Landscapers',
  description:
    'See how landscaping companies can use branded preview pages, controlled concept generation, and lead capture without a heavy software rollout.',
  path: '/for-landscapers',
})

const BENEFITS = [
  {
    title: 'What the tool does today',
    body:
      'Homeowners upload a real property photo, choose a controlled style direction, and receive a faithful landscaping concept preview built for garden, patio, driveway, and exterior improvement conversations.',
  },
  {
    title: 'How branded company pages work',
    body:
      'Each company can run a branded route with its own name, logo, hero copy, theme colours, website link, and lead destination metadata, while still using the same single app.',
  },
  {
    title: 'Why landscapers use it',
    body:
      'It gives prospects a premium first interaction, helps qualify visual intent earlier, and creates a more useful lead handoff than a plain contact form alone.',
  },
]

const WORKFLOW = [
  'A homeowner lands on a branded company page and uploads a property photo.',
  'They generate a controlled preview from preset styles, modifiers, and layout-preservation settings.',
  'When they continue, the lead includes concept metadata so the landscaper sees the chosen direction, layout preference, and result summary.',
]

const ROLLOUT = [
  'Single branded pilot page for one landscaping company',
  'Theme, logo, copy, and lead routing setup',
  'Supabase-backed lead and concept storage for MVP rollout',
  'Custom domain, multi-brand rollout, and deeper workflow setup as custom work',
]

export default function ForLandscapersPage() {
  return (
    <MarketingShell
      eyebrow="B2B rollout"
      title="A premium visual lead magnet for landscaping companies"
      description="Use the current concept preview tool as a branded consultation entry point. Keep the homeowner flow simple, keep the experience premium, and capture better-qualified landscaping enquiries."
      primaryCta={{ href: '/contact', label: 'Request a demo' }}
      secondaryCta={{ href: '/pricing', label: 'View pricing' }}
      panel={
        <>
          <div className="mk-panel-kicker">Live MVP scope</div>
          <div className="mk-panel-title">What already exists</div>
          <p className="mk-panel-copy">
            Controlled image generation, branded company routes, Supabase lead capture, lightweight usage tracking, and consultation-ready summaries.
          </p>
        </>
      }
    >
      <section className="mk-section">
        <div className="mk-section-head">
          <div className="mk-kicker">How it fits</div>
          <h2 className="mk-section-title">Lean enough for pilot rollout, strong enough for sales conversations</h2>
          <p className="mk-section-copy">
            This is not a contractor dashboard or a bloated design suite. It is a focused front-end experience for generating visually persuasive landscaping concepts and routing the enquiry cleanly.
          </p>
        </div>

        <div className="mk-grid mk-grid-3">
          {BENEFITS.map((item) => (
            <article key={item.title} className="mk-card">
              <h3 className="mk-card-title">{item.title}</h3>
              <p className="mk-card-copy">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-grid mk-grid-2">
          <article className="mk-card">
            <div className="mk-kicker">Lead capture</div>
            <h2 className="mk-card-title">How the lead handoff works</h2>
            <ul className="mk-list">
              {WORKFLOW.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </article>

          <article className="mk-card mk-card-dark">
            <div className="mk-kicker">Custom rollout</div>
            <h2 className="mk-card-title">Available as setup work</h2>
            <ul className="mk-list mk-list-dark">
              {ROLLOUT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mk-note">
              Custom options are available now as scoped rollout work, not as a self-serve dashboard yet.
            </p>
          </article>
        </div>
      </section>
    </MarketingShell>
  )
}
