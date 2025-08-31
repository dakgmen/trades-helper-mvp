import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Test user credentials
const TEST_USERS = {
  tradie: {
    email: 'tradie.test@example.com',
    password: 'testpassword123',
    role: 'tradie' as const,
    profile: {
      full_name: 'Test Tradie',
      phone: '+61412345678'
    }
  },
  helper: {
    email: 'helper.test@example.com', 
    password: 'testpassword123',
    role: 'helper' as const,
    profile: {
      full_name: 'Test Helper',
      phone: '+61423456789',
      skills: ['site-prep', 'material-handling', 'cleaning']
    }
  },
  admin: {
    email: 'admin.test@example.com',
    password: 'testpassword123', 
    role: 'admin' as const,
    profile: {
      full_name: 'Test Admin',
      phone: '+61434567890'
    }
  }
}

setup('seed database with test data', async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.log('Skipping database setup - environment variables not available')
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'set' : 'not set')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'not set')
    return
  }
  
  try {
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Testing Supabase connection...')
    
    // Test basic connection first
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.log('Database connection test failed:', error.message)
      console.log('Proceeding with frontend-only tests...')
      return
    }
    
    console.log('Database connection successful!')
    console.log('Setting up test data...')
    
    // Clean up existing test data
    try {
      await supabase.from('profiles').delete().ilike('email', '%.test@example.com')
      console.log('Cleaned up existing test data')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_cleanupError) {
      console.log('Note: Could not clean up existing data, may be first run')
    }
    
    // Create test users
    for (const [userType, userData] of Object.entries(TEST_USERS)) {
      console.log(`Creating test ${userType}...`)
      
      try {
        // Try to create auth user (may already exist)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        })

        if (authError && !authError.message.includes('already exists')) {
          console.error(`Error creating ${userType} auth:`, authError.message)
          continue
        }

        const userId = authUser?.user?.id
        if (!userId) {
          // Try to get existing user
          const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email)
          if (existingUser?.user?.id) {
            console.log(`Using existing ${userType} user`)
          } else {
            console.error(`Could not get user ID for ${userType}`)
            continue
          }
        }

        // Create or update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            role: userData.role,
            ...userData.profile,
            verified: userType === 'helper' ? true : false, // Pre-verify helper for testing
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error(`Error creating ${userType} profile:`, profileError.message)
        } else {
          console.log(`✓ Created/updated test ${userType}: ${userData.email}`)
        }
      } catch (error) {
        console.error(`Failed to create ${userType}:`, error)
      }
    }

    // Create sample job for testing
    try {
      const { data: tradieAuth } = await supabase.auth.admin.getUserByEmail(TEST_USERS.tradie.email)
      if (tradieAuth?.user) {
        const { error: jobError } = await supabase
          .from('jobs')
          .upsert({
            tradie_id: tradieAuth.user.id,
            title: 'Test Site Cleanup Job',
            description: 'Clean up construction debris and materials',
            location: 'Sydney, NSW',
            date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            duration_hours: 6,
            pay_rate: 35.00,
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (!jobError) {
          console.log('✓ Created sample job')
        } else {
          console.log('Note: Could not create sample job:', jobError.message)
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_jobError) {
      console.log('Note: Could not create sample job, may be schema issue')
    }

    console.log('Database seeding completed')
    
  } catch (error) {
    console.error('Database setup failed:', error)
    console.log('Proceeding with frontend-only tests...')
  }
})