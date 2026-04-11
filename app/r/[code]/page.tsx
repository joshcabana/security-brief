import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  
  if (code) {
    const cookieStore = await cookies()
    // Define cookie options (expires in 30 days)
    cookieStore.set('referral_code', code, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })
  }
  
  // Redirect to signup/login after capturing the referral
  redirect('/login?ref=applied')
}
