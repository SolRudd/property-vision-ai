import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { buildPageMetadata, SITE_CONFIG } from '../../lib/siteConfig'
import { isSupabaseConfigured, listConceptsForUser } from '../../lib/supabaseAdmin'
import { getSupabaseAuthConfig, getSupabaseAuthState } from '../../lib/supabaseAuth'
import { hydrateConceptStorageUrls } from '../../lib/supabaseStorage'

export const metadata = {
  ...buildPageMetadata({
    title: 'My Gallery',
    description: 'View the landscaping concepts saved to your account.',
    path: '/gallery',
  }),
  robots: {
    index: false,
    follow: false,
  },
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
})

function formatDate(value) {
  if (!value) return 'Saved concept'

  try {
    return DATE_FORMATTER.format(new Date(value))
  } catch {
    return 'Saved concept'
  }
}

function titleForConcept(concept) {
  return concept.prompt_summary || concept.style_label || 'Saved concept'
}

export default async function GalleryPage() {
  const authConfig = getSupabaseAuthConfig()

  if (!authConfig.isConfigured) {
    return (
      <div className="mk-page">
        <header className="mk-header">
          <Link href="/" className="mk-logo">
            {SITE_CONFIG.logoPrimary}
            {SITE_CONFIG.logoAccent && <span>{SITE_CONFIG.logoAccent}</span>}
          </Link>
        </header>

        <main className="mk-main">
          <section className="mk-section">
            <div className="mk-card gv-gallery-empty">
              <div className="mk-kicker">Gallery unavailable</div>
              <h1 className="mk-card-title">Account storage is not configured yet.</h1>
              <p className="mk-card-copy">
                Supabase Auth and server persistence must be configured before user galleries can be shown.
              </p>
              <Link href="/" className="mk-button">
                Return to the app
              </Link>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const authState = await getSupabaseAuthState(cookies())

  if (!authState.user) {
    redirect('/auth?next=%2Fgallery')
  }

  const persistenceReady = isSupabaseConfigured()
  let concepts = []
  let galleryUnavailable = false

  if (persistenceReady) {
    try {
      concepts = await listConceptsForUser(authState.user.id)
      concepts = await hydrateConceptStorageUrls(concepts)
    } catch (error) {
      galleryUnavailable = true
      console.error('[gallery] Failed to load user concepts:', error)
    }
  }

  return (
    <div className="mk-page">
      <header className="mk-header">
        <Link href="/" className="mk-logo">
          {SITE_CONFIG.logoPrimary}
          {SITE_CONFIG.logoAccent && <span>{SITE_CONFIG.logoAccent}</span>}
        </Link>

        <div className="mk-header-actions">
          <Link href="/" className="mk-button mk-button-secondary">
            New preview
          </Link>
          <form action="/auth/logout" method="post">
            <input type="hidden" name="next" value="/" />
            <button type="submit" className="gv-header-reset gv-header-reset-dark">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mk-main">
        <section className="mk-section">
          <div className="mk-section-head">
            <div className="mk-eyebrow">My Gallery</div>
            <h1 className="mk-section-title">Your saved landscaping concepts</h1>
            <p className="mk-section-copy">
              Signed in as <strong>{authState.user.email}</strong>. This gallery stays intentionally lean: just your saved concept records, ready to review or reference in a follow-up conversation.
            </p>
          </div>

          {!persistenceReady || galleryUnavailable ? (
            <div className="mk-card gv-gallery-empty">
              <div className="mk-kicker">Storage unavailable</div>
              <h2 className="mk-card-title">Concept saving is not fully configured.</h2>
              <p className="mk-card-copy">
                The account layer is active, but server persistence still needs the database schema and service role configuration in place before saved concepts can be listed here.
              </p>
            </div>
          ) : concepts.length === 0 ? (
            <div className="mk-card gv-gallery-empty">
              <div className="mk-kicker">No concepts yet</div>
              <h2 className="mk-card-title">Your gallery will appear here after your first saved generation.</h2>
              <p className="mk-card-copy">
                Start a new preview, generate a concept, and it will be linked to this account automatically.
              </p>
              <Link href="/" className="mk-button">
                Create a concept
              </Link>
            </div>
          ) : (
            <div className="gv-gallery-grid">
              {concepts.map((concept) => (
                <article key={concept.id} className="gv-gallery-card">
                  {concept.resultImageUrl || concept.sourceImageUrl ? (
                    <div className="gv-gallery-media">
                      <img
                        src={concept.resultImageUrl || concept.sourceImageUrl}
                        alt={titleForConcept(concept)}
                        className="gv-gallery-image"
                      />
                      {concept.sourceImageUrl &&
                        concept.resultImageUrl &&
                        concept.sourceImageUrl !== concept.resultImageUrl && (
                        <div className="gv-gallery-source-thumb">
                          <img
                            src={concept.sourceImageUrl}
                            alt="Original upload"
                            className="gv-gallery-source-image"
                          />
                          <span className="gv-gallery-source-label">Original</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="gv-gallery-placeholder">
                      <div className="gv-gallery-placeholder-kicker">Saved concept</div>
                      <div className="gv-gallery-placeholder-title">
                        {concept.style_label || 'Landscape direction'}
                      </div>
                    </div>
                  )}

                  <div className="gv-gallery-copy">
                    <div className="gv-gallery-meta">{formatDate(concept.created_at)}</div>
                    <h2 className="gv-gallery-title">{titleForConcept(concept)}</h2>

                    <div className="gv-gallery-tags">
                      {concept.style_label && (
                        <span className="gv-gallery-tag">{concept.style_label}</span>
                      )}
                      {concept.preserve_layout && (
                        <span className="gv-gallery-tag muted">
                          {concept.preserve_layout} layout
                        </span>
                      )}
                      {Array.isArray(concept.modifiers) &&
                        concept.modifiers.slice(0, 2).map((modifier) => (
                          <span key={modifier} className="gv-gallery-tag muted">
                            {modifier.replace(/-/g, ' ')}
                          </span>
                        ))}
                    </div>

                    {concept.optional_note && (
                      <p className="gv-gallery-note">Note: {concept.optional_note}</p>
                    )}

                    <p className="gv-gallery-subtle">
                      {concept.mode === 'demo'
                        ? 'Demo preview'
                        : `${concept.provider || 'Gemini'} · ${concept.quality || 'standard'}`}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
