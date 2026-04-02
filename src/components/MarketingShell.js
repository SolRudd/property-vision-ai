import Link from 'next/link'
import SiteFooter from './site/SiteFooter'
import SiteHeader from './site/SiteHeader'

const NAV_ITEMS = [
  { href: '/pricing', label: 'Customer Plans' },
  { href: '/for-landscapers', label: 'For Landscapers' },
  { href: '/contact', label: 'Contact' },
]

function ActionLink({ href, className, children }) {
  if (href.startsWith('mailto:') || href.startsWith('http')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export default function MarketingShell({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  panel,
  children,
}) {
  return (
    <div className="mk-page">
      <SiteHeader
        variant="marketing"
        navItems={NAV_ITEMS}
        ariaLabel="Marketing"
        withBar
        actions={
          <div className="mk-header-actions">
            <Link href="/generate" className="mk-button mk-button-secondary">
              Try free
            </Link>
            <Link href="/contact" className="mk-button">
              Book a demo
            </Link>
          </div>
        }
      />

      <main className="mk-main">
        <section className="mk-hero">
          <div className="mk-hero-copy">
            {eyebrow && <div className="mk-eyebrow">{eyebrow}</div>}
            <h1 className="mk-title">{title}</h1>
            <p className="mk-copy">{description}</p>
            <div className="mk-cta-row">
              {primaryCta && (
                <ActionLink href={primaryCta.href} className="mk-button">
                  {primaryCta.label}
                </ActionLink>
              )}
              {secondaryCta && (
                <ActionLink href={secondaryCta.href} className="mk-button mk-button-secondary">
                  {secondaryCta.label}
                </ActionLink>
              )}
            </div>
          </div>

          {panel && <aside className="mk-panel">{panel}</aside>}
        </section>

        {children}
      </main>

      <SiteFooter
        variant="marketing"
        copy="Premium landscaping visual previews for homeowners and lean branded rollout options for landscaping companies."
        navItems={NAV_ITEMS}
      />
    </div>
  )
}
