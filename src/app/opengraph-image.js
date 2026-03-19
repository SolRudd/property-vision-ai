import { ImageResponse } from 'next/og'
import { SITE_CONFIG } from '../lib/siteConfig'

export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px',
          background:
            'linear-gradient(135deg, #18261a 0%, #24362a 42%, #f5f2ec 120%)',
          color: '#e6d9c0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            borderRadius: '999px',
            border: '1px solid rgba(124,185,134,0.28)',
            background: 'rgba(124,185,134,0.08)',
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Landscaping Visualisations
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1,
              fontWeight: 600,
              maxWidth: 900,
            }}
          >
            {SITE_CONFIG.name}
          </div>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              maxWidth: 900,
              color: 'rgba(230,217,192,0.88)',
            }}
          >
            {SITE_CONFIG.description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: 'rgba(230,217,192,0.72)',
          }}
        >
          <div>Faithful garden, patio, driveway, and exterior concepts</div>
          <div>{SITE_CONFIG.url.replace(/^https?:\/\//, '')}</div>
        </div>
      </div>
    ),
    size
  )
}
