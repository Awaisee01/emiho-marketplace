// import { NextResponse } from "next/server";
// import Stripe from "stripe";
// import { createClient } from "@supabase/supabase-js";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2024-06-20" as any,
// });

// // ✅ Supabase client setup
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL || "",
//   process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
//   {
//     auth: { autoRefreshToken: false, persistSession: false },
//   }
// );

// export async function POST(req: Request) {
//   try {
//     const { session_id } = await req.json();
//     console.log("📩 /api/fetch-purchased-product called with:", { session_id });

//     if (!session_id)
//       return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

//     // 🧩 Retrieve session from Stripe
//     const session = await stripe.checkout.sessions.retrieve(session_id, {
//       expand: ["line_items.data.price.product"],
//     });

//     console.log("🧾 Stripe session retrieved successfully:", {
//       id: session.id,
//       customer_email: session.customer_email,
//       metadata: session.metadata,
//     });

//     const productId = session.metadata?.productId;

//     if (!productId) {
//       console.error("❌ No productId found in session metadata");
//       return NextResponse.json(
//         { error: "Missing productId in session metadata" },
//         { status: 400 }
//       );
//     }

//     // 🛒 Fetch the purchased product from Supabase
//     const { data: product, error: productError } = await supabase
//       .from("products")
//       .select("*")
//       .eq("id", productId)
//       .single();

//     if (productError || !product) {
//       console.error("❌ Supabase product fetch error:", productError);
//       return NextResponse.json(
//         { error: "Product not found in Supabase" },
//         { status: 404 }
//       );
//     }

//     console.log("✅ Product fetched successfully from Supabase:", product.title);

//     // ✅ Return full product details
//     return NextResponse.json({
//       success: true,
//       product: {
//         id: product.id,
//         title: product.title,
//         description: product.description,
//         media_urls: product.media_urls,
//         media_type: product.media_type,
//         price: product.price,
//       },
//     });
//   } catch (error: any) {
//     console.error("💥 Error in /api/fetch-purchased-product:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    console.log("📩 /api/fetch-purchased-product called:", { session_id });

    if (!session_id)
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    // 🧾 Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (!session || session.payment_status !== "paid") {
      console.error("❌ Payment not verified for session:", session_id);
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    const { productId, sellerId, buyerEmail } = session.metadata || {};
    if (!productId || !sellerId || !buyerEmail) {
      console.error("❌ Missing metadata in Stripe session");
      return NextResponse.json(
        { success: false, error: "Missing metadata" },
        { status: 400 }
      );
    }

    // 👤 Fetch buyer profile
    const { data: buyerProfile, error: buyerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", buyerEmail)
      .single();

    if (buyerError || !buyerProfile) {
      console.error("❌ Buyer not found:", buyerError);
      return NextResponse.json({ success: false, error: "Buyer not found" }, { status: 404 });
    }

    // 🧮 Payment breakdown
    const totalAmount = (session.amount_total || 0) / 100;
    const platformFee = totalAmount * 0.1;
    const sellerAmount = totalAmount * 0.9;

    // 💾 Insert transaction if not already saved
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .maybeSingle();

    if (!existingTx) {
      const { error: txError } = await supabase.from("transactions").insert({
        product_id: productId,
        buyer_id: buyerProfile.id,
        seller_id: sellerId,
        stripe_payment_intent_id: session.payment_intent as string,
        total_amount: totalAmount,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        status: "completed",
        buyer_email: buyerEmail,
      });

      if (txError) {
        console.error("❌ Failed to save transaction:", txError);
      } else {
        console.log("✅ Transaction saved successfully.");
      }
    } else {
      console.log("⚠️ Transaction already exists, skipping insert.");
    }

    // 🛍️ Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, description, media_urls, media_type, price")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("❌ Product not found in Supabase:", productError);
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    console.log("✅ Product fetched:", product.title);

    // ✅ Return product info
    return NextResponse.json({
      success: true,
      message: "Purchase verified successfully",
      product,
    });
  } catch (error: any) {
    console.error("💥 Error in /api/fetch-purchased-product:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
