'use client'
import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(ellipse at 50% 0%, #12103a 0%, #0a0a0f 60%)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #6366f1, #312e81)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 16px',
        }}>🧠</div>
        <h1 style={{
          fontSize: 28, fontWeight: 400, letterSpacing: '-0.01em',
          background: 'linear-gradient(135deg, #e8e4d9, #a5b4fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>Open Brain</h1>
        <p style={{ color: '#4a4a6a', fontSize: 14, letterSpacing: '0.08em' }}>
          PERSONAL AI MEMORY SYSTEM
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#0f0f1a',
        border: '1px solid #1e1e35',
        borderRadius: 12,
        padding: '36px 32px',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8, color: '#c4b5fd' }}>
              Check your email
            </h2>
            <p style={{ color: '#6b6b8a', fontSize: 14, lineHeight: 1.6 }}>
              We sent a magic link to <strong style={{ color: '#e8e4d9' }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, color: '#e8e4d9' }}>
              Sign in
            </h2>
            <p style={{ color: '#6b6b8a', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email to receive a magic link. First time? An account will be created automatically.
            </p>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  background: '#0a0a0f', border: '1px solid #1e1e35',
                  borderRadius: 6, color: '#e8e4d9',
                  fontFamily: 'Georgia, serif', fontSize: 14,
                  outline: 'none', marginBottom: 12,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#1e1e35'}
              />

              {error && (
                <div style={{
                  background: '#1a0f0f', border: '1px solid #3d1515',
                  borderRadius: 6, padding: '10px 14px',
                  color: '#f87171', fontSize: 12, marginBottom: 12,
                }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '13px',
                  background: email && !loading
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : '#1a1a2e',
                  color: email && !loading ? '#fff' : '#3a3a5a',
                  border: 'none', borderRadius: 6,
                  fontFamily: 'Georgia, serif', fontSize: 14,
                  letterSpacing: '0.06em', cursor: email && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link →'}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ marginTop: 32, color: '#2a2a4a', fontSize: 12, textAlign: 'center', maxWidth: 320 }}>
        Your data is stored in your own Supabase project. We never see or store your brain's contents.
      </p>
    </div>
  )
}
