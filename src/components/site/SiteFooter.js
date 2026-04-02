import Image from 'next/image'
import Link from 'next/link'
import { SITE_CONFIG } from '../../lib/siteConfig'
import BrandMark from '../BrandMark'

function renderMetaItems(items, defaultClassName) {
  return items.map((item) => {
    const className =
      Object.prototype.hasOwnProperty.call(item, 'className') ? item.className : defaultClassName

    if (item.href) {
      return (
        <Link key={`${item.href}-${item.label}`} href={item.href} className={className}>
          {item.label}
        </Link>
      )
    }

    return (
      <span key={item.label} className={className}>
        {item.label}
      </span>
    )
  })
}

function LandingBrand({ copy }) {
  return (
    <div className="lp-footer-brand">
      <Link href="/" className="lp-logo" aria-label="Home">
        <Image
          src="/branding/garden-visionary-logo.png"
          alt={SITE_CONFIG.logoAlt}
          width={260}
          height={54}
          className="lp-logo-image-footer"
        />
      </Link>
      {copy && <p className="lp-footer-copy">{copy}</p>}
    </div>
  )
}

function MarketingBrand({ copy }) {
  return (
    <div className="mk-footer-brand">
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
      {copy && <p className="mk-footer-copy">{copy}</p>}
    </div>
  )
}

export default function SiteFooter({
  variant = 'marketing',
  copy,
  navItems = [],
  footerColumns = [],
  metaItems,
  showBrand = true,
}) {
  const year = new Date().getFullYear()

  if (variant === 'landing') {
    const resolvedMetaItems = metaItems || [
      { label: `© ${year} ${SITE_CONFIG.name}. All rights reserved.` },
      { label: 'Concept images are for inspiration purposes only.' },
    ]

    return (
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            {showBrand && <LandingBrand copy={copy} />}
            {footerColumns.length > 0 && (
              <nav className="lp-footer-nav" aria-label="Footer">
                {footerColumns.map((column) => (
                  <div key={column.title} className="lp-footer-col">
                    <span className="lp-footer-heading">{column.title}</span>
                    {column.links.map((item) => (
                      <Link key={item.href} href={item.href} className="lp-footer-link">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            )}
          </div>

          <div className="lp-footer-bottom">{renderMetaItems(resolvedMetaItems, 'lp-footer-meta')}</div>
        </div>
      </footer>
    )
  }

  const resolvedMetaItems = metaItems || [
    { label: `© ${year} ${SITE_CONFIG.name}. All rights reserved.` },
    { label: 'Concept images are for inspiration purposes only.' },
  ]

  return (
    <footer className="mk-footer">
      {(showBrand || navItems.length > 0) && (
        <div className="mk-footer-inner">
          {showBrand && <MarketingBrand copy={copy} />}
          {navItems.length > 0 && (
            <nav className="mk-footer-links" aria-label="Footer">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="mk-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      )}

      <div className="mk-footer-inner">
        <div className="mk-footer-meta">{renderMetaItems(resolvedMetaItems, '')}</div>
      </div>
    </footer>
  )
}
