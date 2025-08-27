-- =====================================================================
-- ROW LEVEL SECURITY POLICIES (Run after tables and triggers are created)
-- =====================================================================

-- STEP 1: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- STEP 2: Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 3: Jobs policies  
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

-- STEP 4: Job applications policies
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

-- STEP 5: Payments policies
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

-- STEP 6: Messages policies
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

-- STEP 7: Admin actions policies (only admins)
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

SELECT 'RLS policies created successfully!' as status;