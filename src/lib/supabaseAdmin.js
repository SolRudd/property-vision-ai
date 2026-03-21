function trimText(value, maxLength) {
  if (value == null) return null

  const normalised = String(value).replace(/\s+/g, ' ').trim()
  if (!normalised) return null

  return typeof maxLength === 'number'
    ? normalised.slice(0, maxLength)
    : normalised
}

let hasWarnedAboutSupabaseConfig = false

function getSupabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '')
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim()
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const missingKeys = [
    !url ? 'SUPABASE_URL' : null,
    !anonKey ? 'SUPABASE_ANON_KEY' : null,
    !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
  ].filter(Boolean)

  return {
    url,
    anonKey,
    serviceRoleKey,
    missingKeys,
    hasServerPersistence: Boolean(url && serviceRoleKey),
    isConfigured: Boolean(url && anonKey && serviceRoleKey),
  }
}

function warnAboutSupabaseConfig(config) {
  if (hasWarnedAboutSupabaseConfig || config.missingKeys.length === 0) {
    return
  }

  hasWarnedAboutSupabaseConfig = true
  console.warn(
    `[supabase] Live config is incomplete. Missing env vars: ${config.missingKeys.join(', ')}. ` +
      'Expected env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. ' +
      'Server persistence will fail gracefully until the required values are set.'
  )
}

function buildRestUrl(baseUrl, table, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return
    searchParams.set(key, String(value))
  })

  return `${baseUrl}/rest/v1/${table}?${searchParams.toString()}`
}

async function insertRow(table, payload, { select = '*' } = {}) {
  const config = getSupabaseConfig()

  if (!config.hasServerPersistence) {
    warnAboutSupabaseConfig(config)
    return null
  }

  warnAboutSupabaseConfig(config)

  const response = await fetch(buildRestUrl(config.url, table, { select }), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Prefer: 'return=representation',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase ${table} insert failed: ${detail || response.statusText}`)
  }

  const rows = await response.json()
  return Array.isArray(rows) ? rows[0] || null : rows
}

async function fetchRows(table, { select = '*', filters = {}, order, limit } = {}) {
  const config = getSupabaseConfig()

  if (!config.hasServerPersistence) {
    warnAboutSupabaseConfig(config)
    return []
  }

  warnAboutSupabaseConfig(config)

  const query = { select }

  Object.entries(filters).forEach(([key, value]) => {
    if (value == null || value === '') return
    query[key] = value
  })

  if (order) {
    query.order = order
  }

  if (typeof limit === 'number' && limit > 0) {
    query.limit = limit
  }

  const response = await fetch(buildRestUrl(config.url, table, query), {
    method: 'GET',
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase ${table} read failed: ${detail || response.statusText}`)
  }

  const rows = await response.json()
  return Array.isArray(rows) ? rows : []
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig()
  warnAboutSupabaseConfig(config)
  return config.isConfigured
}

export async function saveConceptRecord({
  sessionId,
  userId,
  companySlug,
  leadDestination,
  provider,
  mode,
  quality,
  styleId,
  styleLabel,
  modifiers,
  preserveLayout,
  optionalNote,
  promptSummary,
  promptCacheKey,
  imageUrl,
  meta,
}) {
  return insertRow(
    'saved_concepts',
    {
      session_id: trimText(sessionId, 120),
      user_id: trimText(userId, 120),
      company_slug: trimText(companySlug, 120),
      lead_destination:
        leadDestination && typeof leadDestination === 'object'
          ? leadDestination
          : {},
      provider: trimText(provider, 40),
      mode: trimText(mode, 20),
      quality: trimText(quality, 20),
      style_id: trimText(styleId, 80),
      style_label: trimText(styleLabel, 120),
      modifiers: Array.isArray(modifiers) ? modifiers.slice(0, 4) : [],
      preserve_layout: trimText(preserveLayout, 20),
      optional_note: trimText(optionalNote, 60),
      prompt_summary: trimText(promptSummary, 500),
      prompt_cache_key: trimText(promptCacheKey, 255),
      result_image_url:
        typeof imageUrl === 'string' && imageUrl.startsWith('data:')
          ? null
          : trimText(imageUrl, 2000),
      result_image_inline: Boolean(typeof imageUrl === 'string' && imageUrl.startsWith('data:')),
      meta: meta && typeof meta === 'object' ? meta : {},
    },
    { select: 'id,created_at' }
  )
}

export async function saveUsageRecord({
  sessionId,
  userId,
  conceptId,
  companySlug,
  eventType,
  status,
  provider,
  styleId,
  modifiers,
  preserveLayout,
  optionalNote,
  completedGenerations,
  remainingGenerations,
  maxFreeGenerations,
  cooldownRemainingSeconds,
  errorCode,
}) {
  return insertRow(
    'usage_records',
    {
      session_id: trimText(sessionId, 120),
      user_id: trimText(userId, 120),
      concept_id: trimText(conceptId, 120),
      company_slug: trimText(companySlug, 120),
      event_type: trimText(eventType, 40),
      status: trimText(status, 40),
      provider: trimText(provider, 40),
      style_id: trimText(styleId, 80),
      modifiers: Array.isArray(modifiers) ? modifiers.slice(0, 4) : [],
      preserve_layout: trimText(preserveLayout, 20),
      optional_note: trimText(optionalNote, 60),
      completed_generations:
        typeof completedGenerations === 'number' ? completedGenerations : null,
      remaining_generations:
        typeof remainingGenerations === 'number' ? remainingGenerations : null,
      max_free_generations:
        typeof maxFreeGenerations === 'number' ? maxFreeGenerations : null,
      cooldown_remaining_seconds:
        typeof cooldownRemainingSeconds === 'number' ? cooldownRemainingSeconds : null,
      error_code: trimText(errorCode, 80),
    },
    { select: 'id' }
  )
}

export async function saveLeadRecord({
  sessionId,
  conceptId,
  companySlug,
  leadDestination,
  name,
  email,
  postcode,
  phone,
  notes,
  source,
  conceptMetadata,
}) {
  return insertRow(
    'leads',
    {
      session_id: trimText(sessionId, 120),
      concept_id: trimText(conceptId, 120),
      company_slug: trimText(companySlug, 120),
      lead_destination:
        leadDestination && typeof leadDestination === 'object'
          ? leadDestination
          : {},
      name: trimText(name, 120),
      email: trimText(email, 255),
      postcode: trimText(postcode, 32),
      phone: trimText(phone, 40),
      notes: trimText(notes, 1200),
      source: trimText(source, 120),
      concept_metadata:
        conceptMetadata && typeof conceptMetadata === 'object'
          ? conceptMetadata
          : {},
    },
    { select: 'id,created_at' }
  )
}

export async function listConceptsForUser(userId, { limit = 24 } = {}) {
  const normalisedUserId = trimText(userId, 120)

  if (!normalisedUserId) {
    return []
  }

  return fetchRows('saved_concepts', {
    select: [
      'id',
      'created_at',
      'company_slug',
      'style_id',
      'style_label',
      'modifiers',
      'preserve_layout',
      'optional_note',
      'prompt_summary',
      'result_image_url',
      'result_image_inline',
      'mode',
      'quality',
      'provider',
      'meta',
    ].join(','),
    filters: {
      user_id: `eq.${normalisedUserId}`,
    },
    order: 'created_at.desc',
    limit,
  })
}
