import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Ignore if called from Server Component
            }
          },
        },
      }
    )
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && sessionData?.user) {
      // Check for referral cookie
      const referralCode = cookieStore.get('referral_code')?.value
      if (referralCode) {
        // Find referrer
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single()

        if (referrer && referrer.id !== sessionData.user.id) {
          // Update current user's profile with referrer
          await supabase
            .from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', sessionData.user.id)
            .is('referred_by', null) // Only set if not already set
            
          // We could also log to referrals table here assuming the trigger doesn't do it
          const { error: refError } = await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referred_user_id: sessionData.user.id,
            status: 'pending'
          })
        }
        
        cookieStore.delete('referral_code')
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=InvalidAuth`)
}
