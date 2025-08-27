-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Tradies can view helper profiles for job applications" ON profiles
  FOR SELECT USING (
    role = 'helper' AND 
    EXISTS (
      SELECT 1 FROM jobs j 
      JOIN job_applications ja ON j.id = ja.job_id 
      WHERE j.tradie_id = auth.uid() AND ja.helper_id = profiles.id
    )
  );

CREATE POLICY "Helpers can view tradie profiles for applied jobs" ON profiles
  FOR SELECT USING (
    role = 'tradie' AND 
    EXISTS (
      SELECT 1 FROM jobs j 
      JOIN job_applications ja ON j.id = ja.job_id 
      WHERE ja.helper_id = auth.uid() AND j.tradie_id = profiles.id
    )
  );

-- Jobs policies
CREATE POLICY "Anyone can view open jobs" ON jobs
  FOR SELECT USING (status = 'open');

CREATE POLICY "Tradies can create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = tradie_id);

CREATE POLICY "Tradies can view their own jobs" ON jobs
  FOR SELECT USING (auth.uid() = tradie_id);

CREATE POLICY "Tradies can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = tradie_id);

CREATE POLICY "Helpers can view jobs they applied to" ON jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_applications 
      WHERE job_id = jobs.id AND helper_id = auth.uid()
    )
  );

-- Job Applications policies
CREATE POLICY "Helpers can create applications" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helpers can view their own applications" ON job_applications
  FOR SELECT USING (auth.uid() = helper_id);

CREATE POLICY "Tradies can view applications for their jobs" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = job_applications.job_id AND tradie_id = auth.uid()
    )
  );

CREATE POLICY "Tradies can update applications for their jobs" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = job_applications.job_id AND tradie_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = tradie_id OR auth.uid() = helper_id);

CREATE POLICY "System can create payments" ON payments
  FOR INSERT WITH CHECK (true); -- Will be handled by server-side logic

CREATE POLICY "System can update payments" ON payments
  FOR UPDATE USING (true); -- Will be handled by server-side logic

-- Messages policies
CREATE POLICY "Users can view messages for their jobs" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages for their jobs" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM jobs j 
      WHERE j.id = job_id AND (j.tradie_id = auth.uid() OR j.assigned_helper_id = auth.uid())
    )
  );

-- Admin Actions policies (admin only)
CREATE POLICY "Only admins can view admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    auth.uid() = admin_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );