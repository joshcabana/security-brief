import ToolsMatrix from '@/components/ToolsMatrix';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Security Matrix Q2 2026 | AI Threat Brief',
  description: 'Comprehensive analysis and matrix of the top AI security vendors for Q2 2026. Review LLM Firewalls, SAST, DAST, and more.'
};

export default function MatrixReportPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cover & Executive Summary */}
        <header className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wide">
              Quarterly Report
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Q2 2026</span>
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
            The AI Security Matrix
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            A rapidly shifting threat landscape demands new defensive primitives. We evaluated 40+ vendors across LLM Firewalls, DSPM, and Adversarial ML to find the signal in the noise.
          </p>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl"></div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-16">
          <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
          <p className="mb-4">
            The Q2 2026 cycle has been defined by the commoditization of <strong>Prompt Injection</strong>.
            What was once an academic exercise is now available as Point-and-Click exploit payloads in underground forums.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>The Core Problem:</strong> LLMs cannot fundamentally distinguish between system instructions and untrusted user input within the same context window.</li>
            <li><strong>The Industry Pivot:</strong> Security budgets are shifting from experimental &quot;AI-SPM&quot; point solutions toward integrated platform capabilities.</li>
            <li><strong>Open Source Momentum:</strong> Projects like Garak and Rebuff are setting the standard for baseline red-teaming.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">Market Dynamics</h2>
          <p className="mb-4">
            The traditional boundaries of AppSec are breaking down. Threat modeling an LLM agent requires understanding data provenance, vector DB access controls, and prompt-binding risks.
          </p>
        </div>
      </div>

      {/* The Tools Matrix Component */}
      <ToolsMatrix />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-slate-900 dark:text-white">Vendor Deep-Dives</h2>
          <p className="text-center text-lg text-slate-600 dark:text-slate-400 mb-12">
            What makes each vendor unique. Brief breakdowns to help your team shortlist vendors based on your threat model and deployment requirements.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lakera</h3>
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded">LLM Firewall</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                Lakera&#39;s Guard sits as an API gateway in front of any LLM. It inspects every prompt and completion for injection patterns, PII leakage, and harmful content in real-time. The free tier makes it the lowest-friction entry point for teams shipping their first LLM feature.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Free tier available</span>
                <a href="https://lakera.ai" className="text-cyan-600 font-semibold hover:underline">lakera.ai &rarr;</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">HiddenLayer</h3>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded">Enterprise</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                HiddenLayer&#39;s MLDR platform monitors deployed models for adversarial manipulation, model theft via side channels, and supply chain compromise. Think of it as EDR for your ML models. Best suited for organisations running ML inference at scale.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Enterprise pricing</span>
                <a href="https://hiddenlayer.com" className="text-cyan-600 font-semibold hover:underline">hiddenlayer.com &rarr;</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Protect AI</h3>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded">AI-SPM</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                Protect AI scans your entire ML pipeline — from training data to model artifacts to deployment configs — for vulnerabilities. Their Guardian product catches poisoned models, unsafe serialisation, and misconfigured access controls.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Enterprise pricing</span>
                <a href="https://protectai.com" className="text-cyan-600 font-semibold hover:underline">protectai.com &rarr;</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Prompt Security</h3>
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded">GenAI Governance</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                The governance layer for enterprise GenAI adoption. Gives CISOs visibility into which LLMs employees are using and ensures interactions comply with corporate policy, directly addressing the &quot;shadow AI&quot; problem.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Enterprise pricing</span>
                <a href="https://prompt.security" className="text-cyan-600 font-semibold hover:underline">prompt.security &rarr;</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rebuff</h3>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">Open Source</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                An open-source framework for detecting prompt injection using heuristic analysis, LLM-based classification, and vector similarity matching. Ideal for teams who want to build prompt defence into their stack without vendor lock-in.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Free (Apache 2.0)</span>
                <a href="https://github.com/protectai/rebuff" className="text-cyan-600 font-semibold hover:underline">GitHub &rarr;</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Garak (NVIDIA)</h3>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">Open Source</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                The &quot;nmap for LLMs.&quot; NVIDIA&#39;s Garak probes language models for hallucination vulnerabilities, prompt injection susceptibility, and jailbreak vectors. Essential for red teams assessing LLM deployments.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Free (Apache 2.0)</span>
                <a href="https://github.com/NVIDIA/garak" className="text-cyan-600 font-semibold hover:underline">GitHub &rarr;</a>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Stay Ahead of AI Threats</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              AI Threat Brief delivers weekly intelligence on AI-powered threats, defensive tooling, and privacy regulation changes — written for AppSec engineers and CISOs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto mb-12">
            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">📡 Weekly Briefings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 h-16">Zero-day analysis, CVE breakdowns, and attack path research delivered every Monday.</p>
              <a href="https://aithreatbrief.com/newsletter" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">Subscribe free &rarr;</a>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">📊 Sponsored Placements</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 h-16">Reach verified CISOs and AppSec engineers. Featured sponsor slots available.</p>
              <a href="mailto:sponsor@aithreatbrief.com" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">sponsor@aithreatbrief.com &rarr;</a>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-xl">
              <h3 className="font-bold text-lg mb-2">📰 Read the Blog</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 h-16">Technical analysis of emerging attack vectors and exploitation chains.</p>
              <a href="https://aithreatbrief.com/blog" className="text-sm font-bold text-cyan-600 hover:text-cyan-700">Read articles &rarr;</a>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center max-w-3xl mx-auto leading-relaxed">
            This report is published by AI Threat Brief. The information is provided for educational and informational purposes only. Vendor evaluations are based on publicly available information. AI Threat Brief has no commercial relationship with any vendor listed in this report unless explicitly disclosed. All trademarks belong to their respective owners. <br/>&copy; 2026 AI Threat Brief.
          </p>
        </div>
      </div>
    </div>
  );
}
