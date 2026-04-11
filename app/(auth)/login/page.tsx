'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import ShieldLogo from '@/components/ShieldLogo'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError(false)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(true)
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <ShieldLogo width={40} height={48} className="drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Member Login
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your email to receive a secure sign-in link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-md placeholder-slate-500 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded border ${error ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
