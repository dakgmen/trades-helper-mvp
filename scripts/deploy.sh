#!/bin/bash

# Tradie Helper Deployment Script
# Deploys frontend to Vercel and backend to Railway

set -e  # Exit on any error

echo "🚀 Starting Tradie Helper Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
        exit 1
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}⚠️  Railway CLI not found. Install with: npm i -g @railway/cli${NC}"
        echo "   Backend deployment will be skipped."
        SKIP_BACKEND=true
    fi
    
    echo -e "${GREEN}✅ Dependencies check completed${NC}"
}

# Validate environment variables
validate_env() {
    echo "🔧 Validating environment variables..."
    
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ .env.production file not found${NC}"
        echo "   Create .env.production with production environment variables"
        exit 1
    fi
    
    # Check required variables exist in .env.production
    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_STRIPE_PUBLISHABLE_KEY")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.production; then
            echo -e "${RED}❌ Missing required variable: ${var}${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Environment validation completed${NC}"
}

# Build and test the application
build_and_test() {
    echo "🏗️  Building and testing application..."
    
    # Install dependencies
    npm install
    
    # Run type checking
    echo "📝 Running TypeScript checks..."
    npm run typecheck
    
    # Run linting
    echo "🧹 Running ESLint..."
    npm run lint
    
    # Run tests if they exist
    if grep -q '"test"' package.json; then
        echo "🧪 Running tests..."
        npm run test:run
    fi
    
    # Build the application
    echo "📦 Building application..."
    npm run build:prod
    
    echo -e "${GREEN}✅ Build and test completed${NC}"
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo "🌐 Deploying frontend to Vercel..."
    
    # Deploy to Vercel
    if [ "$1" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    echo -e "${GREEN}✅ Frontend deployment completed${NC}"
}

# Deploy backend to Railway
deploy_backend() {
    if [ "$SKIP_BACKEND" = true ]; then
        echo -e "${YELLOW}⚠️  Skipping backend deployment (Railway CLI not found)${NC}"
        return
    fi
    
    echo "⚙️  Deploying backend to Railway..."
    
    # Change to API directory
    cd api
    
    # Deploy to Railway
    if [ "$1" = "production" ]; then
        railway up --environment production
    else
        railway up
    fi
    
    cd ..
    
    echo -e "${GREEN}✅ Backend deployment completed${NC}"
}

# Setup database (if needed)
setup_database() {
    echo "🗄️  Setting up database..."
    
    echo "📋 Database schema and RLS policies should be applied manually:"
    echo "   1. Run docs/database-schema.sql in Supabase SQL Editor"
    echo "   2. Run docs/rls-policies.sql in Supabase SQL Editor"  
    echo "   3. Run docs/storage-setup.sql in Supabase SQL Editor"
    
    echo -e "${GREEN}✅ Database setup instructions provided${NC}"
}

# Post-deployment verification
verify_deployment() {
    echo "✅ Verifying deployment..."
    
    # Get deployment URLs (this would need to be customized based on actual domains)
    echo "🌐 Deployment URLs:"
    echo "   Frontend: Check Vercel dashboard for URL"
    echo "   Backend:  Check Railway dashboard for URL"
    
    echo "🔍 Manual verification steps:"
    echo "   1. Test user registration and login"
    echo "   2. Test job posting functionality"
    echo "   3. Test Stripe Connect account creation"
    echo "   4. Test file upload functionality"
    echo "   5. Test payment flow (with test cards)"
    
    echo -e "${GREEN}✅ Verification checklist provided${NC}"
}

# Main deployment flow
main() {
    local environment="${1:-staging}"
    
    echo "🎯 Deploying to: $environment"
    
    check_dependencies
    validate_env
    build_and_test
    
    deploy_frontend "$environment"
    deploy_backend "$environment"
    
    setup_database
    verify_deployment
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update environment variables in Vercel and Railway dashboards"
    echo "   2. Configure custom domains if needed"
    echo "   3. Set up monitoring and alerts"
    echo "   4. Configure Stripe webhooks with production URLs"
}

# Handle script arguments
case "${1:-help}" in
    "production")
        main "production"
        ;;
    "staging")
        main "staging"
        ;;
    "help"|*)
        echo "Tradie Helper Deployment Script"
        echo ""
        echo "Usage:"
        echo "  ./scripts/deploy.sh staging     - Deploy to staging environment"
        echo "  ./scripts/deploy.sh production  - Deploy to production environment"
        echo "  ./scripts/deploy.sh help        - Show this help message"
        echo ""
        echo "Prerequisites:"
        echo "  - Vercel CLI installed and authenticated"
        echo "  - Railway CLI installed and authenticated"
        echo "  - .env.production file configured"
        echo ""
        ;;
esac