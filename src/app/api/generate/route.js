// src/app/api/generate/route.js
// ─────────────────────────────────────────────────────────────
// IMAGE GENERATION API ROUTE
// Receives: { imageBase64, prompt, negativePrompt }
// Returns:  { imageUrl } (base64 data URL)
//
// Uses Stability AI "image-to-image" endpoint so the generated
// concept stays grounded in the user's actual uploaded photo.
// Cost: ~$0.01–0.03 per generation at standard resolution.
// ─────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { imageBase64, prompt, negativePrompt } = await request.json()

    if (!imageBase64 || !prompt) {
      return Response.json({ error: 'Missing imageBase64 or prompt' }, { status: 400 })
    }

    const apiKey = process.env.STABILITY_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'STABILITY_API_KEY not configured' }, { status: 500 })
    }

    // Strip the data URL prefix to get raw base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Build multipart form for Stability AI image-to-image
    const formData = new FormData()
    formData.append('init_image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'garden.jpg')
    formData.append('init_image_mode', 'IMAGE_STRENGTH')
    formData.append('image_strength', '0.35') // 0=ignore photo, 1=copy photo. 0.35 = strong influence
    formData.append('text_prompts[0][text]', prompt)
    formData.append('text_prompts[0][weight]', '1')
    formData.append('text_prompts[1][text]', negativePrompt || '')
    formData.append('text_prompts[1][weight]', '-1')
    formData.append('cfg_scale', '8')
    formData.append('samples', '1')
    formData.append('steps', '40')
    formData.append('style_preset', 'photographic')

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('Stability AI error:', err)
      return Response.json({ error: 'Image generation failed', detail: err }, { status: 500 })
    }

    const result = await response.json()
    const generatedBase64 = result.artifacts?.[0]?.base64

    if (!generatedBase64) {
      return Response.json({ error: 'No image returned from Stability AI' }, { status: 500 })
    }

    return Response.json({
      imageUrl: `data:image/png;base64,${generatedBase64}`,
      isDemo: false,
    })
  } catch (err) {
    console.error('Generate route error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
