import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// For Stripe webhooks - raw body needed
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// For other routes - JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tradie Helper API is running' });
});

// Stripe Connect Account Creation
app.post('/api/stripe/create-connect-account', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'AU',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId: userId
      }
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/payments?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/payments?success=true`,
      type: 'account_onboarding',
    });

    // Save account ID to database
    await supabase
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    res.json({ 
      url: accountLink.url,
      accountId: account.id 
    });

  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create Connect account' 
    });
  }
});

// Get Connect Account Status
app.get('/api/stripe/connect-account/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's Stripe account ID from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (error || !profile?.stripe_account_id) {
      return res.status(404).json({ error: 'No Stripe account found for user' });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    res.json({
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      }
    });

  } catch (error) {
    console.error('Error fetching account status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch account status' 
    });
  }
});

// Create Escrow Payment Intent
app.post('/api/stripe/create-escrow-payment', async (req, res) => {
  try {
    const { jobId, amount } = req.body;

    if (!jobId || !amount) {
      return res.status(400).json({ error: 'Job ID and amount are required' });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, tradie:profiles!jobs_tradie_id_fkey(stripe_account_id)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!job.tradie?.stripe_account_id) {
      return res.status(400).json({ error: 'Tradie has not set up payments' });
    }

    // Create payment intent with application fee
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'aud',
      application_fee_amount: Math.round(amount * 0.05 * 100), // 5% platform fee
      transfer_data: {
        destination: job.tradie.stripe_account_id,
      },
      metadata: {
        jobId: jobId,
        type: 'escrow_payment'
      }
    });

    // Create payment record in database
    await supabase
      .from('payments')
      .insert({
        job_id: jobId,
        tradie_id: job.tradie_id,
        helper_id: job.assigned_helper_id,
        amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
      });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating escrow payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create escrow payment' 
    });
  }
});

// Release Escrow Payment
app.post('/api/stripe/release-escrow', async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Get payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'held') {
      return res.status(400).json({ error: 'Payment is not in escrow' });
    }

    // Capture the payment intent (this releases the funds)
    await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    res.json({ success: true });

  } catch (error) {
    console.error('Error releasing escrow payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to release escrow payment' 
    });
  }
});

// Refund Escrow Payment
app.post('/api/stripe/refund-escrow', async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Get payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      reason: reason || 'requested_by_customer',
    });

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    res.json({ 
      success: true,
      refundId: refund.id 
    });

  } catch (error) {
    console.error('Error refunding escrow payment:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to refund escrow payment' 
    });
  }
});

// Stripe Webhook Handler
app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentIntentFailed(failedPayment);
        break;

      case 'account.updated':
        const account = event.data.object;
        await handleAccountUpdated(account);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handler functions
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const { data: payment } = await supabase
      .from('payments')
      .update({ 
        status: 'held', // Payment succeeded but funds are held in escrow
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (payment) {
      // Update job status
      await supabase
        .from('jobs')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.job_id);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    await supabase
      .from('payments')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleAccountUpdated(account) {
  try {
    const userId = account.metadata?.userId;
    if (userId) {
      await supabase
        .from('profiles')
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

// File Upload Endpoints
app.post('/api/upload/:category', upload.single('file'), async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedCategories = ['profile_image', 'white_card', 'id_document', 'job_image', 'other'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid file category' });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}/${category}/${Date.now()}${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        user_id: userId,
        filename: req.file.originalname,
        file_path: uploadData.path,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        category,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from('user-files').remove([fileName]);
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ 
      success: true, 
      fileUpload: fileRecord 
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: error.message || 'File upload failed' 
    });
  }
});

// Get file URL
app.get('/api/files/:fileId/url', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.headers['user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    // Get file record
    const { data: fileRecord, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (error || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create signed URL (valid for 1 hour)
    const { data, error: urlError } = await supabase.storage
      .from('user-files')
      .createSignedUrl(fileRecord.file_path, 3600);

    if (urlError) {
      return res.status(500).json({ error: urlError.message });
    }

    res.json({ 
      url: data.signedUrl 
    });

  } catch (error) {
    console.error('Error getting file URL:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get file URL' 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Tradie Helper API server running on port ${PORT}`);
});