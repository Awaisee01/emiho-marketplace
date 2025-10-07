'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SellerOnboarding() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch logged-in user info from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        setMessage('❌ Could not fetch user');
        toast.error('Could not fetch user details');
        return;
      }

      if (data.user) {
        setUserId(data.user.id);
        setEmail(data.user.email || '');
      }
    };

    fetchUser();
  }, []);

  const handleCreateSeller = async () => {
    if (!userId || !email) {
      setMessage('❌ User not logged in or email missing');
      toast.error('You must be logged in to continue.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/create-seller-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      const data = await res.json();

      if (data.success) {
        setOnboardingUrl(data.onboardingUrl);
        setMessage('✅ Seller account created! Complete onboarding below.');
        toast.success('Seller account created successfully!');
      } else {
        setMessage('❌ ' + data.error);
        toast.error(data.error);
      }
    } catch (err: any) {
      setMessage('❌ ' + err.message);
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-20 sm:mt-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <Card className="w-full max-w-lg shadow-md border border-slate-200">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-blue-100 p-3 mb-2">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Become a Seller
          </CardTitle>
          <CardDescription className="text-slate-600">
            Connect your account with Stripe to start selling and receive payouts directly.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Your Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-100 text-slate-700 cursor-not-allowed"
            />
          </div>

          <Button
            onClick={handleCreateSeller}
            disabled={loading || !userId}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Create Stripe Seller Account
              </>
            )}
          </Button>

          {message && (
            <p
              className={`text-center text-sm ${
                message.includes('✅')
                  ? 'text-green-600'
                  : message.includes('❌')
                  ? 'text-red-500'
                  : 'text-slate-600'
              }`}
            >
              {message}
            </p>
          )}

          {onboardingUrl && (
            <a
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center mt-4 text-blue-600 font-medium hover:underline"
            >
              Complete Stripe Onboarding →
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
