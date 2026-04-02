import Link from 'next/link'
import { cookies } from 'next/headers'
import SiteFooter from '../../components/site/SiteFooter'
import SiteHeader from '../../components/site/SiteHeader'
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
  const nextPath = sanitizeNextPath(readValue(searchParams?.next), '/generate')
  const statusCode = readValue(searchParams?.status)
  const errorCode = readValue(searchParams?.error)
  const message = getMessage(errorCode, statusCode)
  const authState = await getSupabaseAuthState(cookies())

  return (
    <div className="mk-page">
      <SiteHeader
        variant="marketing"
        withBar
        actions={
          <div className="mk-header-actions">
            <Link href="/generate" className="mk-button mk-button-secondary">
              Back to preview
            </Link>
          </div>
        }
      />

      <main className="mk-main">
        <section className="mk-section gv-auth-shell">
          <div className="mk-section-head">
            <div className="mk-eyebrow">Account Access</div>
            <h1 className="mk-section-title">Use an account for saved concepts when you want it.</h1>
            <p className="mk-section-copy">
              The public preview works without sign-up. This optional account layer is only for lightweight saved concepts and returning later with the same email.
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
                Public preview generation is still available. Supabase Auth needs <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> configured on the server before optional sign-up and login can be used.
              </p>
              <div className="gv-auth-actions">
                <Link href="/generate" className="mk-button">
                  Return to the app
                </Link>
              </div>
            </div>
          ) : authState.user ? (
            <div className="mk-card gv-auth-card">
              <div className="mk-kicker">Signed in</div>
              <h2 className="mk-card-title">You are ready to continue.</h2>
              <p className="mk-card-copy">
                Signed in as <strong>{authState.user.email}</strong>. You can return to the public preview flow now and any future saved concepts can be linked to this account when storage is ready.
              </p>
              <div className="gv-auth-actions">
                <Link href={nextPath} className="mk-button">
                  Continue
                </Link>
                <form action="/auth/logout" method="post">
                  <input type="hidden" name="next" value="/generate" />
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
                  Use email verification for a simple, low-friction account layer. Your current journey still remains stored locally on this device either way.
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
                <h2 className="mk-card-title">Return with the same email</h2>
                <p className="mk-card-copy">
                  Sign in if you already created an account. The public preview flow still works without this.
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

      <SiteFooter
        variant="marketing"
        showBrand={false}
        metaItems={[
          { label: `© ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.`, className: '' },
          { href: '/generate', label: 'Back to preview', className: 'mk-link' },
        ]}
      />
    </div>
  )
}
