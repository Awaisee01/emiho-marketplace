import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Missing accountId' }, { status: 400 });
    }

    // Create a login link for the connected account
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    return NextResponse.json({ success: true, url: loginLink.url });
  } catch (error: any) {
    console.error('Error creating login link:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
