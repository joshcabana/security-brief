'use client';

/**
 * ArticleTOC
 * Floating sidebar table of contents that:
 * - Parses the article's contentHtml for h2/h3 headings
 * - Highlights the active section on scroll
 * - Adds smooth-scroll links with reading progress
 */

import { useState, useEffect, useRef } from 'react';
import { List } from 'lucide-react';

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

function parseHeadings(html: string): TocEntry[] {
  if (typeof document === 'undefined') return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const headings = div.querySelectorAll('h2, h3');
  return Array.from(headings).map((el, i) => {
    const level = parseInt(el.tagName[1], 10) as 2 | 3;
    const text = el.textContent?.trim() ?? `Section ${i + 1}`;
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    return { id, text, level };
  });
}

interface ArticleTOCProps {
  /** Raw HTML string — headings are parsed from it */
  contentHtml: string;
}

export default function ArticleTOC({ contentHtml }: ArticleTOCProps) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Parse headings + inject IDs into real DOM on mount
  useEffect(() => {
    const parsed = parseHeadings(contentHtml);
    setEntries(parsed);

    // Inject IDs into the article heading elements so scroll works
    const articleEl = document.querySelector('.prose-dark');
    if (!articleEl) return;
    const headings = articleEl.querySelectorAll('h2, h3');
    headings.forEach((el, i) => {
      if (parsed[i]) {
        el.id = parsed[i].id;
      }
    });
  }, [contentHtml]);

  // Intersection observer to track active heading
  useEffect(() => {
    if (entries.length === 0) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    entries.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav
      className="sticky top-24 rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm"
      aria-label="Table of contents"
    >
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
        <List size={12} aria-hidden="true" />
        In this article
      </div>
      <ul className="space-y-1.5">
        {entries.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block text-xs leading-snug transition-all duration-150 py-0.5 rounded ${
                level === 3 ? 'pl-3' : ''
              } ${
                activeId === id
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {level === 3 && (
                <span className="text-slate-700 mr-1" aria-hidden="true">
                  ↳
                </span>
              )}
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
