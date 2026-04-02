import Link from 'next/link'

export default function HomeAudiencePaths() {
  return (
    <section className="lp-paths" aria-labelledby="paths-heading">
      <div className="lp-section-inner">
        <div className="lp-section-header">
          <h2 className="lp-kicker" id="paths-heading">Who it&apos;s for</h2>
          <p className="lp-section-title">Tailored for your goals.</p>
        </div>
        <div className="lp-paths-grid">
          <Link href="/pricing" className="lp-path-card lp-path-primary">
            <div className="lp-path-content">
              <div className="lp-path-tag">For homeowners</div>
              <h3 className="lp-path-title">Visualise your space</h3>
              <p className="lp-path-copy">
                Start with a free preview. Explore what your garden could look
                like before spending anything. Customer plans available for ongoing use.
              </p>
              <span className="lp-path-link">View customer plans <span aria-hidden="true">→</span></span>
            </div>
          </Link>

          <Link href="/for-landscapers" className="lp-path-card lp-path-pro">
            <div className="lp-path-content">
              <div className="lp-path-tag lp-tag-pro">For landscaping companies</div>
              <h3 className="lp-path-title">Branded rollout</h3>
              <p className="lp-path-copy">
                Use a white-labelled AI visualiser with your company branding,
                enhanced lead capture, and consultation-led pricing options.
              </p>
              <span className="lp-path-link lp-link-pro">Explore the landscaper path <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
