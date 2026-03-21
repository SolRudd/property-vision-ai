import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createSupabaseAuthClient,
  getSupabaseAuthConfig,
  sanitizeNextPath,
} from '../../../lib/supabaseAuth'

function redirectToAuth(request, { next = '/', error } = {}) {
  const url = new URL('/auth', request.url)
  url.searchParams.set('next', sanitizeNextPath(next, '/'))

  if (error) {
    url.searchParams.set('error', error)
  }

  return NextResponse.redirect(url)
}

export async function GET(request) {
  const nextPath = sanitizeNextPath(
    request.nextUrl.searchParams.get('next'),
    '/'
  )
  const code = request.nextUrl.searchParams.get('code')
  const authConfig = getSupabaseAuthConfig()

  if (!authConfig.isConfigured) {
    return redirectToAuth(request, { next: nextPath, error: 'auth_unavailable' })
  }

  if (!code) {
    return redirectToAuth(request, { next: nextPath, error: 'missing_code' })
  }

  const supabase = createSupabaseAuthClient(cookies())

  if (!supabase) {
    return redirectToAuth(request, { next: nextPath, error: 'auth_unavailable' })
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.warn('[supabase-auth] Verification failed:', error.message)
    return redirectToAuth(request, { next: nextPath, error: 'verification_failed' })
  }

  return NextResponse.redirect(new URL(nextPath, request.url))
}
