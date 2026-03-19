const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image-preview'
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`

function parseDataUrl(imageBase64) {
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) {
    const error = new Error('Invalid image payload')
    error.status = 400
    throw error
  }

  return {
    mimeType: match[1],
    data: match[2],
  }
}

function readGeminiParts(result) {
  return result.candidates?.flatMap((candidate) => candidate.content?.parts || []) || []
}

function buildProviderError(response, detail) {
  const error = new Error(`Gemini image generation failed: ${detail || response.statusText}`)
  error.status = response.status >= 400 && response.status < 500 ? response.status : 502
  error.retryable = response.status === 429 || response.status >= 500
  return error
}

export const geminiProvider = {
  id: 'gemini',
  label: 'Gemini',
  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY)
  },
  async generate({ imageBase64, prompt, quality }) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY not configured')
      error.status = 500
      throw error
    }

    const { mimeType, data } = parseDataUrl(imageBase64)
    const body = {
      contents: [
        {
          parts: [
            { text: prompt.positive },
            {
              inline_data: {
                mime_type: mimeType,
                data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }

    // Live Gemini provider call happens here.
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw buildProviderError(response, detail)
    }

    const result = await response.json()
    const imagePart = readGeminiParts(result).find((part) => part.inlineData?.data || part.inline_data?.data)
    const inlineData = imagePart?.inlineData || imagePart?.inline_data

    if (!inlineData?.data) {
      const detail = readGeminiParts(result)
        .map((part) => part.text)
        .filter(Boolean)
        .join(' ')

      const error = new Error(detail || 'Gemini did not return an image')
      error.status = 502
      throw error
    }

    return {
      imageUrl: `data:${inlineData.mimeType || inlineData.mime_type || 'image/png'};base64,${inlineData.data}`,
      isDemo: false,
      meta: {
        provider: 'gemini',
        model: GEMINI_IMAGE_MODEL,
        quality,
      },
    }
  },
}
