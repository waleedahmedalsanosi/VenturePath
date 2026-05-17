CREATE TABLE public.user_profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio         TEXT CHECK (bio IS NULL OR char_length(bio) <= 500),
  avatar_url  TEXT,
  linkedin_url TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile"   ON public.user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users upsert own profile" ON public.user_profiles FOR ALL    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Cross-workspace read so other VenturePath members can see public profile info on /explore in v2
CREATE POLICY "any auth user can read profile" ON public.user_profiles FOR SELECT TO authenticated USING (true);
