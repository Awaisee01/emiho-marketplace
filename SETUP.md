# Emiho Marketplace - Setup Instructions

## Prerequisites

1. Supabase account
2. Stripe account with Connect enabled
3. Node.js 18+ installed

## Step 1: Supabase Setup

### Database

The database migrations have already been applied with the following tables:
- `profiles` - User profiles with Stripe account IDs
- `products` - Digital product listings
- `transactions` - Purchase records

### Storage Bucket

You need to create a storage bucket for media files:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Name it: `media`
5. Set it to **Public** (so product images can be displayed)
6. Click **"Create bucket"**

### Storage Policies

After creating the bucket, set up these policies:

1. Go to **Storage** → **Policies**
2. Add policy for `media` bucket:

**INSERT Policy:**
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');
```

**SELECT Policy:**
```sql
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');
```

## Step 2: Stripe Setup

### Platform Account (Already Configured)

Your platform Stripe keys are already set in `.env`:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

These receive the 10% platform fee.

### Webhook Setup

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-domain.com/api/webhook`
4. Select events: `checkout.session.completed`
5. Copy the webhook signing secret
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 3: Seller Setup

Sellers need to:

1. Create a Stripe account at stripe.com
2. Enable Stripe Connect in their Stripe Dashboard
3. Get their Account ID (starts with `acct_`)
4. Add the Account ID to their profile on your marketplace

See `/docs` page for detailed seller instructions.

## Step 4: Environment Variables

Update `.env` with your values:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe Platform Account (Already configured)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App URL (Update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Webhook (Add after creating webhook)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 5: Run the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Features

### For Sellers
- Upload digital products (up to 10 images or 1 video)
- Set custom prices
- Receive 90% of each sale
- View sales dashboard and earnings
- Automatic payouts to Stripe account

### For Buyers
- Browse marketplace
- Secure checkout with Stripe
- Email confirmation after purchase
- View purchase history

### Payment Flow
1. Buyer clicks "Buy Now" → Redirected to Stripe Checkout
2. Payment processed via Stripe
3. Webhook confirms payment
4. Transaction recorded in database
5. 10% goes to platform account
6. 90% goes to seller's Stripe account
7. Both parties receive email notifications

## Error Handling

The system includes comprehensive error handling:

- **No Stripe ID**: Sellers are redirected to profile page to add Stripe ID
- **Invalid Products**: Products without proper Stripe setup cannot be purchased
- **Failed Payments**: Users see appropriate error messages
- **Email Notifications**: Both buyer and seller receive transaction details

## Documentation

Visit `/docs` on your live site for complete user documentation including:
- How the marketplace works
- Stripe setup guide for sellers
- Creating listings
- Making purchases
- Payment flow explanation

## Support

For issues or questions:
1. Check the `/docs` page
2. Review error messages in browser console
3. Check Stripe Dashboard for payment issues
4. Verify Supabase policies are correct
