export const GTM_ID = 'GTM-N4FCWGTN'
export const ANALYTICS_CONSENT_STORAGE_KEY = 'gv-analytics-consent-v1'

export const CONSENT_CHOICES = {
  accepted: 'accepted',
  rejected: 'rejected',
}

const DENIED_CONSENT = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

const GRANTED_CONSENT = {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
}

export const CONSENT_MODE_DEFAULT_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });
`.trim()

function isValidConsentChoice(choice) {
  return choice === CONSENT_CHOICES.accepted || choice === CONSENT_CHOICES.rejected
}

function buildConsentPayload(choice) {
  return choice === CONSENT_CHOICES.accepted ? GRANTED_CONSENT : DENIED_CONSENT
}

export function getStoredConsentChoice() {
  if (typeof window === 'undefined') return null

  const storedChoice = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)
  return isValidConsentChoice(storedChoice) ? storedChoice : null
}

export function persistConsentChoice(choice) {
  if (typeof window === 'undefined' || !isValidConsentChoice(choice)) return

  window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, choice)
}

export function updateGoogleConsent(choice) {
  if (typeof window === 'undefined' || !isValidConsentChoice(choice)) return

  window.dataLayer = window.dataLayer || []

  function gtag() {
    window.dataLayer.push(arguments)
  }

  // This is the single consent-update point used by the client banner.
  gtag('consent', 'update', buildConsentPayload(choice))
  window.dataLayer.push({
    event: 'gv_consent_updated',
    gv_consent_choice: choice,
  })
}
