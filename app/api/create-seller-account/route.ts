import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { userId, email } = await request.json();

    console.log('📩 Incoming request:', { userId, email });

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // 1️⃣ Create Stripe Express account
    console.log('🔹 Creating Stripe connected account...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Change dynamically if needed
      email: email,
    });
    console.log('✅ Stripe account created:', account.id);

    // 2️⃣ Generate Stripe onboarding link
    console.log('🔹 Creating Stripe onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success`,
      type: 'account_onboarding',
    });
    console.log('✅ Onboarding link created:', accountLink.url);

    // 3️⃣ Store stripe_account_id in Supabase
    console.log('🔹 Updating Supabase with stripe_account_id...');
    const { data, error } = await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    console.log('✅ Supabase updated:', data);

    return NextResponse.json({
      success: true,
      message: 'Seller account created successfully!',
      stripeAccountId: account.id,
      onboardingUrl: accountLink.url, // Send this to the frontend
    });
  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
