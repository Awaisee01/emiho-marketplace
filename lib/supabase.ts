import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  media_urls: string[];
  media_type: 'images' | 'video';
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Transaction = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  stripe_payment_intent_id: string;
  total_amount: number;
  platform_fee: number;
  seller_amount: number;
  status: 'pending' | 'completed' | 'failed';
  buyer_email: string;
  created_at: string;
  updated_at: string;
  products?: Product;
};
