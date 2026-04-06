import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { Shield, Search, Lock } from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/methodology',
  title: 'Research Methodology & Editorial Independence | AI Security Brief',
  description: 'How we evaluate MLSecOps tooling, define threat severity, and maintain strict editorial independence from vendors.',
});

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d14] pt-24 pb-24">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Research Methodology
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We are practitioners, not analysts. Our tooling recommendations and threat evaluations are based on production constraints, not marketing sheets.
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Search className="text-emerald-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How We Evaluate Tools</h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                The AI Security Stack Matrix is built over hundreds of hours of hands-on testing, red-teaming, and architectural review. To be included, a tool must solve a tangible problem in the MLSecOps lifecycle.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-sm font-medium">
                <li><strong className="text-slate-900 dark:text-slate-200">Deployment Friction:</strong> Does it require a highly-invasive kernel agent, or does it utilize modern eBPF/sidecar patterns?</li>
                <li><strong className="text-slate-900 dark:text-slate-200">False Positives:</strong> In prompt-injection filtering, what is the impact on legitimate LLM operations?</li>
                <li><strong className="text-slate-900 dark:text-slate-200">Architecture:</strong> Can the solution run air-gapped on-premise, or does it enforce a SaaS-only model transmitting PII to vendor APIs?</li>
              </ul>
            </div>
          </section>

          <section className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="text-amber-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Affiliate Transparency</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              AI Security Brief operates completely independent of vendor influence. We do not accept &quot;pay-to-play&quot; placements in our Matrix, and we do not do sponsored &quot;guest posts&quot; written by PR agencies.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To fund the significant infrastructure and research time required to run the intelligence feed, we use affiliate links. When you purchase a tool through a link in our Matrix, we may receive a commission. 
              <strong> Crucially, this does not affect rankings.</strong> If a vendor&apos;s product deteriorates, it will be downgraded or removed, regardless of affiliate status.
            </p>
          </section>

          <section className="bg-white dark:bg-[#0d131f] border border-cyan-500/20 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Lock className="text-cyan-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pro Subscriber Promise</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Our Pro tier completely strips all affiliate and sponsorship noise from the briefings. When you pay for intelligence, you are paying for an uncompromised raw signal. Pro members receive neutral architectural reviews stripped of all tracking parameters.
            </p>
            <div className="flex justify-center mt-6">
              <a href="/upgrade" className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white font-bold transition-all text-sm flex items-center gap-2">
                Learn about Pro Intelligence
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
