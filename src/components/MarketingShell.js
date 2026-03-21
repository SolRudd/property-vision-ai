import Link from 'next/link'
import { SITE_CONFIG } from '../lib/siteConfig'

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

function BrandMark() {
  return (
    <>
      {SITE_CONFIG.logoPrimary}
      {SITE_CONFIG.logoAccent && <span>{SITE_CONFIG.logoAccent}</span>}
    </>
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
      <header className="mk-header">
        <Link href="/" className="mk-logo">
          <BrandMark />
        </Link>

        <nav className="mk-nav" aria-label="Marketing">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="mk-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mk-header-actions">
          <Link href="/" className="mk-button mk-button-secondary">
            Try the preview
          </Link>
          <Link href="/contact" className="mk-button">
            Request a demo
          </Link>
        </div>
      </header>

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

      <footer className="mk-footer">
        <div className="mk-footer-inner">
          <div className="mk-footer-brand">
            <div className="mk-logo">
              <BrandMark />
            </div>
            <p className="mk-footer-copy">
              Premium landscaping visual previews for homeowners and lean branded rollout options for landscaping companies.
            </p>
          </div>

          <div className="mk-footer-links">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="mk-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
