-- =====================================================================
-- STEP-BY-STEP MIGRATION FOR SUPABASE - SAFER APPROACH
-- =====================================================================
-- Run this section by section to identify exactly where issues occur
-- =====================================================================

-- STEP 1: Drop existing tables if they exist (to start clean)
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- STEP 2: Create profiles table (most important)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('tradie','helper','admin')),
  full_name     TEXT,
  phone         TEXT,
  bio           TEXT,
  skills        TEXT[],
  white_card_url    TEXT,
  id_document_url   TEXT,
  verified      BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT now(),
  updated_at    TIMESTAMPTZ  DEFAULT now()
);

-- Test: Verify profiles table was created
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- STEP 3: Create jobs table
CREATE TABLE public.jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tradie_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  location          TEXT NOT NULL,
  date_time         TIMESTAMPTZ NOT NULL,
  duration_hours    INTEGER NOT NULL CHECK (duration_hours > 0),
  pay_rate          NUMERIC(10,2) NOT NULL CHECK (pay_rate > 0),
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
  assigned_helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- STEP 4: Create job applications table
CREATE TABLE public.job_applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  helper_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, helper_id)
);

-- STEP 5: Create payments table
CREATE TABLE public.payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id           UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  tradie_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  helper_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','escrow','released','refunded')),
  stripe_payment_id TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  released_at      TIMESTAMPTZ
);

-- STEP 6: Create messages table
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- STEP 7: Create admin actions table
CREATE TABLE public.admin_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- SUCCESS MESSAGE
SELECT 'All tables created successfully!' as status;