import { createClient } from '@supabase/supabase-js'

const DEFAULT_STORAGE_BUCKET = 'concept-images'
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60

let hasWarnedAboutSupabaseStorage = false

function getStorageConfig() {
  const url = String(process.env.SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '')
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const bucket =
    String(process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET).trim() ||
    DEFAULT_STORAGE_BUCKET
  const signedUrlTtl = Number.parseInt(
    process.env.SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS || '',
    10
  )
  const missingKeys = [
    !url ? 'SUPABASE_URL' : null,
    !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
  ].filter(Boolean)

  return {
    url,
    serviceRoleKey,
    bucket,
    signedUrlTtl:
      Number.isFinite(signedUrlTtl) && signedUrlTtl > 60
        ? signedUrlTtl
        : DEFAULT_SIGNED_URL_TTL_SECONDS,
    missingKeys,
    isConfigured: Boolean(url && serviceRoleKey && bucket),
  }
}

function warnAboutStorageConfig(config = getStorageConfig()) {
  if (hasWarnedAboutSupabaseStorage || config.missingKeys.length === 0) {
    return
  }

  hasWarnedAboutSupabaseStorage = true
  console.warn(
    `[supabase-storage] Storage is not fully configured. Missing env vars: ${config.missingKeys.join(', ')}. ` +
      'Expected env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
      `Using bucket "${config.bucket}" when storage is available.`
  )
}

function createStorageAdminClient(config = getStorageConfig()) {
  if (!config.isConfigured) {
    warnAboutStorageConfig(config)
    return null
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

  if (!match) {
    return null
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function getFileExtension(mimeType) {
  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  return extensionMap[mimeType] || 'jpg'
}

function sanitizeSegment(value, fallback = 'asset') {
  const cleaned = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || fallback
}

function buildAssetPath({ bucket, companySlug, userId, sessionId, kind, mimeType }) {
  const ownerSegment = sanitizeSegment(userId || sessionId || 'session', 'session')
  const companySegment = sanitizeSegment(companySlug || 'public', 'public')
  const dateSegment = new Date().toISOString().slice(0, 10)
  const extension = getFileExtension(mimeType)

  return {
    bucket,
    path: `${companySegment}/${ownerSegment}/${dateSegment}/${sanitizeSegment(kind)}-${crypto.randomUUID()}.${extension}`,
  }
}

async function createSignedUrl({ bucket, path }) {
  if (!path || !bucket) {
    return null
  }

  const config = getStorageConfig()
  const client = createStorageAdminClient(config)

  if (!client) {
    return null
  }

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, config.signedUrlTtl)

  if (error) {
    console.warn(`[supabase-storage] Failed to sign ${path}:`, error.message)
    return null
  }

  return data?.signedUrl || null
}

export function isSupabaseStorageConfigured() {
  const config = getStorageConfig()
  warnAboutStorageConfig(config)
  return config.isConfigured
}

export async function uploadConceptImageAsset({
  dataUrl,
  kind,
  userId,
  sessionId,
  companySlug,
}) {
  const parsed = parseDataUrl(dataUrl)

  if (!parsed) {
    return null
  }

  const config = getStorageConfig()
  const client = createStorageAdminClient(config)

  if (!client) {
    return null
  }

  const target = buildAssetPath({
    bucket: config.bucket,
    companySlug,
    userId,
    sessionId,
    kind,
    mimeType: parsed.mimeType,
  })

  // Live Supabase Storage upload happens here with the server-only service role.
  const { error } = await client.storage.from(target.bucket).upload(target.path, parsed.buffer, {
    contentType: parsed.mimeType,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`[supabase-storage] Upload failed for ${kind}: ${error.message}`)
  }

  return {
    bucket: target.bucket,
    path: target.path,
    mimeType: parsed.mimeType,
  }
}

export async function hydrateConceptStorageUrls(concepts = []) {
  if (!Array.isArray(concepts) || concepts.length === 0) {
    return []
  }

  const uniqueTargets = new Map()

  concepts.forEach((concept) => {
    const source = concept?.meta?.storage?.source
    const result = concept?.meta?.storage?.result

    if (source?.bucket && source?.path) {
      uniqueTargets.set(`${source.bucket}:${source.path}`, source)
    }

    if (result?.bucket && result?.path) {
      uniqueTargets.set(`${result.bucket}:${result.path}`, result)
    }
  })

  const signedUrlEntries = await Promise.all(
    Array.from(uniqueTargets.entries()).map(async ([key, target]) => [
      key,
      await createSignedUrl(target),
    ])
  )

  const signedUrlMap = new Map(signedUrlEntries)

  return concepts.map((concept) => {
    const source = concept?.meta?.storage?.source
    const result = concept?.meta?.storage?.result
    const sourceKey = source?.bucket && source?.path ? `${source.bucket}:${source.path}` : null
    const resultKey = result?.bucket && result?.path ? `${result.bucket}:${result.path}` : null

    return {
      ...concept,
      sourceImageUrl: sourceKey ? signedUrlMap.get(sourceKey) || null : null,
      resultImageUrl:
        (resultKey ? signedUrlMap.get(resultKey) || null : null) ||
        concept.result_image_url ||
        null,
    }
  })
}
