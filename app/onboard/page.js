'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function OnboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSaved, setWebhookSaved] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [webhookInput, setWebhookInput] = useState('')
  const [savingWebhook, setSavingWebhook] = useState(false)

  const [text, setText] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      loadWebhook(data.user.id)
    })
  }, [])

  async function loadWebhook(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', userId)
      .single()
    if (data?.webhook_url) {
      setWebhookUrl(data.webhook_url)
      setWebhookInput(data.webhook_url)
      setWebhookSaved(true)
    } else {
      setShowSetup(true)
    }
  }

  async function saveWebhook(e) {
    e.preventDefault()
    if (!webhookInput.trim()) return
    setSavingWebhook(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, webhook_url: webhookInput.trim(), updated_at: new Date().toISOString() })
    if (!error) {
      setWebhookUrl(webhookInput.trim())
      setWebhookSaved(true)
      setShowSetup(false)
    }
    setSavingWebhook(false)
  }

  async function handlePdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return
    setPdfFile({ name: file.name, status: 'loading' })
    setText('')
    try {
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          script.onload = resolve; script.onerror = reject
          document.head.appendChild(script)
        })
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map(item => item.str).join(' ') + '\n'
      }
      setText(fullText.trim())
      setPdfFile({ name: file.name, status: 'ready' })
    } catch (err) {
      setPdfFile({ name: file.name, status: 'error' })
      setError('Could not read PDF. Try copying the text manually.')
    }
    e.target.value = ''
  }

  async function handleSend() {
    if (!text.trim() || !webhookUrl) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { text: text.trim() } }),
      })
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`)
      setSent(true)
      setTimeout(() => {
        setSent(false)
        setText('')
        setPdfFile(null)
      }, 3000)
    } catch (err) {
      setError(`Failed to send: ${err.message}`)
    }
    setSending(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060b18' }}>
      <div style={{ width: 40, height: 40, border: '2.5px solid rgba(22,160,167,0.15)', borderTopColor: '#16a0a7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const charCount = text.length
  const isLong = charCount > 2000

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #0f1d32 0%, #060b18 70%)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #3a4560; }
        textarea:focus, input:focus { outline: none; }
        .send-btn { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(22,160,167,0.3); }
        .send-btn:active:not(:disabled) { transform: translateY(0); }
        .nav-btn { transition: all 0.2s; }
        .nav-btn:hover { background: rgba(22, 160, 167, 0.08) !important; border-color: rgba(22, 160, 167, 0.3) !important; color: #16a0a7 !important; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(22, 160, 167, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(22, 160, 167, 0.02) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; z-index: 0; }
        .card-glow { transition: all 0.4s; }
        .card-glow:focus-within { border-color: rgba(22, 160, 167, 0.25) !important; box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(22, 160, 167, 0.08) !important; }
        .how-card { transition: all 0.3s; }
        .how-card:hover { transform: translateY(-4px); border-color: rgba(22, 160, 167, 0.2) !important; box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important; }
        .pdf-btn { transition: all 0.2s; }
        .pdf-btn:hover { border-color: rgba(22,160,167,0.3) !important; background: rgba(22,160,167,0.05) !important; }
      `}</style>

      <div className="grid-bg" />

      {/* Setup Modal */}
      {showSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,11,24,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20, backdropFilter: 'blur(8px)' }}>
          <div className="fade-in" style={{
            background: 'rgba(12, 18, 34, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: 24, padding: '44px 40px',
            width: '100%', maxWidth: 500,
            border: '1px solid rgba(22, 160, 167, 0.12)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44,
                background: 'linear-gradient(135deg, rgba(22, 160, 167, 0.2), rgba(26, 58, 92, 0.3))',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(22, 160, 167, 0.2)',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a0a7" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: '#e8edf5' }}>Connect your webhook</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>One-time setup</p>
              </div>
            </div>

            <div style={{
              background: 'rgba(22, 160, 167, 0.06)',
              border: '1px solid rgba(22, 160, 167, 0.12)',
              borderRadius: 14, padding: '16px 18px', margin: '24px 0',
            }}>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                Paste your <strong style={{ color: '#e8edf5' }}>n8n webhook Production URL</strong>. All captures will POST directly to this URL.
              </p>
            </div>

            <form onSubmit={saveWebhook}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>N8N WEBHOOK URL</label>
              <input
                type="url" required
                placeholder="https://your-n8n.railway.app/webhook/..."
                value={webhookInput}
                onChange={e => setWebhookInput(e.target.value)}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#0a1020',
                  border: '1.5px solid rgba(22, 160, 167, 0.12)',
                  borderRadius: 12, color: '#e8edf5', fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: 24,
                  transition: 'all 0.3s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(22, 160, 167, 0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(22, 160, 167, 0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(22, 160, 167, 0.12)'; e.target.style.boxShadow = 'none'; }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={savingWebhook} className="send-btn" style={{
                  flex: 1, padding: '14px',
                  background: 'linear-gradient(135deg, #16a0a7 0%, #0d7a80 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  cursor: savingWebhook ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(22, 160, 167, 0.2)',
                }}>
                  {savingWebhook ? 'Saving...' : 'Save & Connect →'}
                </button>
                {webhookSaved && (
                  <button type="button" onClick={() => setShowSetup(false)} className="nav-btn" style={{
                    padding: '14px 24px',
                    background: 'transparent',
                    border: '1.5px solid rgba(22, 160, 167, 0.15)',
                    borderRadius: 12,
                    color: '#94a3b8', fontSize: 14, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'rgba(6, 11, 24, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(22, 160, 167, 0.08)',
        padding: '0 32px',
        height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="BrainDump"
            style={{ width: 34, height: 34, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div style={{
            display: 'none',
            width: 34, height: 34,
            background: 'linear-gradient(135deg, rgba(22,160,167,0.15), rgba(26,58,92,0.2))',
            borderRadius: 10,
            alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(22,160,167,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
              <path d="M50 10 L80 30 L80 50 Q80 75 50 88 Q20 75 20 50 L20 30 Z" fill="#16a0a7" opacity="0.2" />
              <path d="M50 18 L74 34 L74 50 Q74 70 50 82 Q26 70 26 50 L26 34 Z" fill="none" stroke="#16a0a7" strokeWidth="3" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#e8edf5' }}>Brain</span>
            <span style={{ color: '#16a0a7' }}>Dump</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {webhookSaved ? (
            <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }} />
              Connected
            </span>
          ) : (
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              ⚠ No webhook
            </span>
          )}
          <button className="nav-btn" onClick={() => { setShowSetup(true) }} style={{
            background: 'transparent', border: '1.5px solid rgba(22, 160, 167, 0.12)', borderRadius: 10,
            padding: '7px 16px', color: '#94a3b8', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>Settings</button>
          <button className="nav-btn" onClick={handleSignOut} style={{
            background: 'transparent', border: '1.5px solid rgba(22, 160, 167, 0.12)', borderRadius: 10,
            padding: '7px 16px', color: '#94a3b8', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          }}>Sign out</button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div style={{ marginBottom: 44 }} className="fade-in">
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 14,
          }}>
            <span style={{ color: '#e8edf5' }}>Dump your </span>
            <span style={{
              background: 'linear-gradient(135deg, #16a0a7, #2dd4bf)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>brain.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.7, maxWidth: 580 }}>
            Paste anything — a meeting transcript, resume, article, or stream of consciousness.
            It gets sent to your n8n brain and stored as searchable memories.
          </p>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '⚡', label: 'Short text saved instantly' },
            { icon: '🧠', label: 'Long text split into atomic memories' },
            { icon: '🔍', label: 'Searchable by meaning via MCP' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(12, 18, 34, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(22, 160, 167, 0.08)',
              borderRadius: 24, padding: '7px 16px',
              fontSize: 12, color: '#94a3b8', fontWeight: 500,
            }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Input card */}
        <div className="card-glow" style={{
          background: 'rgba(12, 18, 34, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(22, 160, 167, 0.1)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
        }}>

          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); if (pdfFile) setPdfFile(null) }}
              placeholder="Paste a meeting transcript, LinkedIn profile, resume, article, notes, or any text you want to remember..."
              style={{
                width: '100%',
                minHeight: 300,
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(22, 160, 167, 0.06)',
                color: '#e8edf5',
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                lineHeight: 1.8,
                padding: '30px 30px 24px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Toolbar */}
          <div style={{
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(6, 11, 24, 0.4)',
          }}>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
            <button
              type="button"
              className="pdf-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfFile?.status === 'loading'}
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(22, 160, 167, 0.12)',
                borderRadius: 10, padding: '8px 16px',
                color: '#94a3b8', fontSize: 12, fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                cursor: pdfFile?.status === 'loading' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <span>📎</span>
              {pdfFile?.status === 'loading' ? 'Reading...' : 'Attach PDF'}
            </button>

            {pdfFile && pdfFile.status !== 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                <span style={{ color: pdfFile.status === 'ready' ? '#22c55e' : '#ef4444' }}>
                  {pdfFile.status === 'ready' ? '✓' : '✗'}
                </span>
                <span style={{ color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</span>
                <button onClick={() => { setPdfFile(null); setText('') }} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
              {charCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#4a5568' }}>{charCount.toLocaleString()} chars</span>
                  {isLong && (
                    <span className="badge" style={{ background: 'rgba(22, 160, 167, 0.1)', color: '#16a0a7', border: '1px solid rgba(22, 160, 167, 0.2)' }}>
                      → atomic memories
                    </span>
                  )}
                </div>
              )}

              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!text.trim() || !webhookUrl || sending || sent}
                style={{
                  padding: '11px 28px',
                  background: sent
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : !text.trim() || !webhookUrl
                      ? 'rgba(22, 160, 167, 0.15)'
                      : 'linear-gradient(135deg, #16a0a7, #0d7a80)',
                  color: !text.trim() || !webhookUrl ? '#3a4560' : 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: !text.trim() || !webhookUrl || sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  minWidth: 140, justifyContent: 'center',
                  boxShadow: !text.trim() || !webhookUrl ? 'none' : '0 4px 20px rgba(22, 160, 167, 0.2)',
                }}
              >
                {sent ? (
                  <>✓ Sent!</>
                ) : sending ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Sending...
                  </>
                ) : !webhookUrl ? (
                  'Setup required'
                ) : (
                  'Send to Brain →'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="fade-in" style={{
            marginTop: 16,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 14, padding: '14px 20px',
            color: '#ef4444', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: 56 }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: '#4a5568',
            letterSpacing: '0.15em',
            marginBottom: 24,
          }}>HOW IT WORKS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { step: '01', title: 'Paste anything', desc: 'Text, transcripts, PDFs, notes — any length works.' },
              { step: '02', title: 'Claude extracts', desc: 'Long content gets split into focused atomic memories.' },
              { step: '03', title: 'Search by meaning', desc: 'Ask Claude "what do I know about X?" from any MCP tool.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="how-card" style={{
                background: 'rgba(12, 18, 34, 0.5)',
                border: '1px solid rgba(22, 160, 167, 0.08)',
                borderRadius: 18, padding: '24px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 32, fontWeight: 800,
                  background: 'linear-gradient(135deg, rgba(22,160,167,0.3), rgba(22,160,167,0.05))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: 10,
                }}>{step}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e8edf5', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
