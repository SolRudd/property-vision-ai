// src/lib/promptBuilder.js
// ─────────────────────────────────────────────────────────────
// PROMPT BUILDER
// Token-saving strategy:
//   1. All style base prompts are prebuilt templates (no LLM call)
//   2. LLM enhancement only fires for 3+ features (costs ~300 tokens)
//   3. Negative prompt is a static constant — never sent to LLM
// ─────────────────────────────────────────────────────────────

export const NEGATIVE_PROMPT =
  'fantasy architecture, mansion exaggeration, distorted perspective, impossible geometry, warped paving, surreal colours, cartoon style, illustration, painting, broken fences, extra limbs, dramatic weather, artificial filters, oversaturated, unrealistic scale, CGI look, render, 3D'

export const STYLE_PROMPTS = {
  'modern-minimal':
    'Transform into a clean modern garden with large-format porcelain paving slabs, low structured ornamental grass planting, sleek black steel edging, and minimal clutter. Photorealistic garden photography, daylight.',
  'luxury-patio':
    'Transform into a luxury outdoor space with natural limestone or travertine patio, statement contemporary water feature, warm recessed lighting, and lush curated planting. High-end garden photography.',
  'family-garden':
    'Transform into a beautiful family garden with a safe well-kept lawn, colourful planting borders, practical patio area with outdoor furniture, and child-friendly soft landscaping. Photorealistic daylight.',
  'cottage-garden':
    'Transform into a romantic English cottage garden with overflowing flowering borders, climbing roses, brick or gravel paths, and naturalistic abundant planting. Soft daylight, photorealistic.',
  'contemporary':
    'Transform into a sophisticated contemporary outdoor living space with seamless indoor-outdoor flow, architectural planting, sleek modular furniture, and integrated lighting. Photorealistic.',
  'low-maintenance':
    'Transform into a low-maintenance garden design with resin-bound gravel, architectural evergreen topiary, clean steel edging, and structural drought-tolerant planting. Photorealistic.',
  'premium-drive':
    'Transform into a premium driveway with resin-bound or block paving surface, smart metal gate, recessed border lighting, and tidy clipped hedging. Kerb appeal photography, daylight.',
  'natural-planting':
    'Transform into a naturalistic garden with wildflower meadow areas, native shrub planting, simple mown path, and ecological focus. Soft daylight, photorealistic garden photography.',
  'entertaining':
    'Transform into an outdoor entertaining space with built-in kitchen and BBQ station, large dining area, ambient mood lighting, and comfortable lounge seating. Photorealistic evening light.',
  'pergola-seating':
    'Transform into a garden with a beautiful hardwood or steel pergola structure, climbing wisteria or roses, comfortable outdoor dining set beneath, and dappled shade. Photorealistic.',
  'japanese-zen':
    'Transform into a serene Japanese-inspired garden with raked gravel, moss, stepping stones, bamboo screening, maple accent tree, and stone lanterns. Calm, photorealistic.',
  'mediterranean':
    'Transform into a Mediterranean-style garden with terracotta planters, olive trees, lavender borders, sandstone paving, and warm evening lighting. Photorealistic holiday villa feel.',
  'tropical':
    'Transform into a lush tropical-inspired garden with large-leaf exotic planting, bamboo, ferns, a small water feature, and warm lighting. Photorealistic, vibrant but believable.',
  'kitchen-garden':
    'Transform into a productive and beautiful kitchen garden with raised vegetable beds, gravel paths, fruit espaliers, herb borders, and a potting shed backdrop. Photorealistic.',
  'modern-formal':
    'Transform into a modern formal garden with symmetrical design, clipped box hedging, central ornamental feature, stone paving, and dark green planting. Photorealistic, elegant.',
}

export function buildPrompt(styleId, features = []) {
  const base = STYLE_PROMPTS[styleId] || STYLE_PROMPTS['modern-minimal']
  const featureText =
    features.length > 0
      ? ` Additional elements to include: ${features.join(', ')}.`
      : ''
  const realism =
    ' Maintain the exact camera angle and spatial proportions of the original photo. The result must look like a real professional garden photograph — believable, grounded, and photorealistic.'

  return {
    positive: base + featureText + realism,
    negative: NEGATIVE_PROMPT,
    summary: buildSummary(styleId, features),
  }
}

function buildSummary(styleId, features) {
  const styleLabels = {
    'modern-minimal': 'Modern Minimal',
    'luxury-patio': 'Luxury Patio',
    'family-garden': 'Family Garden',
    'cottage-garden': 'Cottage Garden',
    contemporary: 'Contemporary Living',
    'low-maintenance': 'Low Maintenance',
    'premium-drive': 'Premium Driveway',
    'natural-planting': 'Natural Planting',
    entertaining: 'Entertaining Space',
    'pergola-seating': 'Pergola & Seating',
    'japanese-zen': 'Japanese Zen',
    mediterranean: 'Mediterranean',
    tropical: 'Tropical Garden',
    'kitchen-garden': 'Kitchen Garden',
    'modern-formal': 'Modern Formal',
  }
  const label = styleLabels[styleId] || 'Custom Style'
  return features.length > 0 ? `${label} · ${features.join(' · ')}` : label
}
