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



// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Disable Next.js automatic body parsing for Stripe
export const config = { api: { bodyParser: false } };

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Utility to convert ReadableStream to Buffer
async function buffer(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) return Buffer.from([]); // safe for null body
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done ?? false;
    if (result.value) chunks.push(result.value);
  }
  return Buffer.concat(chunks);
}

// POST handler for Stripe webhook
export async function POST(req: NextRequest) {
  try {
    const buf = await buffer(req.body);
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      console.error('❌ Stripe signature missing');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
      console.log('⚡ Stripe event received:', event.type);
    } catch (err: any) {
      console.error('❌ Invalid Stripe signature:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle successful checkout session
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const productId = session.metadata?.productId;
      const sellerId = session.metadata?.sellerId;
      const buyerEmail = session.metadata?.buyerEmail;

      if (!productId || !sellerId || !buyerEmail) {
        console.warn('⚠️ Missing metadata, skipping transaction');
        return NextResponse.json({ received: true });
      }

      // Fetch product and seller info
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, profiles!inner(id, email, full_name, stripe_account_id)')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('❌ Product fetch error:', productError);
        return NextResponse.json({ received: true });
      }

      const seller = product.profiles as any;
      const totalAmount = (session.amount_total || 0) / 100;
      const platformFee = totalAmount * 0.1;
      const sellerAmount = totalAmount - platformFee;

      // Fetch buyer profile
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', buyerEmail)
        .single();

      if (buyerError || !buyerProfile) {
        console.error('❌ Buyer not found:', buyerError);
        return NextResponse.json({ received: true });
      }

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
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

      if (txError) console.error('❌ Transaction insert error:', txError);
      else console.log('✅ Transaction saved successfully');
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('💥 Webhook failed:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// Block GET requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
