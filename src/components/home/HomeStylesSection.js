import Link from 'next/link'
import { STYLES } from '../../lib/stylesCatalog'

export default function HomeStylesSection() {
  return (
    <section className="lp-styles-section" aria-labelledby="styles-heading">
      <div className="lp-section-inner">
        <div className="lp-section-header lp-header-center">
          <h2 className="lp-kicker" id="styles-heading">Curated Directions</h2>
          <p className="lp-section-title">Explore our available styles</p>
        </div>
        <div className="lp-styles-grid">
          {STYLES.map((style) => (
            <Link
              key={style.id}
              href={`/generate?style=${style.id}`}
              className="lp-style-pill"
            >
              <span className="lp-style-cat">{style.category}</span>
              <span className="lp-style-sep">/</span>
              <span className="lp-style-name">{style.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
