'use client'

import { useState, useRef, useCallback } from 'react'
import { buildPrompt, NEGATIVE_PROMPT } from '../lib/promptBuilder'

// ─────────────────────────────────────────────────────────────
// BRAND CONFIG — edit here for B2B / white-label
// ─────────────────────────────────────────────────────────────
const BRAND = {
  name: 'GardenVision AI',
  companyTag: null,             // e.g. 'Prepared for Green Leaf Landscapes'
  leadFormHeading: 'Request a landscaping quote',
  leadFormCTA: 'Send my concept to the team',
  freeGenerations: 3,
  watermark: true,
}

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const STYLES = [
  { id: 'modern-minimal',  label: 'Modern Minimal',       emoji: '▪', desc: 'Porcelain paving, structured planting, sleek edges' },
  { id: 'luxury-patio',    label: 'Luxury Patio',         emoji: '◈', desc: 'Premium stone, statement features, refined finish' },
  { id: 'family-garden',   label: 'Family Garden',        emoji: '◉', desc: 'Safe lawn, colour, practical and beautiful' },
  { id: 'cottage-garden',  label: 'Cottage Garden',       emoji: '✿', desc: 'Flowering borders, naturalistic, romantic' },
  { id: 'contemporary',    label: 'Contemporary Living',  emoji: '◻', desc: 'Indoor-outdoor flow, architectural planting' },
  { id: 'low-maintenance', label: 'Low Maintenance',      emoji: '◌', desc: 'Gravel, evergreens, minimal upkeep' },
  { id: 'premium-drive',   label: 'Premium Driveway',     emoji: '◆', desc: 'Block paving, lighting, kerb appeal' },
  { id: 'natural-planting',label: 'Natural Planting',     emoji: '❧', desc: 'Wildflower, native species, ecological' },
  { id: 'entertaining',    label: 'Entertaining Space',   emoji: '◎', desc: 'Outdoor kitchen, dining, ambient lighting' },
  { id: 'pergola-seating', label: 'Pergola & Seating',    emoji: '⌂', desc: 'Covered structure, climbing plants, shade' },
  { id: 'japanese-zen',    label: 'Japanese Zen',         emoji: '○', desc: 'Raked gravel, bamboo, stone, calm geometry' },
  { id: 'mediterranean',   label: 'Mediterranean',        emoji: '◑', desc: 'Terracotta, olives, lavender, warm tones' },
  { id: 'tropical',        label: 'Tropical Garden',      emoji: '❋', desc: 'Lush exotic foliage, bold planting, vivid' },
  { id: 'kitchen-garden',  label: 'Kitchen Garden',       emoji: '⊕', desc: 'Raised beds, herbs, fruit trees, productive beauty' },
  { id: 'modern-formal',   label: 'Modern Formal',        emoji: '⊞', desc: 'Symmetry, clipped hedging, elegant geometry' },
]

const FEATURES = [
  'Patio', 'Decking', 'Keep Lawn', 'Planting Borders',
  'Outdoor Lighting', 'Privacy Screening', 'Seating Area',
  'Water Feature', 'Child-Friendly', 'Pet-Friendly',
  'Pergola', 'Artificial Grass', 'Fire Pit', 'Raised Beds',
  'Garden Lighting', 'Outdoor Kitchen',
]

const GEN_STAGES = [
  'Analysing your outdoor space…',
  'Interpreting your style choices…',
  'Composing landscaping concept…',
  'Generating visual preview…',
  'Applying finishing details…',
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Resize uploaded image before sending to API — saves cost + bandwidth
function resizeImage(dataUrl, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.src = dataUrl
  })
}

async function callGenerateAPI(imageBase64, prompt) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      prompt: prompt.positive,
      negativePrompt: prompt.negative,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Generation failed')
  }
  return res.json()
}

async function submitLeadAPI(data) {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// ─────────────────────────────────────────────────────────────
// STYLES (CSS-in-JS for single-file portability)
// ─────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: '100vh',
    background: '#f5f2ec',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    background: '#18261a',
    padding: '18px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]                   = useState('hero')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [resizedImage, setResizedImage]   = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [result, setResult]               = useState(null)
  const [compareTab, setCompareTab]       = useState('after')
  const [genStage, setGenStage]           = useState(0)
  const [generations, setGenerations]     = useState(0)
  const [dragging, setDragging]           = useState(false)
  const [genError, setGenError]           = useState(null)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadLoading, setLeadLoading]     = useState(false)
  const [lead, setLead] = useState({ name: '', email: '', postcode: '', phone: '', notes: '' })

  const fileRef = useRef(null)
  const remaining = BRAND.freeGenerations - generations

  // ── Upload ──────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 25 * 1024 * 1024) { alert('Please use an image under 25MB.'); return }
    const reader = new FileReader()
    reader.onload = async (e) => {
      const original = e.target.result
      setUploadedImage(original)
      const resized = await resizeImage(original, 1024)
      setResizedImage(resized)
      setStep('style')
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  // ── Generation ──────────────────────────────────────────────
  const generate = async () => {
    if (!selectedStyle || !resizedImage) return
    if (remaining <= 0) { setStep('lead'); return }

    setStep('generating')
    setGenStage(0)
    setGenError(null)

    const featureLabels = selectedFeatures
    const prompt = buildPrompt(selectedStyle, featureLabels)

    const stageTimer = setInterval(() => {
      setGenStage(s => Math.min(s + 1, GEN_STAGES.length - 1))
    }, 900)

    try {
      const data = await callGenerateAPI(resizedImage, prompt)
      clearInterval(stageTimer)
      setGenStage(GEN_STAGES.length - 1)
      await new Promise(r => setTimeout(r, 500))
      setGenerations(g => g + 1)
      setResult({ ...data, prompt, styleId: selectedStyle, features: featureLabels })
      setCompareTab('after')
      setStep('result')
    } catch (err) {
      clearInterval(stageTimer)
      setGenError(err.message || 'Something went wrong. Please try again.')
      setStep('style')
    }
  }

  // ── Lead form ───────────────────────────────────────────────
  const submitLead = async (e) => {
    e.preventDefault()
    setLeadLoading(true)
    await submitLeadAPI({
      ...lead,
      conceptSummary: result?.prompt?.summary,
      styleId: result?.styleId,
    })
    setLeadLoading(false)
    setLeadSubmitted(true)
  }

  const toggleFeature = (f) =>
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalCSS}</style>
      <div className="gv-app">

        {/* ── Header ── */}
        <header className="gv-header">
          <div className="gv-logo">Garden<span>Vision</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {BRAND.companyTag && <span className="gv-badge-dark">{BRAND.companyTag}</span>}
            <span className="gv-badge-green">✦ Free preview</span>
          </div>
        </header>

        {/* ── Progress ── */}
        {step !== 'hero' && (
          <div className="gv-progress">
            {['upload', 'style', 'generating', 'result'].map((s, i, arr) => {
              const stepOrder = ['upload', 'style', 'generating', 'result', 'lead']
              const currentIdx = stepOrder.indexOf(step)
              const thisIdx = stepOrder.indexOf(s)
              const isDone = currentIdx > thisIdx
              const isActive = currentIdx === thisIdx
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 'initial' }}>
                  <div className={`gv-pstep${isActive ? ' active' : isDone ? ' done' : ''}`}>
                    <div className="gv-pdot" />
                    <span>{s === 'upload' ? 'Upload' : s === 'style' ? 'Style' : s === 'generating' ? 'Generating' : 'Result'}</span>
                  </div>
                  {i < arr.length - 1 && <div className="gv-pline" />}
                </div>
              )
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════ */}
        {step === 'hero' && (
          <div className="gv-fade">
            <section className="gv-hero">
              <div className="gv-eyebrow">
                <span className="gv-eyebrow-dot" />
                See your garden redesigned in minutes
              </div>
              <h1 className="gv-h1">
                Your outdoor space,<br />
                <em>beautifully reimagined</em>
              </h1>
              <p className="gv-hero-p">
                Upload a photo of your garden, patio, or driveway. Choose a style.
                Get a professionally inspired landscaping concept — ready to share with your landscaper.
              </p>
              <button className="gv-cta" onClick={() => setStep('upload')}>
                Upload your photo
                <span className="gv-cta-arrow">→</span>
              </button>
              <p className="gv-hero-note">
                Concept images are for inspiration and planning purposes only · Free to try
              </p>
            </section>

            {/* Trust row */}
            <div className="gv-trust-row">
              {[
                { n: '15+', label: 'Design styles' },
                { n: '60s',  label: 'Average generation time' },
                { n: '100%', label: 'Based on your photo' },
              ].map(t => (
                <div key={t.n} className="gv-trust-card">
                  <div className="gv-trust-n">{t.n}</div>
                  <div className="gv-trust-label">{t.label}</div>
                </div>
              ))}
            </div>

            {/* Style preview strip */}
            <div className="gv-style-strip-wrap">
              <div className="gv-section-label" style={{ textAlign: 'center', marginBottom: 24 }}>Available styles</div>
              <div className="gv-style-strip">
                {STYLES.map(s => (
                  <div key={s.id} className="gv-strip-pill" onClick={() => { setStep('upload') }}>
                    <span>{s.emoji}</span> {s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            UPLOAD
        ════════════════════════════════════════════ */}
        {step === 'upload' && (
          <div className="gv-upload-wrap gv-fade">
            <div className="gv-step-header" style={{ textAlign: 'center' }}>
              <div className="gv-step-num">Step 1 of 3</div>
              <h2 className="gv-h2">Upload your garden photo</h2>
              <p className="gv-step-sub">A clear daylight photo gives the best results</p>
            </div>

            <div
              className={`gv-dropzone${dragging ? ' dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
            >
              <div className="gv-drop-icon">🌿</div>
              <h3 className="gv-drop-title">Drag your photo here</h3>
              <p className="gv-drop-sub">Or tap to browse from your device</p>
              <button
                className="gv-upload-btn"
                onClick={e => { e.stopPropagation(); fileRef.current?.click() }}
              >
                Choose photo
              </button>
              <p className="gv-drop-formats">JPG · PNG · WEBP · up to 25MB</p>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />

            <div className="gv-upload-tips">
              <div className="gv-tip">✓ Use a photo taken in daylight</div>
              <div className="gv-tip">✓ Landscape orientation works best</div>
              <div className="gv-tip">✓ Include the full garden area if possible</div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            STYLE SELECTION
        ════════════════════════════════════════════ */}
        {step === 'style' && (
          <div className="gv-main gv-fade">
            {/* Uploaded preview */}
            <div className="gv-preview-card">
              <img src={uploadedImage} alt="Your garden" className="gv-preview-img" />
              <div className="gv-preview-footer">
                <span className="gv-preview-label">📸 Your uploaded photo</span>
                <button className="gv-change-btn" onClick={() => {
                  setUploadedImage(null); setResizedImage(null)
                  setSelectedStyle(null); setSelectedFeatures([])
                  setStep('upload')
                }}>Change photo</button>
              </div>
            </div>

            {/* Usage */}
            <div className="gv-usage-bar">
              <span className="gv-usage-label">Free concepts remaining</span>
              <div className="gv-usage-track">
                <div className="gv-usage-fill" style={{ width: `${Math.max(0, remaining / BRAND.freeGenerations) * 100}%` }} />
              </div>
              <span className="gv-usage-count">{remaining} of {BRAND.freeGenerations}</span>
            </div>

            {/* Error */}
            {genError && (
              <div className="gv-error">⚠ {genError}</div>
            )}

            {/* Style picker */}
            <div className="gv-step-header">
              <div className="gv-step-num">Step 2 of 3</div>
              <h2 className="gv-h2">Choose your landscaping style</h2>
              <p className="gv-step-sub">Select the look and feel you'd like to explore</p>
            </div>

            <div className="gv-style-grid">
              {STYLES.map(s => (
                <div
                  key={s.id}
                  className={`gv-style-card${selectedStyle === s.id ? ' selected' : ''}`}
                  onClick={() => setSelectedStyle(s.id)}
                >
                  {selectedStyle === s.id && <div className="gv-style-check">✓</div>}
                  <div className="gv-style-emoji">{s.emoji}</div>
                  <div className="gv-style-name">{s.label}</div>
                  <div className="gv-style-desc">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Feature toggles */}
            <div className="gv-features-section">
              <div className="gv-section-label">Add elements to your concept <span className="gv-optional">(optional)</span></div>
              <div className="gv-features-grid">
                {FEATURES.map(f => (
                  <button
                    key={f}
                    className={`gv-feature-toggle${selectedFeatures.includes(f) ? ' selected' : ''}`}
                    onClick={() => toggleFeature(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary + CTA */}
            {selectedStyle && (
              <div className="gv-selection-summary">
                <div className="gv-summary-label">Your selection</div>
                <div className="gv-summary-text">
                  {STYLES.find(s => s.id === selectedStyle)?.label}
                  {selectedFeatures.length > 0 && ` · ${selectedFeatures.join(' · ')}`}
                </div>
              </div>
            )}

            <div className="gv-style-cta-row">
              <button
                className="gv-cta"
                disabled={!selectedStyle}
                onClick={generate}
              >
                {remaining <= 0 ? 'Upgrade to generate →' : 'Generate my concept →'}
              </button>
              {!selectedStyle && (
                <span className="gv-cta-hint">Select a style above to continue</span>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            GENERATING
        ════════════════════════════════════════════ */}
        {step === 'generating' && (
          <div className="gv-gen-panel gv-fade">
            <div className="gv-gen-anim">
              <div className="gv-ring gv-ring1" />
              <div className="gv-ring gv-ring2" />
              <div className="gv-ring gv-ring3" />
              <div className="gv-gen-center">✦</div>
            </div>

            <h2 className="gv-gen-title">{GEN_STAGES[genStage]}</h2>
            <p className="gv-gen-sub">Creating your personalised landscaping concept</p>

            <ul className="gv-gen-steps">
              {GEN_STAGES.map((stage, i) => (
                <li key={stage} className={`gv-gstep${i === genStage ? ' active' : i < genStage ? ' done' : ''}`}>
                  <div className="gv-gstep-dot" />
                  {stage}
                </li>
              ))}
            </ul>

            <p className="gv-gen-note">This usually takes 30–60 seconds</p>
          </div>
        )}

        {/* ════════════════════════════════════════════
            RESULT
        ════════════════════════════════════════════ */}
        {step === 'result' && result && (
          <div className="gv-main gv-fade">
            <div className="gv-step-header">
              <div className="gv-step-num" style={{ color: '#4a7c59' }}>Your concept is ready</div>
              <h2 className="gv-h2">Your landscaping concept</h2>
            </div>

            {/* Compare viewer */}
            <div className="gv-compare-card">
              <div className="gv-compare-tabs">
                {['before', 'after'].map(tab => (
                  <button
                    key={tab}
                    className={`gv-ctab${compareTab === tab ? ' active' : ''}`}
                    onClick={() => setCompareTab(tab)}
                  >
                    {tab === 'before' ? '← Before (original)' : 'After (concept) →'}
                  </button>
                ))}
              </div>

              <div className="gv-compare-img-wrap">
                {compareTab === 'before' ? (
                  <img src={uploadedImage} alt="Before" className="gv-compare-img" />
                ) : (
                  <>
                    <img
                      src={result.isDemo ? uploadedImage : result.imageUrl}
                      alt="After concept"
                      className="gv-compare-img"
                      style={{ filter: result.isDemo ? 'saturate(1.2) contrast(1.08) brightness(1.04)' : 'none' }}
                    />
                    {result.isDemo && (
                      <div className="gv-demo-notice">
                        <div className="gv-demo-inner">
                          <div className="gv-demo-tag">Image API not connected</div>
                          <div className="gv-demo-msg">
                            Add your <code>STABILITY_API_KEY</code> to <code>.env.local</code> to generate real concepts.
                            The prompt has been composed — just plug in the API key.
                          </div>
                          <div className="gv-demo-prompt">
                            <strong>Prompt ready:</strong> {result.prompt?.positive?.slice(0, 120)}…
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {BRAND.watermark && (
                  <div className="gv-watermark">GardenVision AI · Concept Preview</div>
                )}
              </div>

              <div className="gv-result-summary">
                <div className="gv-result-summary-label">Concept details</div>
                <div className="gv-result-summary-text">{result.prompt?.summary}</div>
                <div className="gv-result-disclaimer">
                  Concept images are for inspiration and planning purposes only. Results may vary.
                </div>
              </div>
            </div>

            {/* Action cards */}
            <div className="gv-action-grid">
              <div className="gv-action-card primary" onClick={() => setStep('lead')}>
                <div className="gv-action-icon">✉</div>
                <div className="gv-action-name">Request a quote</div>
                <div className="gv-action-desc">Connect with a landscaping specialist about this concept</div>
              </div>
              <div className="gv-action-card" onClick={() => { setGenError(null); setStep('style') }}>
                <div className="gv-action-icon">↻</div>
                <div className="gv-action-name">Try another style</div>
                <div className="gv-action-desc">Regenerate with a different style or feature selection</div>
              </div>
            </div>

            {/* Upgrade prompt */}
            {remaining <= 1 && (
              <div className="gv-upgrade-card">
                <div className="gv-upgrade-inner">
                  <div>
                    <h3 className="gv-upgrade-title">Unlock unlimited concepts</h3>
                    <p className="gv-upgrade-sub">You've used most of your free generations. Upgrade to explore further.</p>
                    <ul className="gv-upgrade-list">
                      <li>Unlimited concept generations</li>
                      <li>Higher resolution outputs</li>
                      <li>Multiple style variants at once</li>
                      <li>No watermark — download and share</li>
                      <li>Day to night and seasonal variations</li>
                    </ul>
                  </div>
                  <button className="gv-upgrade-btn" onClick={() => setStep('lead')}>
                    Upgrade my plan →
                  </button>
                </div>
              </div>
            )}

            <button className="gv-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setStep('lead')}>
              Get a landscaping quote for this concept
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════
            LEAD FORM
        ════════════════════════════════════════════ */}
        {step === 'lead' && (
          <div className="gv-main gv-fade">
            {!leadSubmitted ? (
              <div className="gv-lead-card">
                <div className="gv-lead-eyebrow">Free consultation</div>
                <h2 className="gv-h2" style={{ marginBottom: 8 }}>{BRAND.leadFormHeading}</h2>
                <p className="gv-lead-sub">
                  Share your details and we'll connect you with a landscaping specialist who can bring this concept to life.
                </p>

                {result?.prompt?.summary && (
                  <div className="gv-lead-concept-tag">
                    📋 Concept attached: <strong>{result.prompt.summary}</strong>
                  </div>
                )}

                <form onSubmit={submitLead} className="gv-lead-form">
                  <div className="gv-form-row">
                    <div className="gv-form-group">
                      <label className="gv-form-label">Your name *</label>
                      <input className="gv-form-input" required placeholder="Jane Smith"
                        value={lead.name} onChange={e => setLead(l => ({ ...l, name: e.target.value }))} />
                    </div>
                    <div className="gv-form-group">
                      <label className="gv-form-label">Email address *</label>
                      <input className="gv-form-input" type="email" required placeholder="jane@example.com"
                        value={lead.email} onChange={e => setLead(l => ({ ...l, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="gv-form-row">
                    <div className="gv-form-group">
                      <label className="gv-form-label">Postcode / area *</label>
                      <input className="gv-form-input" required placeholder="SS1 1AA"
                        value={lead.postcode} onChange={e => setLead(l => ({ ...l, postcode: e.target.value }))} />
                    </div>
                    <div className="gv-form-group">
                      <label className="gv-form-label">Phone number <span className="gv-optional">(optional)</span></label>
                      <input className="gv-form-input" type="tel" placeholder="+44 7700 000 000"
                        value={lead.phone} onChange={e => setLead(l => ({ ...l, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="gv-form-group">
                    <label className="gv-form-label">Tell us about your project <span className="gv-optional">(optional)</span></label>
                    <textarea className="gv-form-input gv-textarea" placeholder="Timeline, budget, specific questions…"
                      value={lead.notes} onChange={e => setLead(l => ({ ...l, notes: e.target.value }))} />
                  </div>

                  <button type="submit" className="gv-cta" style={{ width: '100%', justifyContent: 'center' }} disabled={leadLoading}>
                    {leadLoading ? 'Sending…' : BRAND.leadFormCTA}
                  </button>

                  <p className="gv-form-legal">
                    Your details are used only to connect you with a landscaping specialist.
                    We won't share them with third parties or send you unsolicited marketing.
                  </p>
                </form>
              </div>
            ) : (
              <div className="gv-lead-card" style={{ textAlign: 'center' }}>
                <div className="gv-success-icon">✦</div>
                <h2 className="gv-h2" style={{ marginBottom: 12 }}>
                  Thank you, {lead.name.split(' ')[0] || 'there'}
                </h2>
                <p className="gv-lead-sub" style={{ marginBottom: 32 }}>
                  We've received your concept request. A landscaping specialist will be in touch at <strong>{lead.email}</strong>.
                </p>
                <button className="gv-cta" onClick={() => {
                  setLeadSubmitted(false); setStep('style')
                  setSelectedStyle(null); setSelectedFeatures([])
                }}>
                  Generate another concept →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="gv-footer">
          <div className="gv-footer-inner">
            <div className="gv-footer-logo">GardenVision AI</div>
            <p>Concept images are for inspiration and planning purposes only.</p>
            <p>Results may not reflect exact final outcomes. Always consult a qualified landscaper before commencing work.</p>
          </div>
        </footer>

      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,600&family=DM+Sans:wght@300;400;500&display=swap');

.gv-app { min-height:100vh; background:#f5f2ec; color:#18261a; }

/* Header */
.gv-header { background:#18261a; padding:18px 40px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
.gv-logo { font-family:'Cormorant Garamond',serif; color:#e6d9c0; font-size:22px; font-weight:600; letter-spacing:0.02em; }
.gv-logo span { color:#7cb986; }
.gv-badge-green { background:rgba(124,185,134,0.15); border:1px solid rgba(124,185,134,0.3); color:#7cb986; font-size:12px; padding:5px 14px; border-radius:20px; font-weight:500; }
.gv-badge-dark { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#e6d9c0; font-size:12px; padding:5px 14px; border-radius:20px; font-weight:400; }

/* Progress */
.gv-progress { background:#18261a; padding:0 40px 16px; display:flex; align-items:center; }
.gv-pstep { display:flex; align-items:center; gap:8px; font-size:12px; color:rgba(230,217,192,0.3); font-weight:400; letter-spacing:0.06em; text-transform:uppercase; transition:color 0.3s; white-space:nowrap; }
.gv-pstep.active { color:#e6d9c0; }
.gv-pstep.done { color:#7cb986; }
.gv-pdot { width:6px; height:6px; border-radius:50%; background:rgba(230,217,192,0.15); flex-shrink:0; transition:background 0.3s; }
.gv-pstep.active .gv-pdot { background:#e6d9c0; }
.gv-pstep.done .gv-pdot { background:#7cb986; }
.gv-pline { flex:1; height:1px; background:rgba(230,217,192,0.08); margin:0 16px; }

/* Hero */
.gv-hero { max-width:840px; margin:0 auto; padding:88px 32px 64px; text-align:center; }
.gv-eyebrow { display:inline-flex; align-items:center; gap:9px; background:#e8f4eb; color:#2d5438; font-size:13px; font-weight:500; padding:7px 18px; border-radius:24px; margin-bottom:32px; letter-spacing:0.02em; }
.gv-eyebrow-dot { width:7px; height:7px; border-radius:50%; background:#4a7c59; flex-shrink:0; }
.gv-h1 { font-family:'Cormorant Garamond',serif; font-size:clamp(44px,6.5vw,78px); font-weight:600; color:#18261a; line-height:1.06; margin-bottom:28px; letter-spacing:-0.025em; }
.gv-h1 em { color:#4a7c59; font-style:italic; }
.gv-h2 { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; color:#18261a; line-height:1.15; margin-bottom:6px; }
.gv-hero-p { font-size:18px; color:#556b57; line-height:1.7; max-width:540px; margin:0 auto 44px; font-weight:300; }
.gv-hero-note { font-size:13px; color:#94a895; margin-top:20px; }

/* Trust row */
.gv-trust-row { max-width:640px; margin:0 auto; padding:0 32px 48px; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.gv-trust-card { background:#fff; border:1.5px solid #e4dfd6; border-radius:16px; padding:28px 16px; text-align:center; }
.gv-trust-n { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:600; color:#18261a; margin-bottom:6px; }
.gv-trust-label { font-size:13px; color:#7a8c7b; }

/* Style strip */
.gv-style-strip-wrap { max-width:900px; margin:0 auto; padding:0 32px 80px; }
.gv-section-label { font-size:12px; font-weight:500; color:#18261a; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:16px; }
.gv-optional { font-weight:400; color:#94a895; text-transform:none; letter-spacing:0; }
.gv-style-strip { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.gv-strip-pill { background:#fff; border:1.5px solid #e4dfd6; border-radius:24px; padding:8px 18px; font-size:13px; color:#556b57; cursor:pointer; transition:all 0.2s; font-weight:400; }
.gv-strip-pill:hover { border-color:#4a7c59; color:#2d5438; background:#f0f8f2; }

/* Upload */
.gv-upload-wrap { max-width:680px; margin:0 auto; padding:48px 24px 80px; }
.gv-step-header { margin-bottom:32px; }
.gv-step-num { font-size:12px; color:#4a7c59; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px; }
.gv-step-sub { font-size:15px; color:#556b57; margin-top:8px; }
.gv-dropzone { border:2px dashed #cdd8ce; border-radius:22px; background:#fff; padding:72px 40px; text-align:center; cursor:pointer; transition:all 0.25s; }
.gv-dropzone:hover, .gv-dropzone.dragging { border-color:#4a7c59; background:#f0f8f2; }
.gv-drop-icon { font-size:40px; margin-bottom:20px; }
.gv-drop-title { font-size:19px; font-weight:500; color:#18261a; margin-bottom:10px; }
.gv-drop-sub { font-size:14px; color:#94a895; margin-bottom:24px; }
.gv-upload-btn { background:#18261a; color:#e6d9c0; border:none; padding:13px 28px; border-radius:9px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.2s; letter-spacing:0.02em; }
.gv-upload-btn:hover { background:#2e4831; }
.gv-drop-formats { margin-top:16px; font-size:12px; color:#b0bcb1; }
.gv-upload-tips { margin-top:28px; display:flex; flex-direction:column; gap:8px; }
.gv-tip { font-size:13px; color:#7a8c7b; padding-left:2px; }

/* Main content area */
.gv-main { max-width:960px; margin:0 auto; padding:48px 24px 80px; }

/* Preview card */
.gv-preview-card { background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 2px 32px rgba(24,38,26,0.07); margin-bottom:20px; }
.gv-preview-img { width:100%; height:300px; object-fit:cover; display:block; }
.gv-preview-footer { padding:14px 20px; display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f0ede8; }
.gv-preview-label { font-size:14px; color:#556b57; }
.gv-change-btn { background:none; border:1.5px solid #cdd8ce; color:#4a7c59; padding:7px 16px; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; font-weight:500; }
.gv-change-btn:hover { background:#f0f8f2; }

/* Usage */
.gv-usage-bar { background:#fff; border:1.5px solid #e4dfd6; border-radius:12px; padding:14px 18px; margin-bottom:28px; display:flex; align-items:center; gap:14px; }
.gv-usage-label { font-size:13px; color:#556b57; flex:1; }
.gv-usage-track { width:100px; height:5px; background:#f0ede8; border-radius:3px; overflow:hidden; }
.gv-usage-fill { height:100%; background:#4a7c59; border-radius:3px; transition:width 0.5s; }
.gv-usage-count { font-size:13px; font-weight:500; color:#18261a; }

/* Error */
.gv-error { background:#fff4f4; border:1.5px solid #f0c0c0; color:#8b2020; border-radius:10px; padding:12px 16px; margin-bottom:20px; font-size:14px; }

/* Style grid */
.gv-style-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:12px; margin-bottom:40px; }
.gv-style-card { background:#fff; border:2px solid #e4dfd6; border-radius:14px; padding:20px 16px 18px; cursor:pointer; transition:all 0.2s; position:relative; }
.gv-style-card:hover { border-color:#b8d4bc; transform:translateY(-2px); box-shadow:0 4px 16px rgba(74,124,89,0.1); }
.gv-style-card.selected { border-color:#4a7c59; background:#f0f8f2; }
.gv-style-check { position:absolute; top:12px; right:12px; width:20px; height:20px; border-radius:50%; background:#4a7c59; color:#fff; font-size:11px; display:flex; align-items:center; justify-content:center; font-weight:600; }
.gv-style-emoji { font-size:20px; margin-bottom:10px; color:#4a7c59; }
.gv-style-name { font-size:14px; font-weight:500; color:#18261a; margin-bottom:5px; }
.gv-style-desc { font-size:12px; color:#94a895; line-height:1.45; }

/* Feature toggles */
.gv-features-section { margin-bottom:36px; }
.gv-features-grid { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.gv-feature-toggle { border:1.5px solid #ddd8d0; background:#fff; color:#556b57; padding:9px 18px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; font-weight:400; }
.gv-feature-toggle:hover { border-color:#4a7c59; color:#2d5438; }
.gv-feature-toggle.selected { border-color:#4a7c59; background:#e8f4eb; color:#2d5438; font-weight:500; }

/* Selection summary */
.gv-selection-summary { background:#18261a; border-radius:12px; padding:16px 20px; margin-bottom:24px; }
.gv-summary-label { font-size:11px; color:#7cb986; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px; }
.gv-summary-text { font-size:14px; color:#e6d9c0; }

/* CTA */
.gv-cta { background:#18261a; color:#e6d9c0; border:none; padding:16px 32px; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:500; cursor:pointer; transition:all 0.25s; letter-spacing:0.01em; display:inline-flex; align-items:center; gap:10px; }
.gv-cta:hover { background:#2e4831; transform:translateY(-1px); }
.gv-cta:disabled { opacity:0.35; cursor:not-allowed; transform:none; }
.gv-cta-arrow { font-size:18px; transition:transform 0.2s; }
.gv-cta:hover .gv-cta-arrow { transform:translateX(3px); }
.gv-cta-hint { font-size:13px; color:#94a895; }
.gv-style-cta-row { display:flex; align-items:center; gap:20px; }

/* Generation */
.gv-gen-panel { max-width:600px; margin:0 auto; padding:80px 24px; text-align:center; }
.gv-gen-anim { width:120px; height:120px; margin:0 auto 44px; position:relative; }
.gv-ring { position:absolute; border-radius:50%; border:2px solid transparent; }
.gv-ring1 { inset:0; border-top-color:#4a7c59; border-right-color:#4a7c59; animation:spin 3s linear infinite; }
.gv-ring2 { inset:14px; border-top-color:#b8d4bc; animation:spin 2s linear infinite reverse; }
.gv-ring3 { inset:28px; border-top-color:#e6d9c0; animation:spin 1.5s linear infinite; }
.gv-gen-center { position:absolute; inset:40px; background:#18261a; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#7cb986; font-size:18px; }
@keyframes spin { to { transform:rotate(360deg); } }
.gv-gen-title { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:600; color:#18261a; margin-bottom:12px; }
.gv-gen-sub { font-size:15px; color:#94a895; margin-bottom:36px; }
.gv-gen-steps { list-style:none; text-align:left; display:inline-block; }
.gv-gstep { display:flex; align-items:center; gap:12px; padding:10px 0; font-size:14px; color:#b0bcb1; transition:color 0.4s; }
.gv-gstep.active { color:#18261a; }
.gv-gstep.done { color:#4a7c59; }
.gv-gstep-dot { width:7px; height:7px; border-radius:50%; background:#ddd8d0; flex-shrink:0; transition:background 0.4s; }
.gv-gstep.active .gv-gstep-dot { background:#18261a; }
.gv-gstep.done .gv-gstep-dot { background:#4a7c59; }
.gv-gen-note { margin-top:36px; font-size:13px; color:#b0bcb1; }

/* Compare */
.gv-compare-card { background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 2px 40px rgba(24,38,26,0.09); margin-bottom:24px; }
.gv-compare-tabs { display:flex; border-bottom:1px solid #f0ede8; }
.gv-ctab { flex:1; padding:14px; text-align:center; font-size:12px; font-weight:500; cursor:pointer; color:#b0bcb1; border:none; background:none; font-family:'DM Sans',sans-serif; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all 0.2s; letter-spacing:0.05em; text-transform:uppercase; }
.gv-ctab.active { color:#18261a; border-bottom-color:#4a7c59; }
.gv-compare-img-wrap { position:relative; }
.gv-compare-img { width:100%; height:440px; object-fit:cover; display:block; }
.gv-demo-notice { position:absolute; inset:0; background:rgba(24,38,26,0.6); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:32px; }
.gv-demo-inner { max-width:460px; text-align:center; }
.gv-demo-tag { font-size:12px; color:#7cb986; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:14px; }
.gv-demo-msg { font-size:15px; color:rgba(230,217,192,0.85); line-height:1.6; margin-bottom:16px; }
.gv-demo-msg code { background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px; font-size:13px; }
.gv-demo-prompt { font-size:12px; color:rgba(230,217,192,0.5); line-height:1.5; font-style:italic; text-align:left; }
.gv-watermark { position:absolute; bottom:16px; right:16px; background:rgba(24,38,26,0.65); color:rgba(230,217,192,0.8); font-size:11px; padding:5px 13px; border-radius:5px; font-weight:500; letter-spacing:0.05em; backdrop-filter:blur(4px); }
.gv-result-summary { background:#18261a; color:#e6d9c0; padding:20px 24px; }
.gv-result-summary-label { font-size:11px; color:#7cb986; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:7px; }
.gv-result-summary-text { font-size:15px; margin-bottom:10px; }
.gv-result-disclaimer { font-size:12px; color:rgba(230,217,192,0.35); }

/* Action grid */
.gv-action-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
.gv-action-card { background:#fff; border:2px solid #e4dfd6; border-radius:16px; padding:28px 22px; cursor:pointer; transition:all 0.2s; }
.gv-action-card:hover { border-color:#4a7c59; transform:translateY(-2px); box-shadow:0 4px 20px rgba(74,124,89,0.1); }
.gv-action-card.primary { border-color:#4a7c59; background:#f0f8f2; }
.gv-action-icon { font-size:24px; margin-bottom:12px; }
.gv-action-name { font-size:15px; font-weight:500; color:#18261a; margin-bottom:6px; }
.gv-action-desc { font-size:13px; color:#94a895; line-height:1.4; }

/* Upgrade */
.gv-upgrade-card { background:#18261a; border-radius:20px; padding:36px; margin-bottom:20px; overflow:hidden; position:relative; }
.gv-upgrade-card::before { content:''; position:absolute; top:-60px; right:-60px; width:220px; height:220px; background:rgba(124,185,134,0.06); border-radius:50%; }
.gv-upgrade-inner { position:relative; z-index:1; }
.gv-upgrade-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:600; color:#e6d9c0; margin-bottom:8px; }
.gv-upgrade-sub { font-size:14px; color:rgba(230,217,192,0.5); margin-bottom:20px; }
.gv-upgrade-list { list-style:none; margin-bottom:28px; }
.gv-upgrade-list li { font-size:13px; color:rgba(230,217,192,0.75); padding:5px 0 5px 20px; position:relative; }
.gv-upgrade-list li::before { content:'✓'; position:absolute; left:0; color:#7cb986; font-weight:600; }
.gv-upgrade-btn { background:#7cb986; color:#18261a; border:none; padding:13px 28px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; letter-spacing:0.02em; }
.gv-upgrade-btn:hover { background:#8fcc9e; }

/* Lead form */
.gv-lead-card { background:#fff; border-radius:20px; padding:44px 40px; box-shadow:0 2px 40px rgba(24,38,26,0.07); max-width:660px; margin:0 auto; }
.gv-lead-eyebrow { font-size:12px; color:#4a7c59; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:10px; }
.gv-lead-sub { font-size:15px; color:#7a8c7b; margin-bottom:24px; line-height:1.6; }
.gv-lead-concept-tag { background:#f5f2ec; border-radius:10px; padding:13px 16px; margin-bottom:28px; font-size:13px; color:#556b57; }
.gv-lead-concept-tag strong { color:#18261a; }
.gv-lead-form { display:flex; flex-direction:column; gap:16px; }
.gv-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.gv-form-group { display:flex; flex-direction:column; gap:7px; }
.gv-form-label { font-size:12px; font-weight:500; color:#556b57; letter-spacing:0.04em; text-transform:uppercase; }
.gv-form-input { background:#f7f4ef; border:1.5px solid #e4dfd6; border-radius:9px; padding:12px 15px; font-family:'DM Sans',sans-serif; font-size:14px; color:#18261a; outline:none; width:100%; transition:border-color 0.2s; }
.gv-form-input:focus { border-color:#4a7c59; background:#fff; }
.gv-textarea { resize:vertical; min-height:88px; }
.gv-form-legal { font-size:12px; color:#b0bcb1; line-height:1.6; margin-top:4px; }

/* Success */
.gv-success-icon { font-size:44px; color:#4a7c59; margin-bottom:20px; }

/* Footer */
.gv-footer { background:#18261a; padding:40px; margin-top:40px; }
.gv-footer-inner { max-width:640px; margin:0 auto; text-align:center; }
.gv-footer-logo { font-family:'Cormorant Garamond',serif; color:#7cb986; font-size:18px; font-weight:600; margin-bottom:12px; }
.gv-footer p { font-size:12px; color:rgba(230,217,192,0.3); line-height:1.7; }

/* Fade animation */
.gv-fade { animation:gvFade 0.45s ease forwards; }
@keyframes gvFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

/* Mobile */
@media (max-width:640px) {
  .gv-header { padding:16px 20px; }
  .gv-progress { padding:0 20px 14px; }
  .gv-hero { padding:52px 20px 44px; }
  .gv-main, .gv-upload-wrap { padding-left:16px; padding-right:16px; }
  .gv-form-row { grid-template-columns:1fr; }
  .gv-action-grid { grid-template-columns:1fr; }
  .gv-style-grid { grid-template-columns:1fr 1fr; }
  .gv-trust-row { grid-template-columns:repeat(3,1fr); gap:10px; }
  .gv-trust-card { padding:20px 12px; }
  .gv-trust-n { font-size:28px; }
  .gv-lead-card { padding:28px 20px; }
  .gv-compare-img { height:280px; }
}
`
