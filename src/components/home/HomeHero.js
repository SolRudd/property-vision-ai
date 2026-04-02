import Link from 'next/link'

export default function HomeHero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">
        <div className="lp-hero-content">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">AI-Powered Landscape Visualisation</div>
            <h1 className="lp-h1">
              <span className="lp-h1-muted">Your garden,</span>
              <br />
              redesigned.
            </h1>
            <p className="lp-hero-sub">
              Upload a real photo of your outdoor space and see a faithful concept
              of how it could look — based on your actual property, not a generic template.
            </p>
            <div className="lp-hero-cta-row">
              <Link href="/generate" className="lp-btn-primary lp-btn-lg">
                See your garden transformed
                <span className="lp-btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="lp-hero-note">
              Free to try · No sign-up required · Results in ~60s
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-scanner-stage">
              <div className="lp-scanner-before">
                <span className="lp-scanner-badge lp-badge-left">Original Space</span>
              </div>

              <div className="lp-scanner-after">
                <span className="lp-scanner-badge lp-badge-right">AI Concept</span>

                <div className="lp-scanner-handle">
                  <div className="lp-handle-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <p className="lp-canvas-caption">Concepts generated directly from uploaded photos.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
