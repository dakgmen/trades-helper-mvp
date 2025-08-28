# TradieHelper MVP

A two-sided marketplace connecting tradies with reliable helpers for short-term tasks. Built with React, TypeScript, Supabase, and Stripe Connect.

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables: Copy `.env` and configure Supabase keys
3. Run database migrations in Supabase
4. Start development server: `npm run dev`

## Features Implemented

✅ **Authentication System**
- User signup/login with Supabase Auth
- Role-based access (tradie/helper/admin)
- Protected routes and role checking

✅ **User Profiles**
- Profile management with role-specific fields
- Skills selection for helpers
- Document upload placeholders (White Card, ID)
- Verification status tracking

✅ **Job Management**
- Job posting for tradies with validation
- Job feed with search and filters
- Real-time job updates
- Job status tracking (open → assigned → completed)

✅ **Application Workflow**
- Helper job applications
- Tradie application review and acceptance
- Automatic job assignment and payment creation
- Application status updates

✅ **Payment System**
- Escrow payment tracking
- Payment status management
- Integration ready for Stripe
- Payment release workflow

✅ **Messaging System**
- Real-time job-based messaging
- Message threads between tradie and helper
- Auto-scroll and message timestamps

✅ **Admin Features**
- Helper verification workflow
- User management dashboard
- Platform analytics
- Admin action audit trail

✅ **Mobile-Responsive Design**
- Tailwind CSS styling
- Mobile-optimized components
- Responsive navigation

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS + @tailwindcss/forms
- **State Management**: React Context + hooks
- **Database**: PostgreSQL with Row Level Security
- **Real-time**: Supabase subscriptions

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, signup, protected routes
│   ├── profile/       # Profile management
│   ├── jobs/          # Job posting, feed, cards
│   ├── applications/  # Application workflow
│   ├── payments/      # Payment status and management
│   ├── messages/      # Real-time messaging
│   └── admin/         # Admin dashboard
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── services/          # API services and business logic
├── types/             # TypeScript type definitions
└── lib/               # Supabase client configuration

supabase/
└── migrations/        # Database schema and policies
```

## Next Steps for Production

1. **Complete Stripe Integration**: Add server-side Stripe webhook handling
2. **File Upload**: Implement Supabase Storage for documents
3. **Push Notifications**: Add real-time notifications
4. **Geolocation**: Add distance-based job matching  
5. **Testing**: Add comprehensive test suite
6. **Performance**: Optimize bundle size and loading
7. **SEO**: Add meta tags and sitemap

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint code checking

Built with SPARC methodology using claude-flow agents.
