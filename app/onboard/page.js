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
        body: JSON.stringify({ body: { event: { text: text.trim() } } }),
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fafa' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #d4ecf0', borderTopColor: '#16a0a7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const charCount = text.length
  const isLong = charCount > 2000

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fafa 0%, #e8f4f8 40%, #f5fbf5 100%)', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #9bb8c2; }
        textarea:focus, input:focus { outline: none; }
        .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(22,160,167,0.3); }
        .send-btn { transition: all 0.2s; }
        .nav-btn:hover { background: #f0f8fa !important; }
        .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Setup Modal */}
      {showSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,58,92,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="fade-in" style={{ background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(26,58,92,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #16a0a7, #1a3a5c)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: '#1a3a5c' }}>Connect your webhook</h2>
                <p style={{ fontSize: 13, color: '#7a9aaa' }}>One-time setup</p>
              </div>
            </div>

            <div style={{ background: '#f0fafa', border: '1px solid #d4ecf0', borderRadius: 12, padding: '14px 16px', margin: '20px 0' }}>
              <p style={{ fontSize: 13, color: '#5a8a9a', lineHeight: 1.6 }}>
                Paste your <strong style={{ color: '#1a3a5c' }}>n8n webhook Production URL</strong>. All captures will POST directly to this URL — no API keys needed here.
              </p>
            </div>

            <form onSubmit={saveWebhook}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a8a9a', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>N8N WEBHOOK URL</label>
              <input
                type="url" required
                placeholder="https://your-n8n.railway.app/webhook/..."
                value={webhookInput}
                onChange={e => setWebhookInput(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px',
                  background: '#f7fbfc', border: '1.5px solid #d4ecf0',
                  borderRadius: 10, color: '#1a3a5c', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: 20,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#16a0a7'}
                onBlur={e => e.target.style.borderColor = '#d4ecf0'}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={savingWebhook} style={{
                  flex: 1, padding: '13px',
                  background: 'linear-gradient(135deg, #16a0a7, #1a3a5c)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  cursor: savingWebhook ? 'not-allowed' : 'pointer',
                }}>
                  {savingWebhook ? 'Saving...' : 'Save & Connect →'}
                </button>
                {webhookSaved && (
                  <button type="button" onClick={() => setShowSetup(false)} style={{
                    padding: '13px 20px', background: 'white',
                    border: '1.5px solid #d4ecf0', borderRadius: 10,
                    color: '#5a8a9a', fontSize: 14, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e8f0f4',
        padding: '0 32px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(26,58,92,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
            <path d="M50 10 L80 30 L80 50 Q80 75 50 88 Q20 75 20 50 L20 30 Z" fill="#16a0a7" opacity="0.15"/>
            <path d="M50 18 L74 34 L74 50 Q74 70 50 82 Q26 70 26 50 L26 34 Z" fill="none" stroke="#16a0a7" strokeWidth="2.5"/>
            <path d="M38 50 L46 58 L62 42" stroke="#1a3a5c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#1a3a5c' }}>BrainDump</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {webhookSaved ? (
            <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Webhook connected
            </span>
          ) : (
            <span className="badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
              ⚠ No webhook
            </span>
          )}
          <button className="nav-btn" onClick={() => { setShowSetup(true) }} style={{
            background: 'white', border: '1.5px solid #d4ecf0', borderRadius: 8,
            padding: '6px 14px', color: '#5a8a9a', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
          }}>Settings</button>
          <button className="nav-btn" onClick={handleSignOut} style={{
            background: 'white', border: '1.5px solid #d4ecf0', borderRadius: 8,
            padding: '6px 14px', color: '#5a8a9a', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
          }}>Sign out</button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '52px 24px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 42, fontWeight: 800,
            color: '#1a3a5c',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 12,
          }}>
            Dump your brain.
          </h1>
          <p style={{ fontSize: 17, color: '#5a8a9a', lineHeight: 1.6, maxWidth: 560 }}>
            Paste anything — a meeting transcript, resume, article, or stream of consciousness. It gets sent to your n8n brain and stored as searchable memories.
          </p>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { icon: '⚡', label: 'Short text saved instantly' },
            { icon: '🧠', label: 'Long text split into atomic memories' },
            { icon: '🔍', label: 'Searchable by meaning via MCP' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', border: '1px solid #e8f0f4',
              borderRadius: 20, padding: '6px 14px',
              fontSize: 12, color: '#5a8a9a', fontWeight: 500,
              boxShadow: '0 1px 4px rgba(26,58,92,0.05)',
            }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Input card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(26,58,92,0.08)',
          overflow: 'hidden',
          border: '1px solid #e8f0f4',
        }}>

          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); if (pdfFile) setPdfFile(null) }}
              placeholder="Paste a meeting transcript, LinkedIn profile, resume, article, notes, or any text you want to remember..."
              style={{
                width: '100%',
                minHeight: 280,
                background: 'white',
                border: 'none',
                borderBottom: '1px solid #e8f0f4',
                color: '#1a3a5c',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.7,
                padding: '28px 28px 20px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Toolbar */}
          <div style={{
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#fafcfe',
          }}>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfFile?.status === 'loading'}
              style={{
                background: 'white', border: '1.5px solid #d4ecf0',
                borderRadius: 8, padding: '7px 14px',
                color: '#5a8a9a', fontSize: 12, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: pdfFile?.status === 'loading' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>📎</span>
              {pdfFile?.status === 'loading' ? 'Reading...' : 'Attach PDF'}
            </button>

            {pdfFile && pdfFile.status !== 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: pdfFile.status === 'ready' ? '#16a34a' : '#dc2626' }}>
                  {pdfFile.status === 'ready' ? '✓' : '✗'}
                </span>
                <span style={{ color: '#7a9aaa', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</span>
                <button onClick={() => { setPdfFile(null); setText('') }} style={{ background: 'none', border: 'none', color: '#9bb8c2', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {charCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#9bb8c2' }}>{charCount.toLocaleString()} chars</span>
                  {isLong && (
                    <span className="badge" style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
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
                  padding: '10px 24px',
                  background: sent
                    ? 'linear-gradient(135deg, #16a34a, #15803d)'
                    : !text.trim() || !webhookUrl
                    ? '#d4ecf0'
                    : 'linear-gradient(135deg, #16a0a7, #1a3a5c)',
                  color: !text.trim() || !webhookUrl ? '#9bb8c2' : 'white',
                  border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: !text.trim() || !webhookUrl || sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  minWidth: 120, justifyContent: 'center',
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
            background: '#fff5f5', border: '1px solid #fecaca',
            borderRadius: 12, padding: '14px 18px',
            color: '#dc2626', fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
        )}

        {/* How it works */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#9bb8c2', letterSpacing: '0.1em', marginBottom: 20 }}>HOW IT WORKS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { step: '01', title: 'Paste anything', desc: 'Text, transcripts, PDFs, notes — any length works.' },
              { step: '02', title: 'Claude extracts', desc: 'Long content gets split into focused atomic memories.' },
              { step: '03', title: 'Search by meaning', desc: 'Ask Claude "what do I know about X?" from any MCP tool.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{
                background: 'white', border: '1px solid #e8f0f4',
                borderRadius: 14, padding: '20px',
                boxShadow: '0 1px 4px rgba(26,58,92,0.04)',
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#d4ecf0', marginBottom: 8 }}>{step}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a3a5c', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#7a9aaa', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
