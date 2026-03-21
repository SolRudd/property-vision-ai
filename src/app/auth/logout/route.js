import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createSupabaseAuthClient,
  getSupabaseAuthConfig,
  sanitizeNextPath,
} from '../../../lib/supabaseAuth'

function redirectToPath(request, nextPath = '/') {
  return NextResponse.redirect(
    new URL(sanitizeNextPath(nextPath, '/'), request.url),
    303
  )
}

export async function POST(request) {
  const formData = await request.formData()
  const nextPath = sanitizeNextPath(formData.get('next'), '/')
  const authConfig = getSupabaseAuthConfig()

  if (!authConfig.isConfigured) {
    return redirectToPath(request, nextPath)
  }

  const supabase = createSupabaseAuthClient(cookies())

  if (supabase) {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn('[supabase-auth] Sign-out failed:', error.message)
    }
  }

  return redirectToPath(request, nextPath)
}
