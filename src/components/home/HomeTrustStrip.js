const TRUST_ITEMS = [
  { n: '15+', label: 'Design styles' },
  { n: '~60s', label: 'Average generation' },
  { n: '100%', label: 'Grounded in your photo' },
]

export default function HomeTrustStrip() {
  return (
    <section className="lp-trust" aria-label="Performance Metrics">
      <div className="lp-trust-inner">
        {TRUST_ITEMS.map((item, index) => (
          <div key={item.n} className="lp-trust-item">
            {index > 0 && <div className="lp-trust-sep" aria-hidden="true" />}
            <div className="lp-trust-content">
              <span className="lp-trust-n">{item.n}</span>
              <span className="lp-trust-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
