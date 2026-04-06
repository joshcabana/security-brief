'use client';

import React from 'react';
import { MessageSquare, Users, PlaySquare } from 'lucide-react';

export default function RepurposeCTA({ title, url }: { title: string; url: string }) {
  const handleShare = (platform: string) => {
    // In a real implementation this would trigger the respective share intent or copy logic.
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Repurpose this intel</h4>
          <p className="text-xs text-slate-400">Share this threat briefing directly with your network to build authority.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => handleShare('twitter')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-[#1DA1F2]/20 text-slate-300 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 border border-slate-700 px-3 py-2 rounded text-xs transition-colors"
          >
            <MessageSquare size={14} /> X Thread
          </button>
          <button 
            onClick={() => handleShare('linkedin')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-[#0A66C2]/20 text-slate-300 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 border border-slate-700 px-3 py-2 rounded text-xs transition-colors"
          >
            <Users size={14} /> Carousel
          </button>
          <button 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-[#FF0000]/20 text-slate-300 hover:text-[#FF0000] hover:border-[#FF0000]/50 border border-slate-700 px-3 py-2 rounded text-xs transition-colors cursor-not-allowed opacity-75"
            title="YouTube Shorts script generation coming soon"
          >
            <PlaySquare size={14} /> YT Short
          </button>
        </div>
      </div>
    </div>
  );
}
