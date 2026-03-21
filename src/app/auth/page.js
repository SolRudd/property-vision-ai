import Link from 'next/link'
import { cookies } from 'next/headers'
import { buildPageMetadata, SITE_CONFIG } from '../../lib/siteConfig'
import {
  getSupabaseAuthConfig,
  getSupabaseAuthState,
  sanitizeNextPath,
} from '../../lib/supabaseAuth'

export const metadata = {
  ...buildPageMetadata({
    title: 'Account Access',
    description:
      'Create a free account or sign in to save your landscaping concepts and continue your visualisation journey.',
    path: '/auth',
  }),
  robots: {
    index: false,
    follow: false,
  },
}

function readValue(value) {
  return Array.isArray(value) ? value[0] || '' : String(value || '')
}

function getMessage(errorCode, statusCode) {
  if (statusCode === 'check-email') {
    return {
      tone: 'info',
      text: 'Check your inbox to verify your email address, then return here to continue.',
    }
  }

  if (statusCode === 'signed-out') {
    return {
      tone: 'info',
      text: 'You have been signed out.',
    }
  }

  if (errorCode === 'auth_unavailable') {
    return {
      tone: 'error',
      text: 'Account access is not configured yet. Please try again later.',
    }
  }

  if (errorCode === 'invalid_credentials') {
    return {
      tone: 'error',
      text: 'Those details did not match an account. Please try again.',
    }
  }

  if (errorCode === 'signup_failed') {
    return {
      tone: 'error',
      text: 'We could not create that account just now. Please try again.',
    }
  }

  if (errorCode === 'verification_failed' || errorCode === 'missing_code') {
    return {
      tone: 'error',
      text: 'That verification link could not be completed. Please request a fresh sign-up email.',
    }
  }

  return null
}

export default async function AuthPage({ searchParams }) {
  const authConfig = getSupabaseAuthConfig()
  const nextPath = sanitizeNextPath(readValue(searchParams?.next), '/')
  const statusCode = readValue(searchParams?.status)
  const errorCode = readValue(searchParams?.error)
  const message = getMessage(errorCode, statusCode)
  const authState = await getSupabaseAuthState(cookies())

  return (
    <div className="mk-page">
      <header className="mk-header">
        <Link href="/" className="mk-logo">
          {SITE_CONFIG.logoPrimary}
          {SITE_CONFIG.logoAccent && <span>{SITE_CONFIG.logoAccent}</span>}
        </Link>

        <div className="mk-header-actions">
          <Link href="/" className="mk-button mk-button-secondary">
            Back to preview
          </Link>
          <Link href="/gallery" className="mk-button">
            My gallery
          </Link>
        </div>
      </header>

      <main className="mk-main">
        <section className="mk-section gv-auth-shell">
          <div className="mk-section-head">
            <div className="mk-eyebrow">Account Access</div>
            <h1 className="mk-section-title">Save your concepts and keep the free preview flow linked to you.</h1>
            <p className="mk-section-copy">
              Keep the current experience lean: create a simple account, verify your email, and continue generating from the same branded landing page or public preview.
            </p>
          </div>

          {message && (
            <div className={`gv-auth-banner${message.tone === 'error' ? ' error' : ''}`}>
              {message.text}
            </div>
          )}

          {!authConfig.isConfigured ? (
            <div className="mk-card gv-auth-card">
              <div className="mk-kicker">Setup incomplete</div>
              <h2 className="mk-card-title">Account access is not ready yet.</h2>
              <p className="mk-card-copy">
                Supabase Auth needs <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> configured on the server before sign-up and login can be used.
              </p>
              <div className="gv-auth-actions">
                <Link href="/" className="mk-button">
                  Return to the app
                </Link>
              </div>
            </div>
          ) : authState.user ? (
            <div className="mk-card gv-auth-card">
              <div className="mk-kicker">Signed in</div>
              <h2 className="mk-card-title">You are ready to continue.</h2>
              <p className="mk-card-copy">
                Signed in as <strong>{authState.user.email}</strong>. You can go back to your current concept journey or open your saved gallery.
              </p>
              <div className="gv-auth-actions">
                <Link href={nextPath} className="mk-button">
                  Continue
                </Link>
                <Link href="/gallery" className="mk-button mk-button-secondary">
                  Open gallery
                </Link>
                <form action="/auth/logout" method="post">
                  <input type="hidden" name="next" value="/" />
                  <button type="submit" className="gv-header-reset gv-header-reset-dark">
                    Log out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mk-grid mk-grid-2 gv-auth-grid">
              <section className="mk-card gv-auth-card">
                <div className="mk-kicker">Create account</div>
                <h2 className="mk-card-title">Start your free account</h2>
                <p className="mk-card-copy">
                  Use email verification for a simple, low-friction account layer. Your current journey remains stored locally on this device.
                </p>

                <form action="/auth/signup" method="post" className="gv-auth-form">
                  <input type="hidden" name="next" value={nextPath} />
                  <div className="gv-form-group">
                    <label className="gv-form-label" htmlFor="signup-email">
                      Email address
                    </label>
                    <input
                      id="signup-email"
                      className="gv-form-input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="gv-form-group">
                    <label className="gv-form-label" htmlFor="signup-password">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      className="gv-form-input"
                      type="password"
                      name="password"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                  <button type="submit" className="gv-cta gv-cta-form">
                    Create free account
                  </button>
                </form>

                <p className="gv-auth-note">
                  We send a verification email before the account is fully active.
                </p>
              </section>

              <section className="mk-card gv-auth-card">
                <div className="mk-kicker">Sign in</div>
                <h2 className="mk-card-title">Return to your concepts</h2>
                <p className="mk-card-copy">
                  Sign in to continue generating and view your saved concept gallery.
                </p>

                <form action="/auth/login" method="post" className="gv-auth-form">
                  <input type="hidden" name="next" value={nextPath} />
                  <div className="gv-form-group">
                    <label className="gv-form-label" htmlFor="login-email">
                      Email address
                    </label>
                    <input
                      id="login-email"
                      className="gv-form-input"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="gv-form-group">
                    <label className="gv-form-label" htmlFor="login-password">
                      Password
                    </label>
                    <input
                      id="login-password"
                      className="gv-form-input"
                      type="password"
                      name="password"
                      placeholder="Your password"
                      required
                    />
                  </div>
                  <button type="submit" className="gv-cta gv-cta-form">
                    Sign in
                  </button>
                </form>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
