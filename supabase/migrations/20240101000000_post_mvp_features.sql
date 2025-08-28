-- Post-MVP Features Migration
-- Implements all tables for Trust & Safety, Payments, Growth & Retention, and Ops features

-- ===== PHASE 2: TRUST & SAFETY =====

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('tradie', 'helper')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, reviewer_id)
);

-- Aggregate ratings for quick lookups
CREATE TABLE IF NOT EXISTS aggregate_ratings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    five_star INTEGER DEFAULT 0,
    four_star INTEGER DEFAULT 0,
    three_star INTEGER DEFAULT 0,
    two_star INTEGER DEFAULT 0,
    one_star INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('payment', 'work_quality', 'no_show', 'safety', 'communication', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    admin_id UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    resolution_outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terms consent tracking
CREATE TABLE IF NOT EXISTS terms_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version TEXT NOT NULL DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    consented_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, terms_version)
);

-- ===== PHASE 3: PAYMENTS & COMPLIANCE =====

-- Stripe KYC status tracking
CREATE TABLE IF NOT EXISTS stripe_kyc_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_account_id TEXT UNIQUE,
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'incomplete')),
    requirements_needed TEXT[], -- Array of missing requirements
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Payment transactions for audit trail
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    stripe_fee_cents INTEGER NOT NULL,
    net_amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'AUD',
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    auto_refund_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PHASE 4: GROWTH & RETENTION =====

-- Referrals system
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_role TEXT NOT NULL CHECK (referrer_role IN ('tradie', 'helper')),
    referral_code TEXT UNIQUE NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_role TEXT CHECK (referred_role IN ('tradie', 'helper')),
    reward_amount_cents INTEGER,
    reward_paid BOOLEAN DEFAULT FALSE,
    reward_paid_at TIMESTAMPTZ,
    first_job_completed BOOLEAN DEFAULT FALSE,
    first_job_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper availability calendar
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly')),
    recurring_end_date DATE,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_radius_km INTEGER DEFAULT 50,
    booked_by UUID REFERENCES auth.users(id),
    booked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(helper_id, date, start_time)
);

-- Job categories system
CREATE TABLE IF NOT EXISTS job_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES job_categories(id) ON DELETE CASCADE,
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges system
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    criteria_type TEXT NOT NULL CHECK (criteria_type IN ('jobs_completed', 'rating_average', 'rating_streak', 'referrals_made', 'account_age', 'earnings_total')),
    criteria_value INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, badge_id)
);

-- ===== PHASE 5: OPS & SCALABILITY =====

-- Support ticket system
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('payment', 'technical', 'account', 'safety', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_admin_id UUID REFERENCES auth.users(id),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support messages for tickets
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- For admin notes
    file_attachments TEXT[], -- Array of file URLs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics for analytics
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    metric_data JSONB, -- Flexible data storage
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('suspicious_job_posting', 'unusual_payment', 'identity_fraud', 'payment_anomaly')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    investigated_by UUID REFERENCES auth.users(id),
    investigated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_job_id ON disputes(job_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_job_id ON payment_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_auto_refund_at ON payment_transactions(auto_refund_at) WHERE auto_refund_at IS NOT NULL;

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_helper_date ON availability(helper_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_location ON availability(location_lat, location_lng) WHERE location_lat IS NOT NULL;

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_admin ON support_tickets(assigned_admin_id) WHERE assigned_admin_id IS NOT NULL;

-- ===== FUNCTIONS AND TRIGGERS =====

-- Function to update aggregate ratings
CREATE OR REPLACE FUNCTION update_aggregate_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    rating_stats RECORD;
BEGIN
    -- Determine which user to update based on operation
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.reviewee_id;
    ELSE
        target_user_id := NEW.reviewee_id;
    END IF;

    -- Calculate new statistics
    SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    INTO rating_stats
    FROM reviews 
    WHERE reviewee_id = target_user_id;

    -- Upsert aggregate rating
    INSERT INTO aggregate_ratings (
        user_id, total_reviews, average_rating,
        five_star, four_star, three_star, two_star, one_star,
        updated_at
    )
    VALUES (
        target_user_id, rating_stats.total, COALESCE(rating_stats.avg_rating, 0),
        rating_stats.five_star, rating_stats.four_star, rating_stats.three_star,
        rating_stats.two_star, rating_stats.one_star, NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_reviews = rating_stats.total,
        average_rating = COALESCE(rating_stats.avg_rating, 0),
        five_star = rating_stats.five_star,
        four_star = rating_stats.four_star,
        three_star = rating_stats.three_star,
        two_star = rating_stats.two_star,
        one_star = rating_stats.one_star,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for aggregate rating updates
CREATE TRIGGER trigger_update_aggregate_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_aggregate_rating();

-- Function to check for badge eligibility
CREATE OR REPLACE FUNCTION check_badge_eligibility(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    badge_record RECORD;
    user_stats RECORD;
BEGIN
    -- Get user statistics
    SELECT 
        (SELECT COUNT(*) FROM jobs WHERE (tradie_id = target_user_id OR helper_id = target_user_id) AND status = 'completed') as jobs_completed,
        (SELECT COALESCE(average_rating, 0) FROM aggregate_ratings WHERE user_id = target_user_id) as avg_rating,
        (SELECT COALESCE(total_reviews, 0) FROM aggregate_ratings WHERE user_id = target_user_id) as total_reviews,
        (SELECT COUNT(*) FROM referrals WHERE referrer_id = target_user_id AND first_job_completed = true) as referrals_made,
        (SELECT EXTRACT(YEARS FROM NOW() - created_at) FROM auth.users WHERE id = target_user_id) as account_age_years
    INTO user_stats;

    -- Check each badge criteria
    FOR badge_record IN 
        SELECT * FROM badges WHERE is_active = true
    LOOP
        -- Skip if user already has this badge
        IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = target_user_id AND badge_id = badge_record.id) THEN
            CONTINUE;
        END IF;

        -- Check criteria
        CASE badge_record.criteria_type
            WHEN 'jobs_completed' THEN
                IF user_stats.jobs_completed >= badge_record.criteria_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (target_user_id, badge_record.id);
                END IF;
            WHEN 'rating_average' THEN
                IF user_stats.avg_rating >= badge_record.criteria_value AND user_stats.total_reviews >= 10 THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (target_user_id, badge_record.id);
                END IF;
            WHEN 'referrals_made' THEN
                IF user_stats.referrals_made >= badge_record.criteria_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (target_user_id, badge_record.id);
                END IF;
            WHEN 'account_age' THEN
                IF user_stats.account_age_years >= badge_record.criteria_value THEN
                    INSERT INTO user_badges (user_id, badge_id) VALUES (target_user_id, badge_record.id);
                END IF;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregate_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_kyc_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only see their own data)
-- Reviews: users can see reviews they wrote or received
CREATE POLICY "Users can view their reviews" ON reviews FOR SELECT USING (
    reviewer_id = auth.uid() OR reviewee_id = auth.uid()
);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
);

-- Aggregate ratings: publicly readable
CREATE POLICY "Aggregate ratings are publicly readable" ON aggregate_ratings FOR SELECT TO authenticated USING (true);

-- Disputes: users can see disputes they're involved in
CREATE POLICY "Users can view their disputes" ON disputes FOR SELECT USING (
    complainant_id = auth.uid() OR respondent_id = auth.uid()
);
CREATE POLICY "Users can create disputes" ON disputes FOR INSERT WITH CHECK (
    complainant_id = auth.uid()
);

-- Terms consent: users can only see their own consent
CREATE POLICY "Users can view their consent" ON terms_consent FOR ALL USING (
    user_id = auth.uid()
);

-- Availability: helpers can manage their own availability
CREATE POLICY "Helpers can manage availability" ON availability FOR ALL USING (
    helper_id = auth.uid()
);
CREATE POLICY "Public can view availability" ON availability FOR SELECT TO authenticated USING (is_available = true);

-- Job categories: publicly readable
CREATE POLICY "Job categories are publicly readable" ON job_categories FOR SELECT TO authenticated USING (is_active = true);

-- Badges: publicly readable
CREATE POLICY "Badges are publicly readable" ON badges FOR SELECT TO authenticated USING (is_active = true);

-- User badges: users can see their own badges, others can see public badges
CREATE POLICY "Users can view badges" ON user_badges FOR SELECT USING (
    user_id = auth.uid() OR true -- All badges are publicly viewable
);

-- Support tickets: users can see their own tickets
CREATE POLICY "Users can view their tickets" ON support_tickets FOR ALL USING (
    user_id = auth.uid()
);

-- Support messages: users can see messages for their tickets
CREATE POLICY "Users can view ticket messages" ON support_messages FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) OR
    sender_id = auth.uid()
);
CREATE POLICY "Users can create ticket messages" ON support_messages FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) OR
    sender_id = auth.uid()
);

-- ===== DEFAULT DATA =====

-- Insert default badges
INSERT INTO badges (name, description, criteria_type, criteria_value) VALUES
('First Timer', 'Completed your first job', 'jobs_completed', 1),
('Reliable Helper', 'Completed 5 jobs', 'jobs_completed', 5),
('Job Master', 'Completed 25 jobs', 'jobs_completed', 25),
('Century Club', 'Completed 100 jobs', 'jobs_completed', 100),
('Five Star Professional', 'Maintained 5.0 rating with 10+ reviews', 'rating_average', 500), -- 5.00 * 100
('Top Rated', 'Maintained 4.8+ rating with 25+ reviews', 'rating_average', 480), -- 4.80 * 100
('Referral Champion', 'Successfully referred 5 people', 'referrals_made', 5),
('Veteran', 'Active for 2+ years', 'account_age', 2)
ON CONFLICT (name) DO NOTHING;

-- Insert default job categories
INSERT INTO job_categories (name, description, skills_required) VALUES
('General Labor', 'General labor and assistance tasks', ARRAY['physical_work', 'reliability']),
('Cleanup & Maintenance', 'Site cleanup and basic maintenance tasks', ARRAY['cleanup', 'organization']),
('Materials Handling', 'Loading, unloading, and moving materials', ARRAY['physical_strength', 'materials_handling']),
('Painting Preparation', 'Surface preparation and painting assistance', ARRAY['surface_prep', 'attention_to_detail']),
('Tool & Equipment Assistance', 'Operating tools and equipment assistance', ARRAY['tool_operation', 'safety_awareness']),
('Demolition Assistance', 'Safe demolition and debris removal', ARRAY['demolition', 'safety_procedures']),
('Landscaping & Outdoor', 'Outdoor work and landscaping assistance', ARRAY['outdoor_work', 'landscaping']),
('Electrical Assistant', 'Electrical work assistance (no licensed work)', ARRAY['electrical_safety', 'cable_running']),
('Plumbing Assistant', 'Plumbing work assistance (no licensed work)', ARRAY['pipe_cutting', 'fixture_installation']),
('Carpentry Assistant', 'Woodworking and carpentry assistance', ARRAY['measuring', 'cutting', 'assembly'])
ON CONFLICT (name) DO NOTHING;

-- Create initial system metrics
INSERT INTO system_metrics (metric_name, metric_value) VALUES
('total_users', 0),
('total_jobs', 0),
('total_completed_jobs', 0),
('total_revenue_cents', 0),
('average_job_completion_time_hours', 0)
ON CONFLICT DO NOTHING;