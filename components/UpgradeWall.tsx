import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function UpgradeWall({ children, type = 'content' }: { children: React.ReactNode, type?: 'content' | 'matrix' | 'pdf' }) {
  const supabase = await createClient()

  // Retrieve session and profile
  const { data: { user } } = await supabase.auth.getUser()
  
  let isPro = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('subscription_status, subscription_tier').eq('id', user.id).single()
    isPro = profile?.subscription_status === 'active' && 
            (profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly')
  }

  if (isPro) {
    return <>{children}</>
  }

  // Not Pro - Show the Paywall
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 p-8 text-center shadow-[0_0_30px_rgba(34,211,238,0.1)] my-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.1)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-2xl font-black text-white mb-2">
          {type === 'matrix' ? 'Advanced Matrix Access Required' : 
           type === 'pdf' ? 'Pro-Only PDF Download' : 'Unlock the Full Intelligence Briefing'}
        </h3>
        <p className="text-slate-400 max-w-lg mx-auto mb-6">
          This intelligence is restricted to active Pro members. Upgrade to access {type === 'matrix' ? 'interactive filtering and CSV exports' : 'full exploitation mechanics, remediation playbooks, and PDF downloads'}.
        </p>
        <Link 
          href="/pricing"
          className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-900 transition-all duration-200"
        >
          Upgrade to Pro
        </Link>
        <div className="mt-4 text-xs tracking-wider text-slate-500">
          Already a member? <Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in →</Link>
        </div>
      </div>
    </div>
  )
}
