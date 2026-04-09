import type { PrimarySource } from '@/lib/articles';

export default function PrimarySources({ sources }: { sources?: PrimarySource[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-16 border-t pt-10 border-gray-800">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
        Primary Sources
      </h2>
      <ul className="space-y-4">
        {sources.map((source, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="text-emerald-500 text-lg leading-none mt-px">→</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hover:underline text-gray-300 hover:text-white transition-colors"
            >
              {source.title}
            </a>
            {source.date && (
              <span className="text-sm text-gray-500 ml-auto whitespace-nowrap">
                ({source.date})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
