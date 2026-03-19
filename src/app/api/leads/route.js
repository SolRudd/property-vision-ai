// src/app/api/leads/route.js
// ─────────────────────────────────────────────────────────────
// LEAD CAPTURE API ROUTE
// Receives form data + concept details, forwards to webhook.
// In production: connect to your CRM, email service, or Zapier.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { sanitizeOptionalNote } from '../../../lib/promptBuilder'
import { SITE_CONFIG } from '../../../lib/siteConfig'
import { saveLeadRecord } from '../../../lib/supabaseAdmin'
import {
  applySessionCookie,
  getSessionContext,
} from '../../../lib/generation/sessionStore'

function buildResponse(payload, { status = 200, sessionContext } = {}) {
  const response = NextResponse.json(payload, { status })

  if (sessionContext?.shouldSetCookie) {
    applySessionCookie(response, sessionContext.sessionId)
  }

  return response
}

export async function POST(request) {
  const sessionContext = getSessionContext(request)

  try {
    const body = await request.json()
    const {
      name,
      email,
      postcode,
      phone,
      notes,
      conceptSummary,
      styleId,
      styleLabel,
      modifiers = [],
      preserveLayout,
      optionalNote,
      generationUsage,
      conceptId,
      companySlug,
      companyName,
      websiteLink,
      leadDestination,
    } = body

    if (!name || !email) {
      return buildResponse(
        { error: 'Name and email required' },
        { status: 400, sessionContext }
      )
    }

    const conceptMetadata = {
      conceptSummary,
      styleId,
      styleLabel,
      modifiers: Array.isArray(modifiers)
        ? modifiers.filter((modifier) => typeof modifier === 'string').slice(0, 4)
        : [],
      preserveLayout,
      optionalNote: sanitizeOptionalNote(optionalNote),
      companySlug,
      companyName,
      websiteLink,
      leadDestination:
        leadDestination && typeof leadDestination === 'object'
          ? leadDestination
          : null,
      generationUsage:
        generationUsage && typeof generationUsage === 'object'
          ? {
              completedGenerations: generationUsage.completedGenerations ?? null,
              remainingGenerations: generationUsage.remainingGenerations ?? null,
              maxFreeGenerations: generationUsage.maxFreeGenerations ?? null,
            }
          : null,
    }

    await saveLeadRecord({
      sessionId: sessionContext.sessionId,
      conceptId,
      companySlug,
      leadDestination,
      name,
      email,
      postcode,
      phone,
      notes,
      source: companyName || SITE_CONFIG.name,
      conceptMetadata,
    })

    const webhookUrl = process.env.LEAD_WEBHOOK_URL

    // If a webhook URL is configured, forward the lead
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          postcode,
          phone,
          notes,
          conceptSummary,
          styleId,
          conceptId,
          companySlug,
          conceptMetadata,
          source: companyName || SITE_CONFIG.name,
          submittedAt: new Date().toISOString(),
        }),
      })
    }

    // Always log to console in dev
    console.log('New lead:', { name, email, postcode, conceptMetadata })

    return buildResponse({ success: true }, { sessionContext })
  } catch (err) {
    console.error('Lead route error:', err)
    return buildResponse(
      { error: 'Failed to submit lead' },
      { status: 500, sessionContext }
    )
  }
}
