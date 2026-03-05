'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
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
      else setSuccess('Account created! You can now sign in.')
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
      background: 'radial-gradient(ellipse at 50% 0%, #0f1d32 0%, #060b18 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        input::placeholder { color: #4a5568; }
        input:focus { outline: none; border-color: rgba(22, 160, 167, 0.5) !important; box-shadow: 0 0 0 3px rgba(22, 160, 167, 0.1) !important; }
        .login-card { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .btn-primary { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(22, 160, 167, 0.3); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .toggle-link { color: #16a0a7; cursor: pointer; text-decoration: none; background: none; border: none; font: inherit; font-weight: 500; transition: color 0.2s; }
        .toggle-link:hover { color: #2dd4bf; text-decoration: underline; }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(22, 160, 167, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(22, 160, 167, 0.03) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
      `}</style>

      {/* Background effects */}
      <div className="grid-bg" />
      <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(22, 160, 167, 0.06)', top: '-10%', left: '20%' }} />
      <div className="glow-orb" style={{ width: 300, height: 300, background: 'rgba(26, 58, 92, 0.08)', bottom: '10%', right: '15%' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            width: 88, height: 88,
            margin: '0 auto 24px',
            animation: 'float 6s ease-in-out infinite',
          }}>
            <img
              src="/logo.png"
              alt="BrainDump"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div style={{
              display: 'none',
              width: 88, height: 88,
              background: 'linear-gradient(135deg, rgba(22, 160, 167, 0.15), rgba(26, 58, 92, 0.2))',
              borderRadius: 24,
              alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(22, 160, 167, 0.2)',
              backdropFilter: 'blur(10px)',
            }}>
              <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
                <path d="M50 10 L80 30 L80 50 Q80 75 50 88 Q20 75 20 50 L20 30 Z" fill="#16a0a7" opacity="0.2" />
                <path d="M50 18 L74 34 L74 50 Q74 70 50 82 Q26 70 26 50 L26 34 Z" fill="none" stroke="#16a0a7" strokeWidth="2.5" />
                <path d="M38 50 L46 58 L62 42" stroke="#2dd4bf" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="10" r="4" fill="#16a0a7" />
              </svg>
            </div>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 38,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}>
            <span style={{ color: '#e8edf5' }}>Brain</span>
            <span style={{ color: '#16a0a7' }}>Dump</span>
          </h1>
          <p style={{ color: '#4a5568', fontSize: 13, fontWeight: 500, letterSpacing: '0.12em' }}>COLLECT & STORE KNOWLEDGE</p>
        </div>

        {/* Card */}
        <div className="login-card" style={{
          background: 'rgba(12, 18, 34, 0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24,
          padding: '40px 36px',
          border: '1px solid rgba(22, 160, 167, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#e8edf5',
            marginBottom: 4,
          }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
            {mode === 'login' ? 'Sign in to your brain.' : 'Set up your personal knowledge store.'}
          </p>

          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 12, padding: '12px 16px',
              color: '#22c55e', fontSize: 13, marginBottom: 20,
            }}>{success}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>EMAIL</label>
              <input
                type="email" required
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#0a1020',
                  border: '1.5px solid rgba(22, 160, 167, 0.12)',
                  borderRadius: 12, color: '#e8edf5', fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.3s',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>PASSWORD</label>
              <input
                type="password" required
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#0a1020',
                  border: '1.5px solid rgba(22, 160, 167, 0.12)',
                  borderRadius: 12, color: '#e8edf5', fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.3s',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 12, padding: '12px 16px',
                color: '#ef4444', fontSize: 13,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%', padding: '15px',
                marginTop: 4,
                background: loading
                  ? 'rgba(22, 160, 167, 0.3)'
                  : 'linear-gradient(135deg, #16a0a7 0%, #0d7a80 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(22, 160, 167, 0.2)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 24 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="toggle-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#2d3748', marginTop: 28 }}>
          Your data goes to your own n8n webhook. We never store it.
        </p>
      </div>
    </div>
  )
}
