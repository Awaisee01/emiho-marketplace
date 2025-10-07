"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Loader as Loader2, Upload, X, CircleAlert as AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SellPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mediaType, setMediaType] = useState<'images' | 'video'>('images');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && profile && !profile.stripe_account_id) {
      toast.error('Please add your Stripe Account ID in your profile first');
      router.push('/profile');
    }
  }, [profile, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (mediaType === 'images' && files.length > 10) {
      toast.error('You can upload maximum 10 images');
      return;
    }

    if (mediaType === 'video' && files.length > 1) {
      toast.error('You can upload only 1 video');
      return;
    }

    const validFiles = files.filter(file => {
      if (mediaType === 'images') {
        return file.type.startsWith('image/');
      } else {
        return file.type.startsWith('video/');
      }
    });

    if (validFiles.length !== files.length) {
      toast.error(`Please select only ${mediaType}`);
      return;
    }

    setMediaFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      urls.push(publicData.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!profile.stripe_account_id) {
      toast.error('Please add your Stripe Account ID in your profile first');
      router.push('/profile');
      return;
    }

    if (mediaFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (mediaType === 'images' && mediaFiles.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    if (mediaType === 'video' && mediaFiles.length > 1) {
      toast.error('Only 1 video allowed');
      return;
    }

    setLoading(true);

    try {
      const mediaUrls = await uploadFiles();

      const { data, error } = await supabase.from('products').insert({
        seller_id: user.id,
        title,
        description,
        price: parseFloat(price),
        media_urls: mediaUrls,
        media_type: mediaType,
        status: 'active',
      }).select().single();

      if (error) throw error;

      toast.success('Product listed successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!user || !profile?.stripe_account_id) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Listing</CardTitle>
              <CardDescription>
                Upload your digital product and set your price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Amazing Digital Product"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="9.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                  />
                  <p className="text-sm text-slate-500">
                    You will receive 90% of the price. Platform fee: 10%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Media Type</Label>
                  <RadioGroup value={mediaType} onValueChange={(value: any) => {
                    setMediaType(value);
                    setMediaFiles([]);
                  }}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="images" id="images" />
                      <Label htmlFor="images" className="cursor-pointer">Images (up to 10)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video" className="cursor-pointer">Video (1 only)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="media">Upload {mediaType === 'images' ? 'Images' : 'Video'}</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                    <Input
                      id="media"
                      type="file"
                      accept={mediaType === 'images' ? 'image/*' : 'video/*'}
                      multiple={mediaType === 'images'}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="media" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        Click to upload {mediaType === 'images' ? 'images (max 10)' : 'video (1 only)'}
                      </p>
                    </label>
                  </div>

                  {mediaFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label>Selected Files:</Label>
                      <div className="space-y-2">
                        {mediaFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Once published, buyers can purchase your product. You will receive 90% of the sale price directly to your Stripe account.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
