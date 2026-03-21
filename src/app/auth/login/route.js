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

  if (!email || !password) {
    return redirectToAuth(request, { next: nextPath, error: 'invalid_credentials' })
  }

  const supabase = createSupabaseAuthClient(cookies())

  if (!supabase) {
    return redirectToAuth(request, { next: nextPath, error: 'auth_unavailable' })
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.warn('[supabase-auth] Sign-in failed:', error.message)
    return redirectToAuth(request, { next: nextPath, error: 'invalid_credentials' })
  }

  return NextResponse.redirect(new URL(nextPath, request.url), 303)
}
