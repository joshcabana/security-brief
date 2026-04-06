import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';

export default function ToolsMatrix() {
  const tools = [
    // LLM Firewalls & MLSecOps
    { id: 'lakera', abbr: 'LG', name: 'Lakera Guard', category: 'LLM Firewall', strength: 'Prompt Inj. Blocking', pricing: 'Enterprise', hasProDiscount: true, link: '/go/lakera' },
    { id: 'protectai', abbr: 'PAI', name: 'ProtectAI Radar', category: 'SAST / DAST', strength: 'MLSecOps Scanning', pricing: 'Free Tier', hasProDiscount: false, link: '/go/protectai' },
    
    // Identity & Auth
    { id: '1password', abbr: '1P', name: '1Password for Business', category: 'Identity & Auth', strength: 'Zero-knowledge', pricing: 'Enterprise', hasProDiscount: true, link: '/go/1password' },
    { id: 'auth0', abbr: 'A0', name: 'Auth0 / Okta', category: 'Identity & Auth', strength: 'CIAM & Workforce', pricing: 'Enterprise', hasProDiscount: false, link: '/go/auth0' },
    
    // Endpoint & Cloud Security
    { id: 'wiz', abbr: 'WIZ', name: 'Wiz', category: 'Cloud Security', strength: 'Agentless CSPM', pricing: 'Enterprise', hasProDiscount: false, link: '/go/wiz' },
    { id: 'crowdstrike', abbr: 'CS', name: 'CrowdStrike', category: 'Endpoint & XDR', strength: 'NGAV + EDR', pricing: 'Enterprise', hasProDiscount: false, link: '/go/crowdstrike' },
    
    // Compliance
    { id: 'vanta', abbr: 'VAN', name: 'Vanta', category: 'Compliance', strength: 'SOC2/ISO27001 Auto', pricing: 'Enterprise', hasProDiscount: true, link: '/go/vanta' },
    { id: 'drata', abbr: 'DR', name: 'Drata', category: 'Compliance', strength: 'Continuous Audit', pricing: 'Enterprise', hasProDiscount: true, link: '/go/drata' },
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">AI Security Stack Matrix</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              A continually updated directory of vetted agentic AI security tools, red team scanners, and privacy frameworks. <br/>
              <span className="text-sm border-b border-dashed border-slate-400 cursor-help" title="We may earn a commission if you purchase through these links.">Transparency disclosure</span>
            </p>
          </div>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-md border border-cyan-600 dark:border-[#00b4ff] bg-transparent px-6 py-2.5 text-sm font-bold text-cyan-700 dark:text-[#00b4ff] transition-all duration-200 hover:bg-cyan-50 dark:hover:bg-[#00b4ff14] hover:shadow-[0_0_20px_rgba(0,180,255,0.2)]"
          >
            Browse all tools
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
            </svg>
          </Link>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-8">
          {['All categories', 'SAST / DAST', 'Cloud Security', 'LLM Firewalls', 'Identity & Auth', 'Endpoint & XDR', 'Compliance'].map((tag, i) => (
            <button key={tag} className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ${i === 0 ? 'bg-cyan-600 text-white border-cyan-600' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-cyan-500 dark:hover:border-cyan-500'}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Matrix Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 table-auto md:table-fixed text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/80 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">Tool Name</th>
                  <th className="px-6 py-4 font-bold hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 font-bold hidden lg:table-cell">Strengths</th>
                  <th className="px-6 py-4 font-bold">Pricing</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <td className="px-6 py-5 sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-900/10 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800">{tool.abbr}</div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                            {tool.name}
                            {tool.hasProDiscount && (
                              <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                                <Tag size={10} /> Pro Discount
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 md:hidden mt-1">{tool.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300 hidden md:table-cell font-medium">{tool.category}</td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      <span className="inline-block bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800/50">{tool.strength}</span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-medium">{tool.pricing}</td>
                    <td className="px-6 py-5 text-right">
                      <a href={tool.link} target="_blank" rel="noopener noreferrer sponsored nofollow" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-slate-300 dark:border-slate-700 hover:border-cyan-600 hover:text-cyan-600 dark:hover:border-cyan-400 dark:hover:text-cyan-400 font-semibold transition-colors bg-white dark:bg-transparent">
                        View Vendor
                        <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Affiliate links support our independent threat research. Tools marked <strong className="text-amber-600 dark:text-amber-400">Pro Discount</strong> include exclusive pricing for Pro members.{' '}
            <Link href="/pro" className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">Upgrade to Pro →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
