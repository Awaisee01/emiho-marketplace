"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader as Loader2, Download, ArrowLeft } from "lucide-react";

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    if (id) fetchPurchaseDetail();
  }, [id]);

  const fetchPurchaseDetail = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          products (
            id,
            title,
            description,
            price,
            media_urls,
            media_type
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setPurchase(data);
    } catch (err) {
      console.error("❌ Error fetching purchase details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!purchase?.products?.media_urls?.length) return;

    for (const [index, url] of purchase.products.media_urls.entries()) {
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
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="pt-32 text-center text-slate-700">Purchase not found</div>
      </div>
    );
  }

  const product = purchase.products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-20">
      <div className="pt-24 px-6 container mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Details</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{product.title}</CardTitle>
            <p className="text-slate-600 mt-1">{product.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {product.media_type === "images" &&
                product.media_urls?.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Media ${i}`}
                    className="rounded-lg shadow-sm border"
                  />
                ))}

              {product.media_type === "video" &&
                product.media_urls?.map((url: string, i: number) => (
                  <video
                    key={i}
                    src={url}
                    controls
                    className="rounded-lg shadow-sm border w-full"
                  />
                ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-slate-900">
                Amount Paid: ${purchase.total_amount.toFixed(2)}
              </p>
              <Button
                onClick={handleDownloadAll}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Download className="w-4 h-4 mr-2" /> Download All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
