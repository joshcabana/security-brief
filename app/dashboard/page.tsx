import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'
import { getAllArticles } from '@/lib/articles'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile which contains the streak and referral code.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch saved briefs
  const { data: savedRecords } = await supabase
    .from('saved_briefs')
    .select('article_slug')
    .eq('user_id', user.id)

  const savedSlugs = new Set(savedRecords?.map((r) => r.article_slug) || [])

  // Fetch all content
  const allArticles = await getAllArticles()
  
  // For the "Personalized Feed", let's just reverse chronological right now, or filter if we add preferences.
  // We'll show the top 3 latest
  const recentFeed = allArticles.slice(0, 3)

  // Saved briefs objects
  const savedArticles = allArticles.filter(a => savedSlugs.has(a.slug))

  // For the Referral Link
  const referralCode = profile?.referral_code || 'error'
  const referralLink = `https://aithreatbrief.com/r/${referralCode}`
  const referralsCount = profile?.referral_count || 0 // Suppose we added a count, or we query the referrals table
  
  // Actually query the referrals table specifically:
  const { count: refCount } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  const isPro = profile?.subscription_status === 'active' && 
                (profile?.subscription_tier === 'pro_monthly' || profile?.subscription_tier === 'pro_yearly')

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

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Streak Widget */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-card">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Current Streak</div>
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path></svg>
          </div>
          <div className="text-4xl font-black text-white">{profile?.streak_count || 1} <span className="text-lg text-slate-500 font-normal">wks</span></div>
          <div className="mt-3 text-xs text-slate-400">Log in next week to unlock the <span className="text-cyan-400">Bonus Prompt Guide</span>.</div>
        </div>

        {/* Readiness Score Widget */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-card">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Readiness Score</div>
          <div className="flex items-end gap-2">
            <div className="text-4xl font-black text-white">Incomplete</div>
          </div>
          <div className="mt-3 text-xs text-slate-400">Take the readiness assessment to benchmark your threat posture.</div>
          <Link href="/assessment" className="inline-block mt-3 text-xs font-bold text-cyan-400 hover:text-cyan-300">Start Assessment →</Link>
        </div>

        {/* Referral Widget */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/20 to-slate-900 border border-cyan-900/50 shadow-glow-sm">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Referrals</div>
          <div className="text-4xl font-black text-white">{refCount || 0}</div>
          <div className="mt-2 text-xs text-slate-400">You and your referral both get 1 month of Pro.</div>
          <div className="mt-3 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2">
            <code className="text-xs text-cyan-400 flex-1 truncate">{referralLink}</code>
            <button className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors" title="Copy to clipboard">Copy</button>
          </div>
        </div>
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
