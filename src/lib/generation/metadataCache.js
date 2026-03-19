const CACHE_LIMIT = 200

function getCache() {
  if (!globalThis.__gardenVisionGenerationMetadataCache) {
    globalThis.__gardenVisionGenerationMetadataCache = new Map()
  }

  return globalThis.__gardenVisionGenerationMetadataCache
}

export function getCachedGenerationMetadata(key, buildValue) {
  const cache = getCache()

  if (cache.has(key)) {
    return cache.get(key)
  }

  const value = buildValue()
  cache.set(key, value)

  if (cache.size > CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value
    cache.delete(oldestKey)
  }

  return value
}
