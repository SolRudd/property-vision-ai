'use client'

import { useEffect, useState } from 'react'
import {
  CONSENT_CHOICES,
  getStoredConsentChoice,
  persistConsentChoice,
  updateGoogleConsent,
} from '../lib/analyticsConsent'

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const storedChoice = getStoredConsentChoice()

    if (!storedChoice) {
      setIsVisible(true)
      return
    }

    updateGoogleConsent(storedChoice)
  }, [])

  const handleConsentChoice = (choice) => {
    persistConsentChoice(choice)
    updateGoogleConsent(choice)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="gv-consent-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="gv-consent-copy">
        We use Google Tag Manager only after you choose. Analytics stays off by default until you accept.
      </div>
      <div className="gv-consent-actions">
        <button
          type="button"
          className="gv-consent-btn"
          onClick={() => handleConsentChoice(CONSENT_CHOICES.accepted)}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className="gv-consent-btn gv-consent-btn-secondary"
          onClick={() => handleConsentChoice(CONSENT_CHOICES.rejected)}
        >
          Reject analytics
        </button>
      </div>
    </div>
  )
}
