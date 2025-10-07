"use client";

import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, DollarSign, Upload, ShoppingCart, CreditCard, Mail } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Marketplace Documentation</h1>
            <p className="text-lg text-slate-600">Complete guide to buying and selling on Emiho Marketplace</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge>Overview</Badge>
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">
                  Emiho Marketplace is a digital product marketplace where creators can sell images and videos directly to buyers.
                  We use Stripe Connect to handle secure payments and automatic payouts.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <h4 className="font-semibold mb-1">1. Upload</h4>
                    <p className="text-sm text-slate-600">List your digital products</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <h4 className="font-semibold mb-1">2. Sell</h4>
                    <p className="text-sm text-slate-600">Buyers purchase via Stripe</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                    <h4 className="font-semibold mb-1">3. Get Paid</h4>
                    <p className="text-sm text-slate-600">Receive 90% instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="stripe-setup">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Sellers</Badge>
                  Setting Up Your Stripe Account
                </CardTitle>
                <CardDescription>Required to receive payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Important:</strong> You MUST set up a Stripe Connect account to sell products on our marketplace.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                      Create a Stripe Account
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-8 text-slate-700">
                      <li>Go to <a href="/onboarding" target="_blank" className="text-cyan-600 hover:underline">Onboarding page</a></li>
                      <li>Click create seller account</li>
                      <li>It give you link click on it and go to stripe configration</li>
                      <li>Complete the verification process (requires business/personal details)</li>
                      <li>Add your bank account for payouts</li>
                      <li>When stripe configration is done it show you stripe account link.</li>
                      <li>Click on this link and save this is your express stripe account.</li>
                      <li>Here you can see your payments</li>
                    </ol>
                  </div>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Once set up, you will automatically receive 90% of each sale directly to your Stripe account.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Sellers</Badge>
                  Creating a Listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    You must add your Stripe Account ID before you can create listings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Upload Media</h4>
                      <p className="text-slate-600 text-sm">Choose up to 10 images OR 1 video per listing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Set Details</h4>
                      <p className="text-slate-600 text-sm">Add a title, description, and price</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Publish</h4>
                      <p className="text-slate-600 text-sm">Your product will appear in the marketplace immediately</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2">Pricing Guide</h4>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>• Set your price based on content value and market rates</li>
                    <li>• Remember: You receive 90%, platform keeps 10%</li>
                    <li>• Example: $10 product = $9 to you, $1 platform fee</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge>Buyers</Badge>
                  Making a Purchase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                    <div>
                      <h4 className="font-semibold">Browse Marketplace</h4>
                      <p className="text-slate-600 text-sm">Find products you want to purchase</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                    <div>
                      <h4 className="font-semibold">Click Buy Now</h4>
                      <p className="text-slate-600 text-sm">You will be redirected to the checkout page</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                    <div>
                      <h4 className="font-semibold">Pay with Stripe</h4>
                      <p className="text-slate-600 text-sm">Secure payment processing via Stripe Checkout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                    <div>
                      <h4 className="font-semibold">Receive Confirmation</h4>
                      <p className="text-slate-600 text-sm">Get email confirmation with purchase details</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">Understanding how payments are processed:</p>
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Total Purchase Price</span>
                    <span className="font-bold text-slate-900">100%</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between text-green-700">
                      <span>→ Seller Receives</span>
                      <span className="font-bold">90%</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-700">
                      <span>→ Platform Fee</span>
                      <span className="font-bold">10%</span>
                    </div>
                  </div>
                </div>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Payments are processed instantly via Stripe Connect. Sellers receive their portion directly to their Stripe account.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Sellers Receive:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                    <li>Sale confirmation with buyer details</li>
                    <li>Product information and earnings</li>
                    <li>Transaction ID for records</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Buyers Receive:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 ml-2">
                    <li>Purchase confirmation</li>
                    <li>Product details and seller information</li>
                    <li>Purchase ID for support requests</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">How long does it take to receive payments?</h4>
                  <p className="text-slate-600 text-sm">Payments are processed immediately through Stripe. Payouts to your bank account follow Stripe standard payout schedule (typically 2-7 business days).</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Can I change my listing after publishing?</h4>
                  <p className="text-slate-600 text-sm">Currently, listings cannot be edited after publishing. You can create a new listing if needed.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">What file formats are supported?</h4>
                  <p className="text-slate-600 text-sm">All common image formats (JPG, PNG, GIF, etc.) and video formats (MP4, MOV, AVI, etc.) are supported.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Is there a refund policy?</h4>
                  <p className="text-slate-600 text-sm">All sales are final. Please contact support if you have issues with a purchase.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
