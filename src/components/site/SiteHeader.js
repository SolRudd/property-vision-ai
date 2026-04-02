import Image from 'next/image'
import Link from 'next/link'
import BrandMark from '../BrandMark'
import { SITE_CONFIG } from '../../lib/siteConfig'

function renderNavItems(items = [], className) {
  return items.map((item) => (
    <Link key={item.href} href={item.href} className={className}>
      {item.label}
    </Link>
  ))
}

function LandingBrand() {
  return (
    <Link href="/" className="lp-logo" aria-label="Home">
      <Image
        src="/branding/garden-visionary-logo.png"
        alt={SITE_CONFIG.logoAlt}
        width={340}
        height={70}
        priority
        className="lp-logo-image"
      />
    </Link>
  )
}

function MarketingBrand() {
  return (
    <Link href="/" className="mk-logo">
      <BrandMark
        logo={{
          imageSrc: SITE_CONFIG.logoImageSrc,
          primaryText: SITE_CONFIG.logoPrimary,
          accentText: SITE_CONFIG.logoAccent,
          alt: SITE_CONFIG.logoAlt,
        }}
        companyName={SITE_CONFIG.name}
        imageClassName="mk-logo-img"
      />
    </Link>
  )
}

export default function SiteHeader({
  variant = 'marketing',
  navItems = [],
  actions = null,
  ariaLabel = 'Main',
  withBar = false,
}) {
  if (variant === 'landing') {
    return (
      <header className="lp-header">
        <nav className="lp-nav" aria-label={ariaLabel}>
          <LandingBrand />
          {navItems.length > 0 && <div className="lp-nav-links">{renderNavItems(navItems, 'lp-nav-link')}</div>}
          {actions}
        </nav>
      </header>
    )
  }

  const header = (
    <header className="mk-header">
      <MarketingBrand />
      {navItems.length > 0 && <nav className="mk-nav" aria-label={ariaLabel}>{renderNavItems(navItems, 'mk-link')}</nav>}
      {actions}
    </header>
  )

  if (withBar) {
    return <div className="mk-header-bar">{header}</div>
  }

  return header
}
