# TradieHelper - Google Stitch UI Design Requirements

## 📋 Project Overview
**Platform**: TradieHelper - Australian tradie and helper job matching platform
**Tech Stack**: React + TypeScript + Tailwind CSS + Supabase
**Target Users**: Australian tradies, construction helpers, and admin users
**Design Tool**: Google Stitch AI UI Generator

---

## 🎯 Core Design Principles

### Brand Identity
- **Primary Color**: Blue (#2563EB - professional, trustworthy)
- **Secondary Color**: Green (#16A34A - success, money)
- **Accent Color**: Orange (#EA580C - urgency, action)
- **Neutral**: Grays for text and backgrounds
- **Typography**: Clean, professional sans-serif fonts
- **Tone**: Professional yet approachable, Australian-friendly

### Australian Context
- **Currency**: AUD ($) displays
- **Time**: Australian time zones
- **Language**: Australian English spelling and terminology
- **Regulations**: Safety-first messaging, insurance considerations
- **Cultural**: Practical, no-nonsense design approach

---

## 📱 Complete Screen Inventory

### 🔐 **Authentication Screens** (2 screens)

#### 1. **Auth Landing Page** (`/auth`)
**Purpose**: Entry point for login/signup
**Key Elements**:
- TradieHelper logo and tagline
- Toggle between Login and Signup forms
- Professional hero section with value proposition

**Google Stitch Prompt**:
```
Create a modern Australian job platform landing page with centered login/signup forms. Include a professional blue and white color scheme, clear typography, and a tagline "Connect tradies with reliable helpers". Add subtle construction/tools imagery in background. Mobile-responsive design with clean form inputs and prominent CTA buttons.
```

#### 2. **Terms and Conditions Modal** (`TermsAndConditions.tsx`)
**Purpose**: Legal agreement acceptance during signup
**Key Elements**:
- Scrollable terms content
- Acceptance checkbox
- Accept/Decline buttons

**Google Stitch Prompt**:
```
Design a professional legal terms modal with scrollable content area, checkbox for acceptance, and clear accept/decline buttons. Use clean typography, ensure good readability, and include progress indicators. Modern modal design with proper spacing and Australian legal compliance feel.
```

---

### 🏠 **Dashboard Screens** (3 variants)

#### 3. **Tradie Dashboard** (`/` - tradie role)
**Purpose**: Main hub for tradies to manage jobs
**Key Elements**:
- Welcome message with user name
- Quick action cards (Post Job, View Applications)
- Recent activity feed
- Navigation bar with role-specific menu

**Google Stitch Prompt**:
```
Create a professional tradie dashboard with welcome header, large action cards for "Post New Job" and "View Applications", and a recent activity sidebar. Use blue primary colors, card-based layout, and include job statistics. Mobile-responsive with clear hierarchy and professional Australian construction industry feel.
```

#### 4. **Helper Dashboard** (`/` - helper role)
**Purpose**: Job discovery and application management for helpers
**Key Elements**:
- Personalized job recommendations
- Job feed with filters
- Application status overview
- Quick stats (earnings, jobs completed)

**Google Stitch Prompt**:
```
Design a helper-focused dashboard with job discovery feed, filter options, and personal stats cards. Include job cards with pay rates, location, and urgency indicators. Use green accents for earnings, clear job status indicators, and mobile-friendly card layouts. Professional blue and green color scheme.
```

#### 5. **Profile Completion Screen** (Dashboard when profile incomplete)
**Purpose**: Onboarding flow for new users
**Key Elements**:
- Progress indicator
- Form sections for personal details, skills, documents
- Upload areas for ID and white card
- Clear next steps

**Google Stitch Prompt**:
```
Create a multi-step profile completion form with progress bar, section-by-section layout, file upload areas, and skills selection. Use professional forms design with clear labels, validation states, and Australian document requirements (White Card, ID). Include helpful tooltips and progress saving indicators.
```

---

### 👤 **Profile Management** (2 screens)

#### 6. **Profile Edit Page** (`/profile`)
**Purpose**: User profile management and updates
**Key Elements**:
- Editable form with current information
- Photo upload area
- Skills management
- Document upload/replacement
- Location settings

**Google Stitch Prompt**:
```
Design a comprehensive profile editing page with photo upload, editable form fields, skills tags, document management section, and location picker. Use clean form design with proper validation states, file upload areas, and save/cancel actions. Professional layout suitable for both tradies and helpers.
```

#### 7. **Public Profile View** (for reviewing other users)
**Purpose**: View other user's profiles for trust/safety
**Key Elements**:
- Profile photo and basic info
- Skills and experience
- Reviews and ratings
- Badge displays
- Contact options

**Google Stitch Prompt**:
```
Create a public profile view with user photo, star ratings, skills display, earned badges section, and review testimonials. Use trust-building design elements, clear rating displays, and professional layout. Include verification indicators and contact options with safety-first messaging.
```

---

### 💼 **Job Management** (6 screens)

#### 8. **Job Post Form** (`/jobs/post`)
**Purpose**: Tradies create new job listings
**Key Elements**:
- Multi-step form (details, location, requirements, pay)
- Map integration for location
- Skills selection
- Date/time picker
- Pay rate calculator

**Google Stitch Prompt**:
```
Design a multi-step job posting form with sections for job details, location map picker, required skills selection, date/time picker, and pay rate input. Include progress indicators, form validation, and helpful hints. Use professional blues with clear section dividers and mobile-responsive design.
```

#### 9. **Job Feed** (`/jobs`)
**Purpose**: Browse available jobs (for helpers)
**Key Elements**:
- Filterable job cards
- Search functionality
- Location-based sorting
- Quick apply buttons
- Job urgency indicators

**Google Stitch Prompt**:
```
Create a job discovery feed with filtering sidebar, searchable job cards showing pay rate, location, urgency level, and skills required. Use card-based layout with clear CTAs, urgency color coding (red for urgent), and distance indicators. Include pagination and sorting options.
```

#### 10. **Job Details View** (Modal/Page from job cards)
**Purpose**: Detailed job information and application
**Key Elements**:
- Complete job description
- Tradie profile preview
- Location map
- Application form/button
- Safety requirements

**Google Stitch Prompt**:
```
Design a detailed job view with full description, integrated map, tradie info card, required skills list, safety requirements, and prominent apply button. Use clean layout with good information hierarchy, trust indicators, and clear action buttons. Include job timeline and payment details.
```

#### 11. **My Jobs** (`/jobs/my` - for tradies)
**Purpose**: Manage posted jobs and applications
**Key Elements**:
- Job status dashboard
- Application management
- Edit/cancel options
- Communication tools

**Google Stitch Prompt**:
```
Create a job management dashboard for tradies with job status cards, application counters, edit/cancel options, and applicant review sections. Use status color coding, clear action buttons, and organized table/card layouts. Include quick stats and filtering options.
```

#### 12. **Job Status Tracker** (Embedded in various screens)
**Purpose**: Track job progress through workflow
**Key Elements**:
- Visual progress timeline
- Status updates
- Next action indicators
- Communication prompts

**Google Stitch Prompt**:
```
Design a job progress tracker with visual timeline, status indicators, and next action prompts. Use progress bars, status badges, and clear visual hierarchy. Include messaging integration and payment milestone indicators. Clean, professional progress tracking design.
```

#### 13. **Job Search with Filters** (Enhanced job feed)
**Purpose**: Advanced job discovery with multiple filters
**Key Elements**:
- Advanced filter panel
- Map view toggle
- Saved searches
- Job alerts setup

**Google Stitch Prompt**:
```
Create an advanced job search interface with collapsible filter sidebar, map/list view toggle, saved searches, and job alert setup. Use modern filter UI patterns, clear search results, and location-based visual elements. Include search history and recommendation sections.
```

---

### 📋 **Application Management** (3 screens)

#### 14. **Applications List** (`/applications`)
**Purpose**: Manage job applications (different views for tradie/helper)
**Key Elements**:
- Application status cards
- Accept/reject actions (tradie view)
- Application tracking (helper view)
- Communication shortcuts

**Google Stitch Prompt**:
```
Design application management screens with status-based card layouts, action buttons for accept/reject, application tracking timeline, and communication shortcuts. Use status color coding, clear typography, and responsive design. Include application statistics and filtering options.
```

#### 15. **Application Review** (Detailed application view)
**Purpose**: Review individual applications in detail
**Key Elements**:
- Applicant profile summary
- Application details
- Decision-making tools
- Background check indicators

**Google Stitch Prompt**:
```
Create detailed application review interface with applicant profile card, application timeline, skill matching indicators, and decision buttons. Include verification status, rating displays, and communication tools. Use trust-building design elements and clear decision-making UI.
```

#### 16. **Application History** (Historical applications)
**Purpose**: View past applications and outcomes
**Key Elements**:
- Chronological list
- Outcome indicators
- Performance metrics
- Reapplication options

**Google Stitch Prompt**:
```
Design application history view with chronological timeline, outcome badges, performance metrics, and reapplication options. Use clear date organization, status indicators, and learning insights. Include success rate statistics and improvement suggestions.
```

---

### 💰 **Payment & Financial** (5 screens)

#### 17. **Payment Status Dashboard** (`/payments`)
**Purpose**: Overview of all payment activities
**Key Elements**:
- Earnings overview
- Payment history
- Pending payments
- Fee breakdown
- Tax reporting tools

**Google Stitch Prompt**:
```
Create a financial dashboard with earnings overview cards, payment history table, pending payments section, and fee breakdown charts. Use green for earnings, clear financial typography, and organized data presentation. Include export options and tax reporting tools.
```

#### 18. **Escrow Payment Flow** (Payment processing screens)
**Purpose**: Secure payment processing
**Key Elements**:
- Payment amount confirmation
- Escrow explanation
- Payment method selection
- Security indicators

**Google Stitch Prompt**:
```
Design secure payment flow with escrow explanation, payment amount confirmation, secure payment method selection, and trust indicators. Use security-focused design elements, clear fee breakdowns, and professional financial interface. Include progress indicators and security badges.
```

#### 19. **Payment History** (Detailed transaction view)
**Purpose**: Complete payment transaction history
**Key Elements**:
- Transaction timeline
- Filter and search
- Receipt generation
- Dispute options

**Google Stitch Prompt**:
```
Create comprehensive payment history with filterable transaction list, detailed transaction cards, receipt download options, and dispute buttons. Use clear financial formatting, date organization, and professional accounting-style layout. Include search and export functionality.
```

#### 20. **Stripe Onboarding** (KYC and bank setup)
**Purpose**: Financial account setup for helpers
**Key Elements**:
- KYC verification steps
- Bank account linking
- Identity verification
- Progress tracking

**Google Stitch Prompt**:
```
Design Stripe Connect onboarding flow with step-by-step verification, bank account setup, identity verification, and progress tracking. Use professional financial interface, clear security messaging, and Australian banking integration. Include help tooltips and progress indicators.
```

#### 21. **Fee Transparency** (Payment breakdown)
**Purpose**: Clear payment fee structure
**Key Elements**:
- Fee calculator
- Platform fee explanation
- Payment timing details
- Cost comparisons

**Google Stitch Prompt**:
```
Create transparent fee breakdown interface with interactive calculator, clear fee explanations, payment timing timeline, and cost comparison tools. Use honest, clear design with no hidden fees messaging. Include educational tooltips and fee structure charts.
```

---

### 📅 **Availability & Scheduling** (3 screens)

#### 22. **Availability Calendar** (`/availability`)
**Purpose**: Helper availability management
**Key Elements**:
- Weekly/monthly calendar view
- Time slot editing
- Recurring availability
- Location radius settings

**Google Stitch Prompt**:
```
Design an interactive availability calendar with weekly/monthly views, drag-to-edit time slots, recurring pattern options, and location radius settings. Use calendar UI patterns, clear time slot visualization, and easy editing interactions. Include availability patterns and booking status indicators.
```

#### 23. **Booking Confirmation** (When availability is booked)
**Purpose**: Confirm availability bookings
**Key Elements**:
- Booking details
- Tradie information
- Location confirmation
- Contact details

**Google Stitch Prompt**:
```
Create booking confirmation screen with clear booking details, tradie profile card, location map, and contact information. Use confirmation-focused design with clear details, success indicators, and next steps. Include calendar integration and reminder options.
```

#### 24. **Schedule Overview** (Helper's booked schedule)
**Purpose**: View upcoming bookings and commitments
**Key Elements**:
- Timeline view
- Job details
- Travel planning
- Conflict warnings

**Google Stitch Prompt**:
```
Design schedule overview with timeline visualization, job detail cards, travel time calculations, and conflict warnings. Use organized timeline layout, clear job information, and proactive scheduling assistance. Include travel optimization and calendar integration.
```

---

### 💬 **Communication** (4 screens)

#### 25. **Message Thread** (Job-specific messaging)
**Purpose**: Communication between tradie and helper
**Key Elements**:
- Chat interface
- Job context sidebar
- File sharing
- Status updates

**Google Stitch Prompt**:
```
Create job-focused messaging interface with chat thread, job context sidebar, file sharing capabilities, and status update integration. Use modern chat UI patterns, clear message bubbles, and professional messaging design. Include job information integration and file preview.
```

#### 26. **Messages Dashboard** (All conversations)
**Purpose**: Overview of all job-related communications
**Key Elements**:
- Conversation list
- Unread indicators
- Quick preview
- Search functionality

**Google Stitch Prompt**:
```
Design messaging dashboard with conversation list, unread message indicators, message previews, and search functionality. Use modern messaging app patterns, clear conversation organization, and efficient navigation. Include filtering and priority indicators.
```

#### 27. **Notification Center** (System notifications)
**Purpose**: All platform notifications and alerts
**Key Elements**:
- Notification categories
- Action items
- Read/unread states
- Settings links

**Google Stitch Prompt**:
```
Create notification center with categorized notifications, action buttons, read/unread states, and notification settings access. Use clear notification design patterns, priority indicators, and organized categorization. Include quick actions and notification management tools.
```

#### 28. **Communication Preferences** (Notification settings)
**Purpose**: Manage communication preferences
**Key Elements**:
- Channel selection (push, email, SMS)
- Frequency settings
- Category preferences
- Quiet hours

**Google Stitch Prompt**:
```
Design communication preferences interface with channel toggles, frequency settings, category preferences, and quiet hours scheduling. Use clear settings UI patterns, organized preference sections, and immediate preview options. Include explanation tooltips and testing features.
```

---

### ⭐ **Reviews & Trust** (5 screens)

#### 29. **Review System** (Post-job review)
**Purpose**: Rate and review after job completion
**Key Elements**:
- Star rating interface
- Comment text area
- Category-specific ratings
- Photo uploads

**Google Stitch Prompt**:
```
Create post-job review interface with 5-star rating system, comment text area, category-specific ratings (punctuality, quality, communication), and photo upload option. Use review-focused design with clear rating visualization and constructive feedback encouragement.
```

#### 30. **Reviews Display** (User profile reviews)
**Purpose**: Display reviews and ratings on profiles
**Key Elements**:
- Average rating display
- Review cards
- Rating distribution
- Response options

**Google Stitch Prompt**:
```
Design review display system with prominent average rating, individual review cards, rating distribution chart, and response options. Use trust-building design elements, clear rating visualization, and organized review presentation. Include filtering and sorting options.
```

#### 31. **Badge System** (Achievement display)
**Purpose**: Show earned badges and achievements
**Key Elements**:
- Badge collection display
- Achievement progress
- Badge descriptions
- Sharing options

**Google Stitch Prompt**:
```
Create achievement badge system with badge collection display, progress indicators, achievement descriptions, and social sharing options. Use gamification design elements, clear badge visualization, and motivational progress tracking. Include badge categories and earning criteria.
```

#### 32. **Trust & Safety** (Safety information hub)
**Purpose**: Platform safety information and tools
**Key Elements**:
- Safety guidelines
- Reporting tools
- Emergency contacts
- Insurance information

**Google Stitch Prompt**:
```
Design trust and safety hub with clear safety guidelines, easy reporting tools, emergency contact information, and insurance details. Use safety-focused design with clear warnings, helpful resources, and accessible reporting mechanisms. Include Australian safety standards information.
```

#### 33. **Dispute Resolution** (Dispute management)
**Purpose**: Handle disputes between users
**Key Elements**:
- Dispute form
- Evidence submission
- Status tracking
- Resolution options

**Google Stitch Prompt**:
```
Create dispute resolution interface with clear dispute form, evidence submission tools, status tracking timeline, and resolution options. Use professional mediation design, clear process explanation, and organized documentation submission. Include communication with admin team.
```

---

### 🔧 **Administrative** (6 screens)

#### 34. **Enhanced Admin Dashboard** (`/admin`)
**Purpose**: Comprehensive platform administration
**Key Elements**:
- Multi-tab interface with 10 sections
- Analytics and metrics
- User management
- System health monitoring

**Google Stitch Prompt**:
```
Design comprehensive admin dashboard with 10-tab interface covering overview, users, jobs, payments, disputes, support, analytics, badges, fraud, and system health. Use professional admin UI patterns, clear data visualization, and efficient navigation. Include real-time metrics and quick action tools.
```

#### 35. **User Management** (Admin user oversight)
**Purpose**: Manage platform users
**Key Elements**:
- User search and filtering
- Account status management
- Verification tools
- Communication options

**Google Stitch Prompt**:
```
Create user management interface with searchable user list, account status controls, verification management, and admin communication tools. Use organized admin table design, clear user information display, and efficient user management actions. Include bulk operations and user analytics.
```

#### 36. **Support Ticket System** (Admin support management)
**Purpose**: Handle user support requests
**Key Elements**:
- Ticket queue
- Priority management
- Response tools
- Resolution tracking

**Google Stitch Prompt**:
```
Design support ticket system with priority queue, ticket assignment, response tools, and resolution tracking. Use help desk UI patterns, clear priority indicators, and efficient ticket management workflow. Include response templates and escalation options.
```

#### 37. **Analytics Dashboard** (Platform metrics)
**Purpose**: Platform performance analytics
**Key Elements**:
- Key metrics overview
- Charts and graphs
- Trend analysis
- Export options

**Google Stitch Prompt**:
```
Create analytics dashboard with key performance indicators, interactive charts, trend analysis, and data export options. Use professional data visualization, clear metrics presentation, and actionable insights layout. Include comparative analysis and forecasting tools.
```

#### 38. **Fraud Detection** (Security monitoring)
**Purpose**: Monitor and manage security issues
**Key Elements**:
- Alert dashboard
- Investigation tools
- User flagging
- Pattern analysis

**Google Stitch Prompt**:
```
Design fraud detection interface with alert dashboard, investigation tools, user flagging system, and pattern analysis visualization. Use security-focused design with clear alert indicators, investigation workflow, and fraud prevention tools. Include automated detection and manual review options.
```

#### 39. **System Settings** (Platform configuration)
**Purpose**: Configure platform-wide settings
**Key Elements**:
- Feature toggles
- Configuration options
- Maintenance mode
- System health checks

**Google Stitch Prompt**:
```
Create system settings interface with feature toggles, configuration panels, maintenance mode controls, and system health monitoring. Use admin configuration design patterns, clear setting organization, and change tracking. Include testing tools and rollback options.
```

---

### 📱 **Mobile-Specific Screens** (4 screens)

#### 40. **Mobile Navigation** (Bottom tab navigation)
**Purpose**: Mobile-optimized navigation
**Key Elements**:
- Bottom tab bar
- Role-specific tabs
- Badge indicators
- Quick actions

**Google Stitch Prompt**:
```
Design mobile bottom navigation with role-specific tabs, notification badges, and quick action buttons. Use mobile-first design patterns, clear tab icons, and efficient mobile navigation. Include contextual quick actions and notification indicators.
```

#### 41. **Mobile Job Cards** (Optimized job display)
**Purpose**: Mobile-friendly job listing
**Key Elements**:
- Compact information display
- Swipe actions
- Quick apply
- Location indicators

**Google Stitch Prompt**:
```
Create mobile-optimized job cards with compact information display, swipe actions, quick apply buttons, and clear location indicators. Use mobile card design patterns, efficient information hierarchy, and touch-friendly interactions. Include job urgency indicators and distance display.
```

#### 42. **Mobile Profile** (Touch-optimized profile)
**Purpose**: Mobile profile management
**Key Elements**:
- Touch-friendly form inputs
- Photo capture/upload
- Simplified navigation
- Quick actions

**Google Stitch Prompt**:
```
Design mobile profile interface with touch-optimized form inputs, camera integration, simplified navigation, and quick action buttons. Use mobile form patterns, efficient photo handling, and streamlined profile management. Include gesture-based interactions and mobile-specific features.
```

#### 43. **Mobile Payment** (Mobile payment flow)
**Purpose**: Mobile-optimized payment processing
**Key Elements**:
- Touch-friendly payment forms
- Mobile wallet integration
- Security indicators
- Receipt viewing

**Google Stitch Prompt**:
```
Create mobile payment interface with touch-optimized payment forms, mobile wallet integration, clear security indicators, and easy receipt access. Use mobile payment UI patterns, secure form design, and efficient payment processing. Include mobile-specific payment methods and quick payment options.
```

---

### 🔄 **Workflow-Specific Screens** (5 screens)

#### 44. **Onboarding Flow** (Multi-step user setup)
**Purpose**: Guide new users through platform setup
**Key Elements**:
- Step-by-step progression
- Role selection
- Profile completion
- Tutorial elements

**Google Stitch Prompt**:
```
Design comprehensive onboarding flow with step progression, role selection, profile completion, and tutorial elements. Use onboarding UI patterns, clear progress indicators, and engaging tutorial design. Include skip options and help resources.
```

#### 45. **Job Matching** (AI-powered job recommendations)
**Purpose**: Intelligent job matching for helpers
**Key Elements**:
- Match percentage indicators
- Recommendation reasons
- Quick actions
- Feedback options

**Google Stitch Prompt**:
```
Create intelligent job matching interface with match percentage indicators, recommendation explanations, quick action buttons, and feedback collection. Use recommendation UI patterns, clear matching criteria display, and learning algorithm integration. Include preference refinement tools.
```

#### 46. **Emergency Contact** (Safety-first emergency features)
**Purpose**: Emergency contact and safety features
**Key Elements**:
- Emergency contact buttons
- Location sharing
- Safety check-ins
- Emergency information

**Google Stitch Prompt**:
```
Design emergency safety interface with prominent emergency contact buttons, location sharing controls, safety check-in features, and emergency information display. Use safety-focused design with clear emergency indicators, quick access patterns, and reliable emergency communication tools.
```

#### 47. **Referral Program** (User referral system)
**Purpose**: Manage user referrals and rewards
**Key Elements**:
- Referral code sharing
- Reward tracking
- Invitation tools
- Progress visualization

**Google Stitch Prompt**:
```
Create referral program interface with easy code sharing, reward tracking, invitation tools, and progress visualization. Use engagement-focused design with clear reward displays, social sharing integration, and motivational progress tracking. Include referral success metrics and bonus opportunities.
```

#### 48. **Offline Mode** (Offline functionality)
**Purpose**: Limited functionality when offline
**Key Elements**:
- Offline indicators
- Cached information
- Sync status
- Limited actions

**Google Stitch Prompt**:
```
Design offline mode interface with clear offline indicators, cached information display, sync status monitoring, and available offline actions. Use offline-first design patterns, clear connectivity indicators, and graceful degradation. Include sync progress and offline data management.
```

---

## 📊 **Screen Priority Classification**

### **🔥 High Priority** (Must-have for MVP)
1. Auth Landing Page
2. Tradie Dashboard
3. Helper Dashboard
4. Job Post Form
5. Job Feed
6. Applications List
7. Payment Status Dashboard
8. Profile Edit Page
9. Mobile Navigation
10. Mobile Job Cards

### **🟡 Medium Priority** (Important for user experience)
11. Terms and Conditions Modal
12. Job Details View
13. Message Thread
14. Review System
15. Availability Calendar
16. Enhanced Admin Dashboard
17. Payment History
18. Mobile Profile
19. Profile Completion Screen
20. Dispute Resolution

### **🟢 Low Priority** (Nice-to-have features)
21. Badge System
22. Analytics Dashboard
23. Fraud Detection
24. Referral Program
25. Emergency Contact
26. All remaining screens

---

## 🎨 **Design System Requirements**

### Color Palette
- **Primary Blue**: #2563EB (buttons, headers, links)
- **Success Green**: #16A34A (earnings, success states)
- **Warning Orange**: #EA580C (urgent jobs, warnings)
- **Error Red**: #DC2626 (errors, disputes)
- **Neutral Gray**: #6B7280 (text, backgrounds)

### Typography Scale
- **Headings**: 32px, 24px, 20px, 18px
- **Body**: 16px (base), 14px (small)
- **Captions**: 12px
- **Line Heights**: 1.5 for body, 1.2 for headings

### Component Patterns
- **Cards**: Rounded corners (8px), subtle shadows
- **Buttons**: Primary (blue), Secondary (white/gray), Success (green)
- **Forms**: Clear labels, validation states, helpful hints
- **Navigation**: Clean, role-based, mobile-responsive
- **Data Display**: Tables, cards, charts with clear hierarchy

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

---

## 🔍 **User Experience Priorities**

### Trust & Safety First
- Clear verification indicators
- Prominent safety features
- Transparent payment processes
- Easy dispute resolution

### Mobile-First Design
- Touch-friendly interfaces
- Optimized for on-site use
- Offline functionality
- Quick actions

### Australian Context
- Local terminology and currency
- Compliance with AU regulations
- Cultural design preferences
- Regional job market understanding

### Performance
- Fast loading screens
- Efficient data usage
- Smooth interactions
- Reliable offline mode

---

## 🚀 **Implementation Notes**

### Technical Considerations
- All screens must be responsive (mobile-first)
- Components should be reusable across screens
- Accessibility standards (WCAG 2.1 AA)
- Performance optimization for mobile networks
- Progressive Web App (PWA) capabilities

### Content Requirements
- Australian English spelling and terminology
- Safety-first messaging throughout
- Clear, jargon-free language
- Cultural sensitivity for diverse users
- Legal compliance messaging

### Integration Points
- Supabase database integration
- Stripe payment processing
- Google Maps for location services
- Push notification systems
- File upload and management
- Real-time messaging capabilities

---

This comprehensive design requirement document covers all 48+ screens needed for the TradieHelper platform, prioritized by importance and ready for Google Stitch AI UI generation. Each screen includes specific design requirements, key elements, and targeted prompts for optimal AI-generated designs.