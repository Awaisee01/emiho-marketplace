import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

console.log('✅ /api/create-payment route file loaded');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  console.log('📩 Incoming POST request to /api/create-payment');

  try {
    const { productId, buyerEmail } = await request.json();
    console.log('🧾 Request body:', { productId, buyerEmail });

    if (!productId || !buyerEmail) {
      return NextResponse.json(
        { success: false, error: '❌ Missing productId or buyerEmail' },
        { status: 400 }
      );
    }

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .maybeSingle();

    console.log('🧩 Product query result:', { product, productError });

    if (productError || !product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Fetch seller info
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('id, full_name, email, stripe_account_id')
      .eq('id', product.seller_id)
      .single();

    console.log('👤 Seller query result:', { seller, sellerError });

    if (sellerError || !seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 });
    }

    if (!seller.stripe_account_id) {
      return NextResponse.json(
        { success: false, error: 'Seller does not have a connected Stripe account.' },
        { status: 400 }
      );
    }

    // Calculate amount + fee
    const amount = Math.round(product.price * 100);
    const platformFee = Math.round(amount * 0.1); // 10%

    console.log('💰 Payment split:', {
      total: amount,
      platformFee,
      sellerGets: amount - platformFee,
    });

    // ✅ Create Checkout Session with transfer
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description || '',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace`,
      metadata: {
        productId: product.id,
        sellerId: product.seller_id,
        buyerEmail,
        sellerEmail: seller.email,
        sellerName: seller.full_name,
      },
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: seller.stripe_account_id, // Send remaining to seller
        },
      },
    });

    console.log('✅ Stripe Checkout Session created:', session.id);

    return NextResponse.json({
      success: true,
      message: 'Stripe Checkout session created successfully!',
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('💥 Error in create-payment route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🌐 GET request received at /api/create-payment');
  return NextResponse.json({
    success: true,
    message: '✅ /api/create-payment endpoint is working!',
  });
}
