'use client'
import { useEffect } from 'react'
import { createClient } from '../../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(() => {
      window.location.href = '/onboard'
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, #0f1d32 0%, #060b18 70%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{
          width: 44, height: 44,
          border: '2.5px solid rgba(22, 160, 167, 0.15)',
          borderTopColor: '#16a0a7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 20px',
        }} />
        <p style={{ fontSize: 14, fontWeight: 500 }}>
          Signing you in<span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block' }}>...</span>
        </p>
      </div>
    </div>
  )
}
