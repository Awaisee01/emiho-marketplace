"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, Product } from "@/lib/supabase";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader as Loader2,
  ShoppingCart,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          profiles (
            id,
            full_name,
            email
          )
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (productId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase products");
      router.push("/auth/login");
      return;
    }
    router.push(`/checkout/${productId}`);
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
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Marketplace
            </h1>
            <p className="text-lg text-slate-600">
              Browse and purchase digital products from our community
            </p>
          </div>

          {user && (
            <div className="mb-8">
              <Link href="/sell">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  Create New Listing
                </Button>
              </Link>
            </div>
          )}

          {products.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">
                  No products available yet. Be the first to list!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="flex flex-col hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="relative w-full h-48 bg-slate-100 rounded-lg mb-4 overflow-hidden">
                      {product.media_type === "images" &&
                      product.media_urls.length > 0 ? (
                        product.media_urls.length > 1 ? (
                          // Multiple images → Carousel
                          <Carousel
                            plugins={[
                              Autoplay({
                                delay: 3000,
                              }),
                            ]}
                            className="w-full h-full"
                          >
                            <CarouselContent>
                              {product.media_urls.map((url, idx) => (
                                <CarouselItem
                                  key={idx}
                                  className="relative h-48"
                                >
                                  <img
                                    src={url}
                                    alt={`${product.title}-${idx}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3C/svg%3E";
                                    }}
                                  />
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white shadow-md" />
                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white shadow-md" />
                          </Carousel>
                        ) : (
                          // Single image
                          <img
                            src={product.media_urls[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f5f9' width='100' height='100'/%3E%3C/svg%3E";
                            }}
                          />
                        )
                      ) : (
                        // No images → show icon
                        <div className="w-full h-full flex items-center justify-center">
                          {product.media_type === "video" ? (
                            <Video className="w-16 h-16 text-slate-400" />
                          ) : (
                            <ImageIcon className="w-16 h-16 text-slate-400" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          product.media_type === "images"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {product.media_type === "images"
                          ? `${product.media_urls.length} Images`
                          : "Video"}
                      </Badge>
                      <span className="text-2xl font-bold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{product.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto flex flex-col gap-2">
                    <div className="text-sm text-slate-500 w-full">
                      Sold by:{" "}
                      {(product.profiles as any)?.full_name || "Seller"}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                      onClick={() => handleBuy(product.id)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
