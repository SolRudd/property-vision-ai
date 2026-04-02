import Link from 'next/link'

const STEPS = [
  {
    n: '01',
    title: 'Upload your photo',
    desc: 'Take a daylight photo of your garden, patio, or driveway. Landscape orientation and full coverage of the space gives the best results.',
  },
  {
    n: '02',
    title: 'Choose a direction',
    desc: 'Pick from 15 design styles — from Modern Minimal to Cottage Garden. Adjust layout preservation and add optional refinements.',
  },
  {
    n: '03',
    title: 'Compare before & after',
    desc: 'See a faithful concept of your transformed space in around 60 seconds. Explore variations or continue to a consultation.',
  },
]

export default function HomeHowItWorks() {
  return (
    <section className="lp-how" aria-labelledby="how-heading">
      <div className="lp-section-inner">
        <div className="lp-section-header">
          <h2 className="lp-kicker" id="how-heading">How it works</h2>
          <p className="lp-section-title">Imagination with control.</p>
        </div>

        <div className="lp-how-grid">
          {STEPS.map((step) => (
            <div key={step.n} className="lp-how-step">
              <div className="lp-how-num" aria-hidden="true">{step.n}</div>
              <h3 className="lp-how-title">{step.title}</h3>
              <p className="lp-how-desc">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="lp-how-cta">
          <Link href="/generate" className="lp-btn-outline lp-btn-lg">
            Start with your garden photo
            <span className="lp-btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
