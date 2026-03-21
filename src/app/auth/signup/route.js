import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createSupabaseAuthClient,
  getSupabaseAuthConfig,
  sanitizeNextPath,
} from '../../../lib/supabaseAuth'

function redirectToAuth(request, { next = '/', error, status } = {}) {
  const url = new URL('/auth', request.url)
  url.searchParams.set('next', sanitizeNextPath(next, '/'))

  if (error) {
    url.searchParams.set('error', error)
  }

  if (status) {
    url.searchParams.set('status', status)
  }

  return NextResponse.redirect(url, 303)
}

export async function POST(request) {
  const formData = await request.formData()
  const nextPath = sanitizeNextPath(formData.get('next'), '/')
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const authConfig = getSupabaseAuthConfig()

  if (!authConfig.isConfigured) {
    return redirectToAuth(request, { next: nextPath, error: 'auth_unavailable' })
  }

  if (!email || password.length < 8) {
    return redirectToAuth(request, { next: nextPath, error: 'signup_failed' })
  }

  const supabase = createSupabaseAuthClient(cookies())

  if (!supabase) {
    return redirectToAuth(request, { next: nextPath, error: 'auth_unavailable' })
  }

  const callbackUrl = new URL('/auth/callback', request.url)
  callbackUrl.searchParams.set('next', nextPath)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
    },
  })

  if (error) {
    console.warn('[supabase-auth] Sign-up failed:', error.message)
    return redirectToAuth(request, { next: nextPath, error: 'signup_failed' })
  }

  if (data.session) {
    return NextResponse.redirect(new URL(nextPath, request.url), 303)
  }

  return redirectToAuth(request, { next: nextPath, status: 'check-email' })
}
