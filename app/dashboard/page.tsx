import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/articles'
import ReferralWidget from '@/components/ReferralWidget'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: savedRecords } = await supabase.from('saved_briefs').select('article_slug').eq('user_id', user.id)
  const savedSlugs = new Set(savedRecords?.map((r: { article_slug: string }) => r.article_slug) || [])

  // Streak Math Logic
  let updatedStreakCount = profile?.streak_count || 1;
  const now = new Date();
  const lastLogin = profile?.last_login ? new Date(profile.last_login) : now;
  const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays >= 7) {
    updatedStreakCount += Math.floor(diffDays / 7);
    await supabase.from('profiles').update({ streak_count: updatedStreakCount, last_login: now.toISOString() }).eq('id', user.id);
  } else if (profile?.last_login == null) {
    // Initial setup
    await supabase.from('profiles').update({ last_login: now.toISOString() }).eq('id', user.id);
  }

  const allArticles = await getAllArticles()
  const recentFeed = allArticles.slice(0, 3) 
  const savedArticles = allArticles.filter(a => savedSlugs.has(a.slug))

  const referralCode = profile?.referral_code || 'error'
  const referralLink = `https://aithreatbrief.com/r/${referralCode}`
  
  const { count: refCount } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', user.id)

  const isPro = profile?.subscription_status === 'active' && (profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            Intelligence Dashboard
            {isPro && <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">PRO</span>}
          </div>
          <h1 className="text-3xl font-black text-white">Welcome back.</h1>
          <p className="text-slate-400 mt-1">{user.email}</p>
        </div>
        {!isPro && (
          <Link href="/pricing" className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors">
            Upgrade to Pro
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Streak Widget */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-card">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Current Streak</div>
          </div>
          <div className="text-4xl font-black text-white">{updatedStreakCount} <span className="text-lg text-slate-500 font-normal">wks</span></div>
          <div className="mt-3 text-xs text-slate-400">Log in next week to unlock the <span className="text-cyan-400">Bonus Prompt Guide</span>.</div>
        </div>

        {/* Readiness Score Widget */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full"></div>
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Readiness Score</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-black text-white">Incomplete</div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Take the readiness assessment to benchmark your threat posture.</div>
          <Link href="/assessment" className="inline-block mt-3 text-xs font-bold text-cyan-400 hover:text-cyan-300">Start Assessment →</Link>
        </div>

        {/* Referral Widget */}
        <ReferralWidget link={referralLink} count={refCount || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Your Briefing Feed</h2>
          {recentFeed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recentFeed.map((article, i) => (
                <ArticleCard key={article.slug} article={article} variant="default" index={i} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-800 border-dashed rounded-xl">
              <p className="text-slate-500">Your personalized feed is being generated.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-white mb-6 border-b border-slate-800 pb-4">Saved Briefs</h2>
          {savedArticles.length > 0 ? (
            <ul className="space-y-4">
              {savedArticles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/blog/${article.slug}`} className="block group">
                    <h3 className="text-sm font-semibold text-slate-300 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">{article.title}</h3>
                    <div className="text-xs text-slate-500 mt-1 font-mono">{article.readTime}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 italic">No briefs saved yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
