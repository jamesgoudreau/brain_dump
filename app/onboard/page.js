'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const CATEGORIES = [
  { id: 'career', label: 'Career History', icon: '◈' },
  { id: 'role', label: 'Current Role', icon: '◉' },
  { id: 'goals', label: 'Goals & Priorities', icon: '◎' },
  { id: 'people', label: 'Key People', icon: '◍' },
  { id: 'communication', label: 'Communication Style', icon: '◌' },
]

const CONFIG_FIELDS = [
  {
    key: 'supabaseUrl',
    label: 'Supabase Project URL',
    placeholder: 'https://xxxx.supabase.co',
    type: 'text',
    help: 'Find this in your Supabase project → Settings → API → Project URL',
    link: 'https://supabase.com/dashboard',
    linkLabel: 'Open Supabase →',
  },
  {
    key: 'supabaseAnonKey',
    label: 'Supabase Anon Key',
    placeholder: 'eyJ...',
    type: 'password',
    help: 'Find this in your Supabase project → Settings → API → anon / public key',
    link: 'https://supabase.com/dashboard',
    linkLabel: 'Open Supabase →',
  },
  {
    key: 'anthropicKey',
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-...',
    type: 'password',
    help: 'Find this at console.anthropic.com → API Keys',
    link: 'https://console.anthropic.com',
    linkLabel: 'Open Anthropic Console →',
  },
]

export default function OnboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [config, setConfig] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [configForm, setConfigForm] = useState({ supabaseUrl: '', supabaseAnonKey: '', anthropicKey: '' })
  const [expandedHelp, setExpandedHelp] = useState(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [text, setText] = useState('')
  const [step, setStep] = useState('input')
  const [thoughts, setThoughts] = useState(null)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})
  const [saveCount, setSaveCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/'); return }
      setUser(data.user)
      const stored = localStorage.getItem('open-brain-config')
      if (stored) {
        const parsed = JSON.parse(stored)
        setConfig(parsed)
        setConfigForm(parsed)
      } else {
        setShowConfig(true)
      }
    })
  }, [])

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
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
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
      setError('Could not read PDF. Try copying the text manually instead.')
    }
    e.target.value = ''
  }

  async function testConnection(form) {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${form.supabaseUrl}/functions/v1/capture-thought`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${form.supabaseAnonKey}` },
        body: JSON.stringify({ text: 'Connection test' }),
      })
      if (res.ok) setTestResult({ ok: true, message: 'Connected successfully!' })
      else setTestResult({ ok: false, message: 'Could not reach your edge function. Check your URL and key.' })
    } catch (e) {
      setTestResult({ ok: false, message: 'Connection failed. Check your Supabase URL.' })
    }
    setTesting(false)
  }

  function saveConfig(e) {
    e.preventDefault()
    localStorage.setItem('open-brain-config', JSON.stringify(configForm))
    setConfig(configForm)
    setShowConfig(false)
    setTestResult(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function extractThoughts() {
    if (!text.trim() || !config) return
    setStep('extracting')
    setError(null)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, anthropicKey: config.anthropicKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Extraction failed.')
        setStep('input')
        if (res.status === 401) setShowConfig(true)
        return
      }
      setThoughts(data.thoughts)
      setTotalCount(Object.values(data.thoughts).flat().length)
      setStep('review')
    } catch (e) {
      setError('Extraction failed. Please try again.')
      setStep('input')
    }
  }

  async function saveThought(category, thought, index) {
    const key = `${category}-${index}`
    setSaving(s => ({ ...s, [key]: true }))
    try {
      await fetch(`${config.supabaseUrl}/functions/v1/capture-thought`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.supabaseAnonKey}` },
        body: JSON.stringify({ text: thought }),
      })
      setSaved(s => ({ ...s, [key]: true }))
      setSaveCount(c => c + 1)
    } catch (e) {}
    finally { setSaving(s => ({ ...s, [key]: false })) }
  }

  async function saveAll() {
    setStep('saving')
    const all = []
    Object.entries(thoughts).forEach(([cat, items]) => {
      items.forEach((t, i) => { if (!saved[`${cat}-${i}`]) all.push({ cat, t, i }) })
    })
    for (const { cat, t, i } of all) {
      await saveThought(cat, t, i)
      await new Promise(r => setTimeout(r, 200))
    }
    setStep('done')
  }

  function removeThought(cat, i) {
    setThoughts(prev => ({ ...prev, [cat]: prev[cat].filter((_, idx) => idx !== i) }))
  }

  function reset() {
    setText(''); setStep('input'); setThoughts(null)
    setSaving({}); setSaved({}); setSaveCount(0); setTotalCount(0); setError(null); setPdfFile(null)
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ borderBottom: '1px solid #1e1e2e', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, #0d0d18 0%, #0a0a0f 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, #6366f1, #312e81)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧠</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', color: '#c4b5fd' }}>OPEN BRAIN</div>
            <div style={{ fontSize: 10, color: '#4a4a6a', letterSpacing: '0.12em' }}>ONBOARDING</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#4a4a6a' }}>{user.email}</span>
          <button onClick={() => { setShowConfig(true); setTestResult(null) }} style={{ background: 'none', border: `1px solid ${config ? '#2a2a4a' : '#5d2020'}`, borderRadius: 4, padding: '5px 12px', color: config ? '#6b6b8a' : '#f87171', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', letterSpacing: '0.06em' }}>{config ? 'Settings' : '⚠ Connect Brain'}</button>
          <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#3a3a5a', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Sign out</button>
        </div>
      </div>

      {showConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 12, padding: '36px 32px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, color: '#e8e4d9' }}>Connect your brain</h2>
            <div style={{ background: '#0d0d18', border: '1px solid #1a1a35', borderRadius: 6, padding: '12px 14px', marginBottom: 24 }}>
              <p style={{ color: '#6b6b8a', fontSize: 12, lineHeight: 1.6 }}>🔒 Your credentials are stored <strong style={{ color: '#a5b4fc' }}>only in your browser</strong> — never sent to our servers.</p>
            </div>
            <form onSubmit={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {CONFIG_FIELDS.map(field => (
                <div key={field.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, color: '#6b6b8a', letterSpacing: '0.08em' }}>{field.label.toUpperCase()}</label>
                    <button type="button" onClick={() => setExpandedHelp(expandedHelp === field.key ? null : field.key)} style={{ background: 'none', border: 'none', color: '#4a4a6a', fontSize: 11, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>{expandedHelp === field.key ? 'Hide ↑' : 'Where is this? ↓'}</button>
                  </div>
                  {expandedHelp === field.key && (
                    <div style={{ background: '#0a0a14', border: '1px solid #1a1a2e', borderRadius: 6, padding: '10px 12px', marginBottom: 8, fontSize: 12, color: '#6b6b8a', lineHeight: 1.6 }}>
                      {field.help}{' '}<a href={field.link} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>{field.linkLabel}</a>
                    </div>
                  )}
                  <input type={field.type} placeholder={field.placeholder} value={configForm[field.key]} onChange={e => setConfigForm(f => ({ ...f, [field.key]: e.target.value }))} required style={{ width: '100%', padding: '11px 14px', background: '#0a0a0f', border: '1px solid #1e1e35', borderRadius: 6, color: '#e8e4d9', fontFamily: 'Georgia, serif', fontSize: 13, outline: 'none' }} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#1e1e35'} />
                </div>
              ))}
              <div>
                <button type="button" onClick={() => testConnection(configForm)} disabled={testing || !configForm.supabaseUrl || !configForm.supabaseAnonKey} style={{ background: 'none', border: '1px solid #2a2a4a', borderRadius: 6, padding: '9px 18px', color: testing ? '#4a4a6a' : '#a5b4fc', fontSize: 12, fontFamily: 'Georgia, serif', cursor: testing ? 'not-allowed' : 'pointer', letterSpacing: '0.06em' }}>{testing ? 'Testing...' : 'Test Connection'}</button>
                {testResult && (<div style={{ marginTop: 10, padding: '10px 12px', background: testResult.ok ? '#0d1a0d' : '#1a0f0f', border: `1px solid ${testResult.ok ? '#1a3a1a' : '#3d1515'}`, borderRadius: 6, fontSize: 12, color: testResult.ok ? '#4ade80' : '#f87171' }}>{testResult.ok ? '✓ ' : '✗ '}{testResult.message}</div>)}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: 14, letterSpacing: '0.06em', cursor: 'pointer' }}>Save & Connect</button>
                {config && (<button type="button" onClick={() => { setShowConfig(false); setTestResult(null) }} style={{ padding: '12px 20px', background: 'none', border: '1px solid #2a2a4a', borderRadius: 6, color: '#6b6b8a', fontFamily: 'Georgia, serif', fontSize: 14, cursor: 'pointer' }}>Cancel</button>)}
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 32px' }}>
        {step === 'input' && (
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 400, marginBottom: 8, background: 'linear-gradient(135deg, #e8e4d9 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Seed your brain.</h1>
            <p style={{ color: '#6b6b8a', fontSize: 15, marginBottom: 36, lineHeight: 1.7 }}>Paste your LinkedIn profile, resume, job description, or any professional bio. Claude will extract structured context and save each insight as a searchable memory.</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (<div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6b8a', letterSpacing: '0.08em' }}><span style={{ color: '#6366f1' }}>{c.icon}</span>{c.label.toUpperCase()}</div>))}
            </div>
            <div style={{ position: 'relative' }}>
              <textarea value={text} onChange={e => { setText(e.target.value); if (pdfFile) setPdfFile(null) }} placeholder="Paste your LinkedIn About section, full profile export, resume text, current job description, or any combination..." style={{ width: '100%', height: 280, background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: 8, color: '#e8e4d9', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.7, padding: '20px', paddingBottom: '52px', resize: 'vertical', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#1e1e35'} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #1a1a2e', background: '#0d0d18', borderRadius: '0 0 8px 8px' }}>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={pdfFile?.status === 'loading'} style={{ background: 'none', border: '1px solid #2a2a4a', borderRadius: 4, padding: '4px 12px', color: '#6b6b8a', fontSize: 11, fontFamily: 'Georgia, serif', cursor: pdfFile?.status === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.04em' }}>
                  <span style={{ fontSize: 13 }}>📎</span>
                  {pdfFile?.status === 'loading' ? 'Reading PDF...' : 'Attach PDF'}
                </button>
                {pdfFile && pdfFile.status !== 'loading' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: pdfFile.status === 'ready' ? '#4ade80' : '#f87171' }}>
                    <span>{pdfFile.status === 'ready' ? '✓' : '✗'}</span>
                    <span style={{ color: '#6b6b8a', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</span>
                    <button onClick={() => { setPdfFile(null); setText('') }} style={{ background: 'none', border: 'none', color: '#3a3a5a', fontSize: 14, cursor: 'pointer', padding: '0 4px' }}>×</button>
                  </div>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2a2a4a' }}>{text.length > 0 ? `${text.length.toLocaleString()} chars` : ''}</span>
              </div>
            </div>
            {error && (
              <div style={{ background: '#1a0f0f', border: '1px solid #3d1515', borderRadius: 6, padding: '12px 16px', color: '#f87171', fontSize: 13, margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span>{error}</span>
                <button onClick={() => { setShowConfig(true); setTestResult(null) }} style={{ background: 'none', border: '1px solid #5d2020', borderRadius: 4, padding: '5px 12px', color: '#f87171', fontSize: 11, cursor: 'pointer', fontFamily: 'Georgia, serif', whiteSpace: 'nowrap' }}>Open Settings</button>
              </div>
            )}
            <button onClick={extractThoughts} disabled={!text.trim() || !config} style={{ marginTop: 16, background: text.trim() && config ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#1a1a2e', color: text.trim() && config ? '#fff' : '#3a3a5a', border: 'none', borderRadius: 6, padding: '14px 32px', fontSize: 14, fontFamily: 'Georgia, serif', letterSpacing: '0.06em', cursor: text.trim() && config ? 'pointer' : 'not-allowed' }}>{!config ? 'Connect your brain first →' : 'Extract & Review →'}</button>
          </div>
        )}

        {step === 'extracting' && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 24px' }} />
            <div style={{ fontSize: 18, color: '#c4b5fd', marginBottom: 8 }}>Extracting context...</div>
            <div style={{ fontSize: 13, color: '#4a4a6a' }}>Claude is reading your background and identifying key memories</div>
          </div>
        )}

        {['review', 'saving', 'done'].includes(step) && thoughts && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 6 }}>{step === 'done' ? 'Brain seeded ✓' : 'Review extracted memories'}</h2>
                <p style={{ color: '#6b6b8a', fontSize: 13 }}>{step === 'done' ? `${saveCount} memories saved to your brain` : `${totalCount} memories extracted — remove any that aren't useful, then save all`}</p>
              </div>
              {step === 'review' && (<button onClick={saveAll} style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 13, fontFamily: 'Georgia, serif', letterSpacing: '0.06em', cursor: 'pointer' }}>Save All to Brain →</button>)}
              {step === 'saving' && (<div style={{ fontSize: 13, color: '#6366f1' }}>Saving {saveCount} / {totalCount}...</div>)}
            </div>
            {CATEGORIES.map(cat => {
              const items = thoughts[cat.id] || []
              if (!items.length) return null
              return (
                <div key={cat.id} style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #1a1a2a' }}>
                    <span style={{ color: '#6366f1', fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6b6b8a', textTransform: 'uppercase' }}>{cat.label}</span>
                    <span style={{ fontSize: 11, color: '#3a3a5a', marginLeft: 'auto' }}>{items.filter((_, i) => saved[`${cat.id}-${i}`]).length}/{items.length} saved</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((thought, i) => {
                      const key = `${cat.id}-${i}`
                      const isSaved = saved[key]
                      const isSaving = saving[key]
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: isSaved ? '#0d1a0d' : '#0f0f1a', border: `1px solid ${isSaved ? '#1a3a1a' : '#1a1a2e'}`, borderRadius: 6, transition: 'all 0.3s' }}>
                          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.6, color: isSaved ? '#6b8a6b' : '#c8c4bc' }}>{thought}</div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {isSaved ? <span style={{ fontSize: 16, color: '#4ade80' }}>✓</span>
                              : isSaving ? <span style={{ fontSize: 12, color: '#6366f1' }}>...</span>
                              : step === 'review' ? (<>
                                <button onClick={() => saveThought(cat.id, thought, i)} style={{ background: 'none', border: '1px solid #2a2a4a', borderRadius: 4, padding: '4px 10px', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Save</button>
                                <button onClick={() => removeThought(cat.id, i)} style={{ background: 'none', border: 'none', color: '#3a3a5a', fontSize: 14, cursor: 'pointer', padding: '4px 6px' }}>×</button>
                              </>) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {step === 'done' && (
              <div style={{ marginTop: 32, padding: '24px', background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>🧠</div>
                <div style={{ fontSize: 16, color: '#4ade80', marginBottom: 6 }}>Brain seeded successfully</div>
                <div style={{ fontSize: 13, color: '#4a6a4a', marginBottom: 20 }}>{saveCount} memories are now embedded and searchable from any connected AI tool</div>
                <button onClick={reset} style={{ background: 'none', border: '1px solid #2a4a2a', borderRadius: 6, padding: '10px 24px', color: '#4ade80', fontSize: 13, fontFamily: 'Georgia, serif', letterSpacing: '0.06em', cursor: 'pointer' }}>+ Add More Context</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
