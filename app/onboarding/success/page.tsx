'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function OnboardingSuccessPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to fetch Stripe account details.');
      } else if (data?.stripe_account_id) {
        setAccountId(data.stripe_account_id);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleOpenDashboard = async () => {
    if (!accountId) return;

    try {
      const res = await fetch('/api/stripe-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to open Stripe dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-32 sm:mt-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-md border border-slate-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            🎉 Onboarding Complete!
          </CardTitle>
          <CardDescription className="text-slate-600">
            You’ve successfully completed your Stripe Connect onboarding.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          {accountId ? (
            <>
              <p className="text-slate-700">
                Your Stripe account is now connected! You’ll automatically receive
                <span className="font-semibold text-green-600"> 90% of each sale</span> directly to your account.
              </p>

              <Button
                onClick={handleOpenDashboard}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 w-full flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Your Stripe Dashboard
              </Button>

              <p className="text-sm text-slate-500">
                You can view transactions, payouts, and account details there.
              </p>
            </>
          ) : (
            <div className="text-center">
              <p className="text-red-500 font-medium mb-4">
                No Stripe account linked to your profile.
              </p>
              <Button
                onClick={() => router.push('/profile')}
                className="bg-slate-800 hover:bg-slate-900 w-full"
              >
                Go to Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
