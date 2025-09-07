import fs from 'fs';
import path from 'path';

// Define screen categorization framework
const screenCategories = {
  // Core user workflows (High Priority)
  CORE_DASHBOARDS: {
    priority: 'HIGH',
    type: 'Dashboard',
    description: 'Main user interfaces for tradies and helpers'
  },
  CORE_ONBOARDING: {
    priority: 'HIGH', 
    type: 'Flow',
    description: 'User registration and setup flows'
  },
  CORE_JOB_MANAGEMENT: {
    priority: 'HIGH',
    type: 'Interface',
    description: 'Job posting, discovery, application workflows'
  },
  CORE_PAYMENTS: {
    priority: 'HIGH',
    type: 'Flow',
    description: 'Payment processing and financial management'
  },
  
  // Important user features (Medium Priority)
  MESSAGING_COMMUNICATION: {
    priority: 'MEDIUM',
    type: 'Interface', 
    description: 'Communication and messaging features'
  },
  PROFILE_MANAGEMENT: {
    priority: 'MEDIUM',
    type: 'Form',
    description: 'User profile editing and management'
  },
  ADMIN_MANAGEMENT: {
    priority: 'MEDIUM',
    type: 'Dashboard',
    description: 'Administrative interfaces and tools'
  },
  
  // Supporting features (Low Priority)
  MARKETING_PAGES: {
    priority: 'LOW',
    type: 'Page',
    description: 'Marketing and informational pages'
  },
  SUPPORT_FEATURES: {
    priority: 'LOW',
    type: 'Interface',
    description: 'Help, support, and secondary features'
  }
};

// Map screen files to categories
const screenMapping = {
  // High Priority - Core Dashboards
  'tradie-dashboard.txt': 'CORE_DASHBOARDS',
  'helper-dashboard.txt': 'CORE_DASHBOARDS',
  'messaging-dashboard.txt': 'MESSAGING_COMMUNICATION',
  
  // High Priority - Core Onboarding  
  'onboarding-role-selection.txt': 'CORE_ONBOARDING',
  'onboarding-tradie-profile.txt': 'CORE_ONBOARDING',
  'onboarding-helper-profile.txt': 'CORE_ONBOARDING',
  'onboarding-tradie-tutorial.txt': 'CORE_ONBOARDING',
  'onboarding-helper-tutorial.txt': 'CORE_ONBOARDING',
  'auth-landing-page.txt': 'CORE_ONBOARDING',
  
  // High Priority - Job Management
  'job-discovery-feed.txt': 'CORE_JOB_MANAGEMENT',
  'multi-step-job-posting-form.txt': 'CORE_JOB_MANAGEMENT',
  'detailed-job-view.txt': 'CORE_JOB_MANAGEMENT',
  'job-progress-tracker.txt': 'CORE_JOB_MANAGEMENT',
  'tradie-job-management-dashboard.txt': 'CORE_JOB_MANAGEMENT',
  'advanced-job-search.txt': 'CORE_JOB_MANAGEMENT',
  'intelligent-job-matching.txt': 'CORE_JOB_MANAGEMENT',
  'job-card.txt': 'CORE_JOB_MANAGEMENT',
  
  // High Priority - Applications
  'manage-applications.txt': 'CORE_JOB_MANAGEMENT',
  'application-details.txt': 'CORE_JOB_MANAGEMENT',
  'application-review-interface.txt': 'CORE_JOB_MANAGEMENT',
  'accepted-applications.txt': 'CORE_JOB_MANAGEMENT',
  'rejected-applications.txt': 'CORE_JOB_MANAGEMENT',
  'application-history-view.txt': 'CORE_JOB_MANAGEMENT',
  'application-plumbing-installation.txt': 'CORE_JOB_MANAGEMENT',
  
  // High Priority - Payments
  'secure-payment-flow.txt': 'CORE_PAYMENTS',
  'stripe-connect-onboarding.txt': 'CORE_PAYMENTS',
  'payment-history.txt': 'CORE_PAYMENTS',
  'financial-dashboard.txt': 'CORE_PAYMENTS',
  'transparent-fee-breakdown.txt': 'CORE_PAYMENTS',
  
  // Medium Priority - Messaging & Communication
  'job-messaging-interface.txt': 'MESSAGING_COMMUNICATION',
  'communication-preferences.txt': 'MESSAGING_COMMUNICATION',
  'notification-center.txt': 'MESSAGING_COMMUNICATION',
  
  // Medium Priority - Profile Management
  'multi-step-profile-form.txt': 'PROFILE_MANAGEMENT',
  'profile-editing-page.txt': 'PROFILE_MANAGEMENT',
  'public-profile-view.txt': 'PROFILE_MANAGEMENT',
  
  // Medium Priority - Scheduling & Availability
  'interactive-avalaibility-calendar.txt': 'PROFILE_MANAGEMENT',
  'schedule-overview.txt': 'PROFILE_MANAGEMENT',
  'booking-confirmation-screen.txt': 'PROFILE_MANAGEMENT',
  
  // Medium Priority - Admin Management
  'admin-dashboard-overview.txt': 'ADMIN_MANAGEMENT',
  'admin-dashboard-users.txt': 'ADMIN_MANAGEMENT',
  'admin-dashboard-jobs.txt': 'ADMIN_MANAGEMENT',
  'admin-dashboard-payments.txt': 'ADMIN_MANAGEMENT',
  'admin-dashboard-disputes.txt': 'ADMIN_MANAGEMENT',
  'user-management-interface.txt': 'ADMIN_MANAGEMENT',
  'analytics-dashboard.txt': 'ADMIN_MANAGEMENT',
  'fraud-detection-interface.txt': 'ADMIN_MANAGEMENT',
  
  // Medium Priority - Reviews & Ratings
  'review-display-system.txt': 'SUPPORT_FEATURES',
  'post-job-review-interface.txt': 'SUPPORT_FEATURES',
  
  // Low Priority - Marketing Pages
  'about_us_page.txt': 'MARKETING_PAGES',
  'features_showcase_page.txt': 'MARKETING_PAGES',
  'how_it_works_page.txt': 'MARKETING_PAGES',
  'transparent_pricing_page.txt': 'MARKETING_PAGES',
  'success_stories_page.txt': 'MARKETING_PAGES',
  'careers_page.txt': 'MARKETING_PAGES',
  'partner_affiliate_program_page.txt': 'MARKETING_PAGES',
  'b2b_landing_page.txt': 'MARKETING_PAGES',
  'blog_homepage.txt': 'MARKETING_PAGES',
  
  // Low Priority - Support Features
  'help_center_page.txt': 'SUPPORT_FEATURES',
  'contact_us_page.txt': 'SUPPORT_FEATURES',
  'trust_safety_page.txt': 'SUPPORT_FEATURES',
  'privacy_policy_page.txt': 'SUPPORT_FEATURES',
  'terms-and-conditions.txt': 'SUPPORT_FEATURES',
  'support-ticket-system.txt': 'SUPPORT_FEATURES',
  'dispute-resolution-interface.txt': 'SUPPORT_FEATURES',
  'trust-and-safety-hub.txt': 'SUPPORT_FEATURES',
  'emergency-safety-interface.txt': 'SUPPORT_FEATURES',
  'offline-mode-interface.txt': 'SUPPORT_FEATURES',
  'referral-proram-interface.txt': 'SUPPORT_FEATURES',
  'referral-proramme.txt': 'SUPPORT_FEATURES',
  'achievement-badge-system.txt': 'SUPPORT_FEATURES',
  'system-settings.txt': 'SUPPORT_FEATURES',
  'sidebar-navigation.txt': 'SUPPORT_FEATURES'
};

// Analyze existing React components
const existingComponents = {
  'tradie-dashboard.txt': 'src/components/dashboard/EnhancedTradieDashboard.tsx',
  'helper-dashboard.txt': 'src/components/dashboard/EnhancedHelperDashboard.tsx', 
  'messaging-dashboard.txt': 'src/components/messaging/MessagingDashboard.tsx',
  'multi-step-job-posting-form.txt': 'src/components/jobs/MultiStepJobPostForm.tsx',
  'job-discovery-feed.txt': 'src/components/jobs/JobFeed.tsx',
  'detailed-job-view.txt': 'src/components/jobs/JobDetail.tsx',
  'advanced-job-search.txt': 'src/components/jobs/AdvancedJobSearch.tsx',
  'job-card.txt': 'src/components/jobs/JobCard.tsx',
  'job-progress-tracker.txt': 'src/components/jobs/JobProgressTracker.tsx',
  'secure-payment-flow.txt': 'src/components/payments/SecurePaymentFlow.tsx',
  'stripe-connect-onboarding.txt': 'src/components/payments/StripeConnectOnboarding.tsx',
  'payment-history.txt': 'src/components/payments/PaymentHistory.tsx',
  'financial-dashboard.txt': 'src/components/financial/FinancialDashboard.tsx',
  'multi-step-profile-form.txt': 'src/components/profile/MultiStepProfileForm.tsx',
  'profile-editing-page.txt': 'src/components/profile/ProfileForm.tsx',
  'public-profile-view.txt': 'src/components/profile/PublicProfile.tsx',
  'interactive-avalaibility-calendar.txt': 'src/components/scheduling/InteractiveAvailabilityCalendar.tsx',
  'admin-dashboard-overview.txt': 'src/components/admin/AdminDashboardOverview.tsx',
  'admin-dashboard-users.txt': 'src/components/admin/AdminUserManagement.tsx',
  'admin-dashboard-jobs.txt': 'src/components/admin/AdminJobManagement.tsx',
  'admin-dashboard-payments.txt': 'src/components/admin/AdminPaymentManagement.tsx',
  'admin-dashboard-disputes.txt': 'src/components/admin/AdminDisputeManagement.tsx',
  'notification-center.txt': 'src/components/notifications/NotificationCenter.tsx',
  'onboarding-role-selection.txt': 'src/components/onboarding/RoleSelection.tsx',
  'terms-and-conditions.txt': 'src/components/legal/TermsAndConditions.tsx',
  'about_us_page.txt': 'src/components/marketing/AboutPage.tsx',
  'contact_us_page.txt': 'src/components/marketing/ContactPage.tsx',
  'features_showcase_page.txt': 'src/components/marketing/FeaturesPage.tsx',
  'how_it_works_page.txt': 'src/components/marketing/HowItWorksPage.tsx',
  'transparent_pricing_page.txt': 'src/components/marketing/PricingPage.tsx',
  'help_center_page.txt': 'src/components/marketing/HelpCenterPage.tsx',
  'system-settings.txt': 'src/components/settings/SystemSettings.tsx'
};

async function analyzeScreens() {
  const screensDir = './screens';
  const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.txt'));
  
  console.log(`\n=== TRADIE-HELPER SCREEN CONVERSION ANALYSIS ===`);
  console.log(`Total screen files found: ${files.length}`);
  
  const analysis = {
    total: files.length,
    existing: 0,
    needsConversion: 0,
    byPriority: {
      HIGH: [],
      MEDIUM: [], 
      LOW: []
    },
    byCategory: {},
    conversionPlan: []
  };
  
  // Analyze each screen file
  for (const file of files) {
    const category = screenMapping[file] || 'SUPPORT_FEATURES';
    const categoryInfo = screenCategories[category];
    const hasExisting = existingComponents[file];
    
    const screenInfo = {
      filename: file,
      category,
      priority: categoryInfo.priority,
      type: categoryInfo.type,
      existing: hasExisting || null,
      status: hasExisting ? 'EXISTS' : 'NEEDS_CONVERSION'
    };
    
    if (hasExisting) {
      analysis.existing++;
    } else {
      analysis.needsConversion++;
    }
    
    analysis.byPriority[categoryInfo.priority].push(screenInfo);
    
    if (!analysis.byCategory[category]) {
      analysis.byCategory[category] = [];
    }
    analysis.byCategory[category].push(screenInfo);
  }
  
  // Generate conversion plan
  console.log(`\n=== CONVERSION STATUS SUMMARY ===`);
  console.log(`✅ Already implemented: ${analysis.existing}`);
  console.log(`🔄 Needs conversion: ${analysis.needsConversion}`);
  
  console.log(`\n=== PRIORITY BREAKDOWN ===`);
  Object.entries(analysis.byPriority).forEach(([priority, screens]) => {
    const existing = screens.filter(s => s.existing).length;
    const needed = screens.filter(s => !s.existing).length;
    console.log(`${priority}: ${screens.length} total (${existing} exist, ${needed} need conversion)`);
  });
  
  console.log(`\n=== DETAILED ANALYSIS BY CATEGORY ===`);
  
  Object.entries(analysis.byCategory).forEach(([category, screens]) => {
    const categoryInfo = screenCategories[category];
    console.log(`\n--- ${category} (${categoryInfo.priority} Priority) ---`);
    console.log(`Description: ${categoryInfo.description}`);
    console.log(`Files: ${screens.length}`);
    
    screens.forEach(screen => {
      const status = screen.existing ? '✅' : '❌';
      const existing = screen.existing ? ` -> ${screen.existing}` : '';
      console.log(`  ${status} ${screen.filename}${existing}`);
    });
  });
  
  console.log(`\n=== CONVERSION ROADMAP ===`);
  
  // Phase 1: High Priority Missing Components
  const highPriorityMissing = analysis.byPriority.HIGH.filter(s => !s.existing);
  if (highPriorityMissing.length > 0) {
    console.log(`\n🚀 PHASE 1 - HIGH PRIORITY CONVERSIONS (${highPriorityMissing.length} components)`);
    highPriorityMissing.forEach(screen => {
      console.log(`  • ${screen.filename} (${screen.category})`);
    });
  }
  
  // Phase 2: Medium Priority Missing Components  
  const mediumPriorityMissing = analysis.byPriority.MEDIUM.filter(s => !s.existing);
  if (mediumPriorityMissing.length > 0) {
    console.log(`\n📈 PHASE 2 - MEDIUM PRIORITY CONVERSIONS (${mediumPriorityMissing.length} components)`);
    mediumPriorityMissing.forEach(screen => {
      console.log(`  • ${screen.filename} (${screen.category})`);
    });
  }
  
  // Phase 3: Low Priority Missing Components
  const lowPriorityMissing = analysis.byPriority.LOW.filter(s => !s.existing);
  if (lowPriorityMissing.length > 0) {
    console.log(`\n📋 PHASE 3 - LOW PRIORITY CONVERSIONS (${lowPriorityMissing.length} components)`);
    lowPriorityMissing.forEach(screen => {
      console.log(`  • ${screen.filename} (${screen.category})`);
    });
  }
  
  // Save detailed analysis to file
  fs.writeFileSync('screen-conversion-analysis.json', JSON.stringify(analysis, null, 2));
  console.log(`\n📄 Detailed analysis saved to screen-conversion-analysis.json`);
  
  return analysis;
}

// Run analysis
analyzeScreens().then(analysis => {
  console.log(`\n=== ANALYSIS COMPLETE ===`);
}).catch(console.error);