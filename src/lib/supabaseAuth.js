import { createServerClient } from '@supabase/ssr'

let hasWarnedAboutSupabaseAuth = false

export function getSupabaseAuthConfig() {
  const url = String(process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '')
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim()
  const missingKeys = [
    !url ? 'SUPABASE_URL' : null,
    !anonKey ? 'SUPABASE_ANON_KEY' : null,
  ].filter(Boolean)

  return {
    url,
    anonKey,
    missingKeys,
    isConfigured: Boolean(url && anonKey),
  }
}

export function warnAboutSupabaseAuth(config = getSupabaseAuthConfig()) {
  if (hasWarnedAboutSupabaseAuth || config.missingKeys.length === 0) {
    return
  }

  hasWarnedAboutSupabaseAuth = true
  console.warn(
    `[supabase-auth] Auth is not fully configured. Missing env vars: ${config.missingKeys.join(', ')}. ` +
      'Expected env vars for auth: SUPABASE_URL and SUPABASE_ANON_KEY.'
  )
}

export function sanitizeNextPath(value, fallback = '/') {
  const nextPath = String(value || fallback).trim()

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return fallback
  }

  return nextPath
}

export function createSupabaseAuthClient(cookieStore) {
  const config = getSupabaseAuthConfig()

  if (!config.isConfigured) {
    warnAboutSupabaseAuth(config)
    return null
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server components can read cookies but may not be able to mutate them.
        }
      },
    },
  })
}

export async function getSupabaseAuthState(cookieStore) {
  const config = getSupabaseAuthConfig()

  if (!config.isConfigured) {
    warnAboutSupabaseAuth(config)
    return {
      enabled: false,
      user: null,
    }
  }

  const supabase = createSupabaseAuthClient(cookieStore)

  if (!supabase) {
    return {
      enabled: false,
      user: null,
    }
  }

  const { data, error } = await supabase.auth.getUser()

  if (error && !/auth session missing/i.test(error.message || '')) {
    console.warn('[supabase-auth] Failed to load auth user:', error.message)
  }

  return {
    enabled: true,
    user: data?.user ?? null,
    supabase,
  }
}
