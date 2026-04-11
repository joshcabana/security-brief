'use client'

import { useState } from 'react'

export default function ReferralWidget({ link, count }: { link: string; count: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/20 to-slate-900 border border-cyan-900/50">
      <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Referrals</div>
      <div className="text-4xl font-black text-white">{count}</div>
      <div className="mt-2 text-xs text-slate-400">You and your referral both get 1 month of Pro.</div>
      <div className="mt-3 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 relative">
        <code className="text-xs text-cyan-400 flex-1 truncate">{link}</code>
        <button 
          onClick={handleCopy}
          className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors" 
          title="Copy to clipboard"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
