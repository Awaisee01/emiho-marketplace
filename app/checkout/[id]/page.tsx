"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, Product } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Image as ImageIcon, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to purchase');
      router.push('/auth/login');
      return;
    }
    console.log("🧭 CheckoutPage params.id:", params.id)
    
    fetchProduct();
  }, [params.id, user]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            stripe_account_id
          )
        `)
        .eq('id', params.id)
        .eq('status', 'active')
        .single();

console.log("🧾 Supabase data:", data)
console.log("⚠️ Supabase error:", error)

      if (error) throw error;

      if (!data) {
        toast.error('Product not found');
        router.push('/marketplace');
        return;
      }

      if (data.seller_id === user?.id) {
        toast.error('You cannot purchase your own product');
        router.push('/marketplace');
        return;
      }

      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !profile || !product) return;

    const seller = product.profiles as any;
    if (!seller.stripe_account_id) {
      toast.error('Seller has not configured their Stripe account');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          buyerEmail: profile.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment');
      }

      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  if (!product || !user) return null;

  const platformFee = product.price * 0.1;
  const sellerAmount = product.price * 0.9;
  const seller = product.profiles as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden">
                  {product.media_type === 'images' && product.media_urls.length > 0 ? (
                    <img
                      src={product.media_urls[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {product.media_type === 'video' ? (
                        <Video className="w-16 h-16 text-slate-400" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{product.title}</h3>
                  <p className="text-slate-600 mb-4">{product.description}</p>
                  <Badge variant={product.media_type === 'images' ? 'default' : 'secondary'}>
                    {product.media_type === 'images' ? `${product.media_urls.length} Images` : 'Video'}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-600 mb-1">Sold by</div>
                  <div className="font-medium text-slate-900">{seller.full_name || 'Seller'}</div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Product Price</span>
                      <span>${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Platform Fee (10%)</span>
                      <span>${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Seller Receives (90%)</span>
                      <span>${sellerAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-xl font-bold text-slate-900">
                      <span>Total</span>
                      <span>${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your payment is secured by Stripe. After purchase, you will receive an email with your purchase details.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-14 text-lg"
                onClick={handlePurchase}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ${product.price.toFixed(2)} with Stripe
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By completing this purchase, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
