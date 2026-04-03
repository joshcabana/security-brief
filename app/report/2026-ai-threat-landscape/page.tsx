import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CLASSIFIED: 2026 Agentic AI Threat Baseline',
  description: 'The definitive breakdown of Agentic AI threat vectors for enterprise security teams.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 font-sans">
      <div className="mb-12 border-b border-rose-500/30 pb-8">
        <p className="text-rose-500 font-bold tracking-widest text-sm uppercase mb-2">Classified Briefing // For Security Leaders</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mb-6">
          The 2026 Agentic AI Threat Baseline
        </h1>
        <div className="flex gap-4 text-sm text-slate-400 font-mono">
          <p>Prepared By: Dark Cyber Intelligence</p>
          <p className="text-slate-600">|</p>
          <p>Status: FINAL // DISTRIBUTION AUTHORIZED</p>
        </div>
      </div>

      <div className="prose prose-invert prose-slate prose-a:text-cyan-500 max-w-none">
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-10">
          <h2 className="text-2xl font-bold text-slate-100 mt-0 mb-4">Executive Summary</h2>
          <p className="text-slate-300 m-0">
          The security perimeter has structurally changed. We are no longer defending against static scripts, brute force, or isolated human adversaries. The release of autonomous &quot;Agentic AI&quot;&mdash;models capable of recursive reasoning, executing code, and navigating complex networks independently&mdash;has shifted the offensive landscape from &quot;tool-assisted&quot; to &quot;autonomous.&quot;
          </p>
          <p className="text-slate-300 mt-4 mb-0">
            This report outlines the <strong>three primary threat vectors</strong> specific to Agentic AI and exactly how modern security teams are re-architecting their defenses to mitigate them. If your WAF and EDR are configured for 2024, your environment is highly vulnerable to autonomous traversal today.
          </p>
        </div>

        {/* --- PAYWALL START --- */}
        <div className="relative">
          {/* Blurred / Locked Content */}
          <div className="select-none blur-sm opacity-40 pointer-events-none" aria-hidden="true">
            <h2 className="text-2xl font-bold text-cyan-400 border-l-4 border-cyan-500 pl-4">Threat Vector 1: Autonomous Prompt Injection (Zero-Click Traversal)</h2>
            <div className="my-6 text-sm bg-slate-900/50 p-4 rounded border border-slate-800">
              <p><strong>The Old Way:</strong> A human attacker types a malicious prompt into a chatbot window.</p>
              <p><strong>The Agentic Way:</strong> An autonomous agent scours your public-facing APIs, support channels, and ingested emails...</p>
            </div>
            
            <h3>The Mechanism</h3>
            <p>Agentic AI relies on Retrieval-Augmented Generation (RAG) and tool-use. When an adversarial payload is placed in a document that your internal AI agent later reads...</p>

            <h3>The Mitigation Protocol</h3>
            <ol>
              <li><strong>Semantic Firewalls:</strong> Deploy strict input and output sanitization specific to LLM patterns...</li>
              <li><strong>Data-Store Isolation:</strong> The data your LLM reads must be segregated...</li>
            </ol>
            
            <hr className="border-slate-800 my-12" />
            <h2 className="text-2xl font-bold text-cyan-400 border-l-4 border-cyan-500 pl-4">Threat Vector 2: Multi-Step Logic Exploits</h2>
            <p>...</p>
          </div>

          {/* Paywall Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-10">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 max-w-lg mx-auto text-center shadow-[0_0_50px_rgba(34,211,238,0.1)]">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 text-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Unlock the Full Report</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                The rest of this classified briefing is restricted to Pro members. Get the full $49 report for free when you upgrade to Pro.
              </p>
              
              <div className="flex flex-col gap-4">
                <Link href="/upgrade" className="w-full px-6 py-4 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                  Upgrade to Pro ($9/mo)
                </Link>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-700"></div>
                  <span className="flex-shrink-0 text-xs text-slate-500 px-4 font-mono uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-700"></div>
                </div>
                <Link href="/upgrade?product=report-2026" className="w-full px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition-all flex items-center justify-center">
                  Buy Report Only ($49.00)
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-500 font-mono">Instant digital access. Secure checkout.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
