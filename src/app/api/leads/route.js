// src/app/api/leads/route.js
// ─────────────────────────────────────────────────────────────
// LEAD CAPTURE API ROUTE
// Receives form data + concept details, forwards to webhook.
// In production: connect to your CRM, email service, or Zapier.
// ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, postcode, phone, notes, conceptSummary, styleId } = body

    if (!name || !email) {
      return Response.json({ error: 'Name and email required' }, { status: 400 })
    }

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
          source: 'GardenVision AI',
          submittedAt: new Date().toISOString(),
        }),
      })
    }

    // Always log to console in dev
    console.log('New lead:', { name, email, postcode, conceptSummary })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Lead route error:', err)
    return Response.json({ error: 'Failed to submit lead' }, { status: 500 })
  }
}
