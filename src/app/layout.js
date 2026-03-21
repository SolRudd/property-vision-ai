import './globals.css'
import './gardenvision.css'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'
import CookieConsentBanner from '../components/CookieConsentBanner'
import {
  CONSENT_MODE_DEFAULT_SCRIPT,
  GTM_ID,
} from '../lib/analyticsConsent'
import { getSiteMetadata } from '../lib/siteConfig'

export const metadata = getSiteMetadata()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Consent Mode defaults must be set before GTM loads on any route. */}
        <Script id="google-consent-default" strategy="beforeInteractive">
          {CONSENT_MODE_DEFAULT_SCRIPT}
        </Script>
        {/* GTM is loaded once at the root; consent updates are handled by the client banner. */}
        <GoogleTagManager gtmId={GTM_ID} />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  )
}
