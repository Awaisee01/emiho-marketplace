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

// ------------------- Stripe & Supabase Setup -------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30' as any, // Latest Stripe API version
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
export const runtime = 'edge';

// ------------------- Webhook Handler -------------------
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Read raw body as Uint8Array (Edge-compatible)
    const rawBody = new Uint8Array(await request.arrayBuffer()) as any;

    // 2️⃣ Get Stripe signature header
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ No Stripe signature header found');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // 3️⃣ Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      console.log('✅ Stripe webhook verified:', event.type);
    } catch (err: any) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 4️⃣ Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const productId = session.metadata?.productId;
        const sellerId = session.metadata?.sellerId;
        const buyerEmail = session.metadata?.buyerEmail;

        if (!productId || !sellerId || !buyerEmail) {
          console.warn('⚠️ Missing metadata in session:', session.metadata);
          return NextResponse.json({ received: true });
        }

        // 5️⃣ Fetch product with seller profile
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*, profiles!inner(id, email, full_name, stripe_account_id)')
          .eq('id', productId)
          .single();

        if (productError || !product) {
          console.error('❌ Product not found:', productError);
          return NextResponse.json({ received: true });
        }

        const seller = product.profiles as any;
        const totalAmount = (session.amount_total || 0) / 100;
        const platformFee = totalAmount * 0.1;
        const sellerAmount = totalAmount * 0.9;

        // 6️⃣ Find buyer profile
        const { data: buyerProfile, error: buyerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', buyerEmail)
          .single();

        if (buyerError || !buyerProfile) {
          console.error('❌ Buyer profile not found:', buyerError);
          return NextResponse.json({ received: true });
        }

        // 7️⃣ Insert transaction
        const { error: transactionError } = await supabase.from('transactions').insert({
          product_id: productId,
          buyer_id: buyerProfile.id,
          seller_id: sellerId,
          stripe_payment_intent_id: session.payment_intent as string,
          total_amount: totalAmount,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'completed',
          buyer_email: buyerEmail,
        });

        if (transactionError) console.error('❌ Transaction insert failed:', transactionError);
        else console.log('✅ Transaction inserted successfully');

        break;
      }

      case 'payment_intent.succeeded':
        console.log('💰 Payment succeeded:', event.data.object);
        break;

      case 'charge.succeeded':
        console.log('💳 Charge succeeded:', event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // 8️⃣ Return 200 to Stripe
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('💥 Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook failed', message: error.message }, { status: 500 });
  }
}
