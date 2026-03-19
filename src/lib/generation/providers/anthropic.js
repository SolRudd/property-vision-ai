export const anthropicProvider = {
  id: 'anthropic',
  label: 'Anthropic',
  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  },
  async generate() {
    // Switch to Anthropic here later if you introduce a live image-capable fallback provider flow.
    // Anthropic currently supports image input, but not native image output for this use case.
    const error = new Error('Anthropic image generation is not enabled in this app yet')
    error.status = 501
    throw error
  },
}
