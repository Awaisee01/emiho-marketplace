import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

// ✅ Supabase client setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    console.log("📩 /api/fetch-purchased-product called with:", { session_id });

    if (!session_id)
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    // 🧩 Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price.product"],
    });

    console.log("🧾 Stripe session retrieved successfully:", {
      id: session.id,
      customer_email: session.customer_email,
      metadata: session.metadata,
    });

    const productId = session.metadata?.productId;

    if (!productId) {
      console.error("❌ No productId found in session metadata");
      return NextResponse.json(
        { error: "Missing productId in session metadata" },
        { status: 400 }
      );
    }

    // 🛒 Fetch the purchased product from Supabase
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("❌ Supabase product fetch error:", productError);
      return NextResponse.json(
        { error: "Product not found in Supabase" },
        { status: 404 }
      );
    }

    console.log("✅ Product fetched successfully from Supabase:", product.title);

    // ✅ Return full product details
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        media_urls: product.media_urls,
        media_type: product.media_type,
        price: product.price,
      },
    });
  } catch (error: any) {
    console.error("💥 Error in /api/fetch-purchased-product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
