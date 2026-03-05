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
      background: 'linear-gradient(135deg, #f0fafa 0%, #e8f4f8 100%)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center', color: '#5a8a9a' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #d4ecf0',
          borderTopColor: '#16a0a7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Signing you in...</p>
      </div>
    </div>
  )
}
