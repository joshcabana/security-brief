-- ==========================================
-- AI Security Brief - Supabase Schema
-- ==========================================

-- 1. Profiles Table (extends Supabase Auth User)
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Streaks & Rewards
  last_login timestamp with time zone DEFAULT timezone('utc'::text, now()),
  streak_count integer DEFAULT 1 NOT NULL,
  
  -- Referral System
  referral_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex') NOT NULL,
  referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Billing & Tier
  subscription_tier text DEFAULT 'free' NOT NULL, -- 'free', 'pro_monthly', 'pro_yearly', 'enterprise'
  subscription_status text DEFAULT 'active' NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Saved Briefs Table (Bookmark System)
CREATE TABLE public.saved_briefs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  article_slug text NOT NULL,
  saved_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, article_slug)
);

ALTER TABLE public.saved_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved briefs" ON public.saved_briefs
  FOR ALL USING (auth.uid() = user_id);


-- 3. Referrals Table (Audit log for the referral engine)
CREATE TABLE public.referrals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'converted_to_pro'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referral records" ON public.referrals 
  FOR SELECT USING (auth.uid() = referrer_id);
