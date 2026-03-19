const SESSION_COOKIE_NAME = 'gv_session'
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const ACTIVE_LOCK_TTL_MS = 2 * 60 * 1000

function getStore() {
  // MVP storage: per-instance in-memory session state keyed by an httpOnly cookie.
  // Replace this with Redis / Vercel KV / a database-backed session table for durable,
  // cross-instance enforcement once you need stricter production guarantees.
  if (!globalThis.__gardenVisionSessionStore) {
    globalThis.__gardenVisionSessionStore = new Map()
  }

  return globalThis.__gardenVisionSessionStore
}

function createState(now) {
  return {
    completedGenerations: 0,
    lastGeneratedAt: 0,
    activeGeneration: false,
    activeGenerationExpiresAt: 0,
    updatedAt: now,
  }
}

function cleanupStore(now) {
  const store = getStore()

  for (const [sessionId, state] of store.entries()) {
    if (state.activeGeneration && state.activeGenerationExpiresAt <= now) {
      state.activeGeneration = false
      state.activeGenerationExpiresAt = 0
    }

    if (now - state.updatedAt > SESSION_TTL_MS) {
      store.delete(sessionId)
    }
  }
}

function getState(sessionId, now) {
  cleanupStore(now)

  const store = getStore()
  const existing = store.get(sessionId)
  if (existing) return existing

  const created = createState(now)
  store.set(sessionId, created)
  return created
}

function buildUsage(state, config, now) {
  const nextAvailableAt =
    state.lastGeneratedAt > 0
      ? state.lastGeneratedAt + config.GENERATION_COOLDOWN_SECONDS * 1000
      : 0

  return {
    maxFreeGenerations: config.MAX_FREE_GENERATIONS,
    completedGenerations: state.completedGenerations,
    remainingGenerations: Math.max(
      0,
      config.MAX_FREE_GENERATIONS - state.completedGenerations
    ),
    cooldownRemainingSeconds: Math.max(
      0,
      nextAvailableAt ? Math.ceil((nextAvailableAt - now) / 1000) : 0
    ),
    cooldownEndsAt: nextAvailableAt || null,
    activeGeneration: state.activeGeneration,
  }
}

function buildLimitError(message, code, status, usage) {
  const error = new Error(message)
  error.code = code
  error.status = status
  error.usage = usage
  return error
}

export function getSessionContext(request) {
  const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (existingSessionId) {
    return {
      sessionId: existingSessionId,
      shouldSetCookie: false,
    }
  }

  return {
    sessionId: crypto.randomUUID(),
    shouldSetCookie: true,
  }
}

export function applySessionCookie(response, sessionId) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function getUsageSnapshot(sessionId, config) {
  const now = Date.now()
  const state = getState(sessionId, now)
  return buildUsage(state, config, now)
}

export function reserveGeneration(sessionId, config) {
  const now = Date.now()
  const state = getState(sessionId, now)
  const usage = buildUsage(state, config, now)

  if (state.activeGeneration) {
    throw buildLimitError(
      'A generation is already in progress for this session',
      'ACTIVE_GENERATION',
      429,
      usage
    )
  }

  if (usage.remainingGenerations <= 0) {
    throw buildLimitError(
      'Free generation limit reached for this session',
      'FREE_LIMIT_REACHED',
      429,
      usage
    )
  }

  if (usage.cooldownRemainingSeconds > 0) {
    throw buildLimitError(
      `Please wait ${usage.cooldownRemainingSeconds} seconds before generating again`,
      'GENERATION_COOLDOWN',
      429,
      usage
    )
  }

  state.activeGeneration = true
  state.activeGenerationExpiresAt = now + ACTIVE_LOCK_TTL_MS
  state.updatedAt = now
}

export function completeGeneration(sessionId, config) {
  const now = Date.now()
  const state = getState(sessionId, now)

  state.completedGenerations += 1
  state.lastGeneratedAt = now
  state.activeGeneration = false
  state.activeGenerationExpiresAt = 0
  state.updatedAt = now

  return buildUsage(state, config, now)
}

export function releaseGeneration(sessionId, config) {
  const now = Date.now()
  const state = getState(sessionId, now)

  state.activeGeneration = false
  state.activeGenerationExpiresAt = 0
  state.updatedAt = now

  return buildUsage(state, config, now)
}
