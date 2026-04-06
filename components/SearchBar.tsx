'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'w-64' : 'w-10 sm:w-48'} h-9`}>
      <div className={`absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none transition-colors duration-200 ${isFocused ? 'text-cyan-400' : 'text-slate-400'}`}>
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Search briefings..."
        className={`w-full h-full pl-9 pr-4 text-sm bg-slate-900 border rounded-full transition-all duration-300 outline-none placeholder:text-slate-500
          ${isFocused 
            ? 'border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] text-white' 
            : 'border-slate-800 text-slate-300 hover:border-slate-700 focus:border-cyan-500/50 cursor-pointer sm:cursor-text'
          }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
}
