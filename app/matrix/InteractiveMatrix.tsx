'use client';

/**
 * InteractiveMatrix
 * Client component with search, category filter, sort, and Pro-gated CSV export.
 * Renders a responsive card grid with tool details.
 */

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Download, Lock, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface Tool {
  id: string;
  name: string;
  category: string;
  strength: string;
  pricing: string;
  tier: 'free' | 'pro';
  score: number;
}

interface InteractiveMatrixProps {
  tools: Tool[];
  categories: string[];
}

type SortKey = 'name' | 'category' | 'score';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4.7
      ? 'text-emerald-400 border-emerald-800/50'
      : score >= 4.3
        ? 'text-cyan-400 border-cyan-800/50'
        : 'text-amber-400 border-amber-800/50';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-slate-800/50 text-xs font-mono font-bold ${color}`}
    >
      <Star size={10} className="fill-current" />
      {score.toFixed(1)}
    </span>
  );
}

export default function InteractiveMatrix({
  tools,
  categories,
}: InteractiveMatrixProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = tools;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.strength.toLowerCase().includes(q),
      );
    }

    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'category') cmp = a.category.localeCompare(b.category);
      else cmp = a.score - b.score;
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [tools, search, activeCategory, sortBy, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'name');
    }
  };

  return (
    <div>
      {/* Search + Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            id="matrix-search"
            placeholder="Search tools, categories, capabilities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Sort buttons */}
          {([
            ['score', 'Rating'],
            ['name', 'A–Z'],
            ['category', 'Category'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`px-3 py-2 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
                sortBy === key
                  ? 'border-cyan-600 text-cyan-400 bg-cyan-950/30'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <SlidersHorizontal size={12} />
              {label}
              {sortBy === key && (
                <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>
              )}
            </button>
          ))}

          {/* Pro-gated export */}
          <button
            id="matrix-export-csv"
            className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-800 text-slate-600 flex items-center gap-1.5 cursor-not-allowed opacity-60"
            title="Pro members can export the full matrix as CSV/PDF"
            disabled
          >
            <Lock size={10} />
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            !activeCategory
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-700/50'
              : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
          }`}
        >
          All ({tools.length})
        </button>
        {categories.map((cat) => {
          const count = tools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-700/50'
                  : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-600 mb-4">
        Showing {filtered.length} of {tools.length} tools
        {search.trim() && <> matching &ldquo;{search.trim()}&rdquo;</>}
        {activeCategory && <> in {activeCategory}</>}
      </p>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <div
            key={tool.id}
            className="group rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 p-5 transition-all flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {tool.name}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {tool.category}
                </span>
              </div>
              <ScoreBadge score={tool.score} />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed flex-1">
              {tool.strength}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-600 font-mono">
                {tool.pricing}
              </span>
              {tool.tier === 'pro' ? (
                <span className="text-[10px] font-mono font-bold text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  PRO
                </span>
              ) : (
                <Link
                  href={`/tools#${tool.id}`}
                  className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                >
                  Details <ExternalLink size={10} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-500">
            No tools match your search. Try a different keyword or category.
          </p>
        </div>
      )}

      {/* Pro upsell */}
      <div className="mt-12 rounded-xl border border-slate-800 bg-gradient-to-br from-cyan-950/20 to-slate-900 p-8 text-center">
        <h3 className="text-lg font-bold text-white mb-2">
          Need the full matrix with export?
        </h3>
        <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
          Pro members get advanced filters, CSV/PDF export, tool comparison
          mode, and early access to new tool additions.
        </p>
        <Link
          href="/pricing"
          id="matrix-pro-cta"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-glow-sm"
        >
          Unlock Pro — $39/mo
        </Link>
      </div>
    </div>
  );
}
