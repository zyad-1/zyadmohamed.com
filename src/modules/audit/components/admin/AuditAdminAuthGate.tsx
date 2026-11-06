'use client'

import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import '../../theme/tokens.css'
import { apxFontVariables } from '../../theme/fonts'
import ApxMark from '../brand/ApxMark'

export function AuditAdminAuthGate({
  initialAuthenticated,
  children,
}: {
  initialAuthenticated: boolean
  children: React.ReactNode
}) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authenticated) {
    return <>{children}</>
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Invalid admin password')
      } else {
        setAuthenticated(true)
        window.location.reload()
      }
    } catch {
      setError('Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="ltr"
      className={`apx-audit ${apxFontVariables} min-h-screen bg-[#080608] text-[#E2D9F3] flex items-center justify-center p-4`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#100C14] border border-[#E2D9F3]/10 p-7 space-y-5">
        <div className="flex items-center gap-3">
          <ApxMark size={30} />
          <div>
            <h1 className="text-sm font-bold text-[#E2D9F3]">APX Audit Engine</h1>
            <p className="text-xs text-[#E2D9F3]/55">Admin Authentication Required</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#E2D9F3]/70 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#E2D9F3]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter APX admin password..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#17111D] border border-[#E2D9F3]/15 text-[#E2D9F3] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          {error && <p className="text-[#C95D63] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold transition-colors"
          >
            {loading ? 'Verifying...' : 'Sign In to Audit Engine →'}
          </button>
        </form>
      </div>
    </div>
  )
}
