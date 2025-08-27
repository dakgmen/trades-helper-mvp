-- =====================================================================
-- CORRECTED MIGRATION FOR SUPABASE - NO SUPERUSER REQUIRED
-- =====================================================================
-- NOTE: Before running this, enable uuid-ossp extension via 
--       Supabase Dashboard: Settings → Database → Extensions
-- =====================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Create jobs table  
CREATE TABLE IF NOT EXISTS public.jobs (
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

-- Create job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  helper_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, helper_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
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

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Create admin actions table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified  ON public.profiles(verified);
CREATE INDEX IF NOT EXISTS idx_jobs_tradie_id     ON public.jobs(tradie_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status       ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date_time    ON public.jobs(date_time);
CREATE INDEX IF NOT EXISTS idx_jobs_location     ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id    ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_helper_id ON public.job_applications(helper_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status    ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_payments_job_id   ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_messages_job_id    ON public.messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);

-- =====================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs policies  
CREATE POLICY "Anyone can view jobs" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Tradies can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'tradie'
    )
  );

CREATE POLICY "Tradies can update own jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'tradie'
    ) AND tradie_id = auth.uid()
  );

-- Job applications policies
CREATE POLICY "Users can view applications for their jobs/applications" ON public.job_applications
  FOR SELECT USING (
    helper_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_applications.job_id AND jobs.tradie_id = auth.uid()
    )
  );

CREATE POLICY "Helpers can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    helper_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('helper', 'tradie')
    )
  );

CREATE POLICY "Tradies can update applications for their jobs" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE jobs.id = job_applications.job_id AND jobs.tradie_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments they're involved in" ON public.payments
  FOR SELECT USING (
    tradie_id = auth.uid() OR helper_id = auth.uid()
  );

CREATE POLICY "Tradies can create payments for their jobs" ON public.payments
  FOR INSERT WITH CHECK (
    tradie_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE id = job_id AND tradie_id = auth.uid()
    )
  );

CREATE POLICY "Tradies can update payments for their jobs" ON public.payments
  FOR UPDATE USING (
    tradie_id = auth.uid()
  );

-- Messages policies
CREATE POLICY "Users can view messages they're involved in" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages for jobs they're involved in" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE id = job_id AND (
        tradie_id = auth.uid() OR assigned_helper_id = auth.uid()
      )
    )
  );

-- Admin actions policies (only admins)
CREATE POLICY "Only admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );