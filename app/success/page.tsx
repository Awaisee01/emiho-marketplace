"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheck as CheckCircle2, Loader as Loader2, Download } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    const fetchPurchasedProduct = async () => {
      if (!sessionId) return;

      try {
        const res = await fetch("/api/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        if (data.success) setProduct(data.product);
      } catch (err) {
        console.error("Failed to fetch purchased product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedProduct();
  }, [sessionId]);

  // ✅ Proper download method
  const handleDownloadAll = async () => {
    if (!product?.media_urls?.length) return;

    for (const [index, url] of product.media_urls.entries()) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();

        const fileName = url.split("/").pop() || `file_${index + 1}`;
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 500);
      } catch (err) {
        console.error(`❌ Failed to download ${url}:`, err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">Payment Successful!</CardTitle>
              <CardDescription className="text-lg">
                Your purchase has been completed successfully
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {product && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <p className="text-slate-700 mb-4 text-left">
                    <span className="font-semibold">Product:</span> {product.title}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {product.media_urls?.map((url: string, i: number) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Product ${i}`}
                        className="rounded-lg shadow-sm border"
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleDownloadAll}
                    className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download All
                  </Button>
                </div>
              )}

              {sessionId && (
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Session ID:</span> {sessionId.substring(0, 20)}...
                </div>
              )}

              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    View in Dashboard
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
