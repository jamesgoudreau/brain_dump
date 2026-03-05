'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` }
      })
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/onboard'
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fafa 0%, #e8f4f8 40%, #f5fbf5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #9bb8c2; }
        input:focus { outline: none; }
        .btn-primary { transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(22, 160, 167, 0.35); }
        .card { animation: fadeUp 0.5s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .toggle-link { color: #16a0a7; cursor: pointer; text-decoration: underline; background: none; border: none; font: inherit; }
        .toggle-link:hover { color: #0d7a80; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72,
            background: 'white',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 20px rgba(22, 160, 167, 0.15)',
          }}>
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <path d="M50 10 L80 30 L80 50 Q80 75 50 88 Q20 75 20 50 L20 30 Z" fill="#16a0a7" opacity="0.15"/>
              <path d="M50 18 L74 34 L74 50 Q74 70 50 82 Q26 70 26 50 L26 34 Z" fill="none" stroke="#16a0a7" strokeWidth="2.5"/>
              <path d="M38 50 L46 58 L62 42" stroke="#1a3a5c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="50" cy="10" r="4" fill="#16a0a7"/>
              <circle cx="80" cy="30" r="3" fill="#1a3a5c" opacity="0.4"/>
              <circle cx="20" cy="30" r="3" fill="#1a3a5c" opacity="0.4"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 32, fontWeight: 800,
            color: '#1a3a5c',
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}>BrainDump</h1>
          <p style={{ color: '#5a8a9a', fontSize: 14, fontWeight: 400 }}>Collect & store knowledge</p>
        </div>

        {/* Card */}
        <div className="card" style={{
          background: 'white',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 4px 32px rgba(26, 58, 92, 0.08), 0 1px 4px rgba(26, 58, 92, 0.04)',
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20, fontWeight: 700,
            color: '#1a3a5c',
            marginBottom: 4,
          }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ color: '#7a9aaa', fontSize: 13, marginBottom: 28 }}>
            {mode === 'login' ? 'Sign in to your brain.' : 'Set up your personal knowledge store.'}
          </p>

          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '12px 16px',
              color: '#166534', fontSize: 13, marginBottom: 20
            }}>{success}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a8a9a', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>EMAIL</label>
              <input
                type="email" required
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#f7fbfc', border: '1.5px solid #d4ecf0',
                  borderRadius: 10, color: '#1a3a5c', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#16a0a7'}
                onBlur={e => e.target.style.borderColor = '#d4ecf0'}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a8a9a', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <input
                type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#f7fbfc', border: '1.5px solid #d4ecf0',
                  borderRadius: 10, color: '#1a3a5c', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#16a0a7'}
                onBlur={e => e.target.style.borderColor = '#d4ecf0'}
              />
            </div>

            {error && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px',
                color: '#dc2626', fontSize: 13,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#a8d8db' : 'linear-gradient(135deg, #16a0a7, #1a3a5c)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#7a9aaa', marginTop: 20 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="toggle-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9bb8c2', marginTop: 24 }}>
          Your data goes to your own n8n webhook. We never store it.
        </p>
      </div>
    </div>
  )
}
