import Link from 'next/link'

export default function HomeFinalCta() {
  return (
    <section className="lp-final-cta">
      <div className="lp-section-inner lp-final-cta-inner">
        <div className="lp-final-content">
          <p className="lp-final-kicker">Free to start</p>
          <h2 className="lp-final-h2">See your garden&apos;s potential.</h2>
          <p className="lp-final-sub">
            No sign-up required. Upload a photo and generate your first concept in around 60 seconds.
          </p>
          <Link href="/generate" className="lp-btn-primary lp-btn-lg">
            Upload your garden photo
            <span className="lp-btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
