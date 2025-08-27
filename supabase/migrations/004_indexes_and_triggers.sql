-- =====================================================================
-- INDEXES, TRIGGERS, AND RLS POLICIES (Run after tables are created)
-- =====================================================================

-- STEP 1: Create indexes for performance
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

-- STEP 2: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- STEP 3: Create triggers for updated_at columns
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

SELECT 'Indexes and triggers created successfully!' as status;