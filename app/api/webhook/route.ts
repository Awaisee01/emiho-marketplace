// import { NextRequest, NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient } from '@supabase/supabase-js';

// // ✅ Initialize Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20' as any,
// });

// // ✅ Initialize Supabase
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// // ✅ Handle Stripe Webhook Events
// export async function POST(request: NextRequest) {
//   try {
//     // Stripe requires the raw body
//     const body = await request.text();
//     const signature = request.headers.get('stripe-signature');

//     if (!signature)
//       return NextResponse.json({ error: 'No signature provided' }, { status: 400 });

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
//     } catch (err: any) {
//       console.error('❌ Invalid Stripe signature:', err.message);
//       return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
//     }

//     // ✅ Handle successful checkout session
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;

//       const productId = session.metadata?.productId;
//       const sellerId = session.metadata?.sellerId;
//       const buyerEmail = session.metadata?.buyerEmail;

//       console.log('💬 Webhook metadata:', { productId, sellerId, buyerEmail });

//       if (!productId || !sellerId || !buyerEmail)
//         return NextResponse.json({ received: true });

//       // ✅ Fetch product with seller profile
//       const { data: product } = await supabase
//         .from('products')
//         .select('*, profiles!inner(id, email, full_name, stripe_account_id)')
//         .eq('id', productId)
//         .single();

//       if (!product) return NextResponse.json({ received: true });

//       const seller = product.profiles as any;
//       const totalAmount = (session.amount_total || 0) / 100;
//       const platformFee = totalAmount * 0.1;
//       const sellerAmount = totalAmount * 0.9;

//       // ✅ Find buyer profile
//       const { data: buyerProfile } = await supabase
//         .from('profiles')
//         .select('id')
//         .eq('email', buyerEmail)
//         .single();

//       if (!buyerProfile) return NextResponse.json({ received: true });

//       // ✅ Save transaction
//       const { error: transactionError } = await supabase.from('transactions').insert({
//         product_id: productId,
//         buyer_id: buyerProfile.id,
//         seller_id: sellerId,
//         stripe_payment_intent_id: session.payment_intent as string,
//         total_amount: totalAmount,
//         platform_fee: platformFee,
//         seller_amount: sellerAmount,
//         status: 'completed',
//         buyer_email: buyerEmail,
//       });

//       if (transactionError)
//         console.error('❌ Error inserting transaction:', transactionError);
//       else console.log('✅ Transaction inserted successfully');
//     }

//     return NextResponse.json({ received: true });
//   } catch (error: any) {
//     console.error('💥 Webhook error:', error);
//     return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
//   }
// }






import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ✅ Use Node.js runtime for better compatibility
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received');
  
  try {
    // ✅ Get raw body as buffer
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('❌ No signature in headers');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    
    try {
      // ✅ Verify signature
      event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);
      console.log('✅ Webhook signature verified:', event.type);
    } catch (err: any) {
      console.error('❌ Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ✅ Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { productId, sellerId, buyerEmail } = session.metadata || {};

      console.log('📦 Processing checkout session:', {
        sessionId: session.id,
        productId,
        sellerId,
        buyerEmail,
        amount: session.amount_total,
      });

      if (!productId || !sellerId || !buyerEmail) {
        console.warn('⚠️ Missing required metadata in session');
        return NextResponse.json({ received: true });
      }

      // Fetch buyer profile
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', buyerEmail)
        .single();

      if (buyerError || !buyerProfile) {
        console.error('❌ Buyer profile not found:', buyerError);
        return NextResponse.json({ received: true });
      }

      // Calculate amounts
      const totalAmount = (session.amount_total || 0) / 100;
      const platformFee = totalAmount * 0.1;
      const sellerAmount = totalAmount * 0.9;

      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          product_id: productId,
          buyer_id: buyerProfile.id,
          seller_id: sellerId,
          stripe_payment_intent_id: session.payment_intent as string,
          total_amount: totalAmount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'completed',
          buyer_email: buyerEmail,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Error inserting transaction:', transactionError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log('✅ Transaction created:', transaction.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('💥 Webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  });
}