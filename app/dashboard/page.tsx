"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, Product, Transaction } from "@/lib/supabase";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader as Loader2,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const [productsRes, salesRes, purchasesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select(
            `
            *,
            products (
              id,
              title,
              price
            )
          `
          )
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select(
            `
            *,
            products (
              id,
              title,
              price,
              media_urls,
              media_type
            )
          `
          )
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      setProducts(productsRes.data || []);
      setSales(salesRes.data || []);
      setPurchases(purchasesRes.data || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = sales
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + parseFloat(s.seller_amount.toString()), 0);

  const totalSales = sales.filter((s) => s.status === "completed").length;

  const totalSpent = purchases
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + parseFloat(p.total_amount.toString()), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex justify-center items-center">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              My Dashboard
            </h1>
            <p className="text-lg text-slate-600">
              Manage your products and view your sales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  ${totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  90% of total sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Products Listed
                </CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {products.length}
                </div>
                <p className="text-xs text-slate-500 mt-1">Active listings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Sales
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {totalSales}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Completed transactions
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="products">My Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              <div className="mb-4">
                <Link href="/sell">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    Create New Listing
                  </Button>
                </Link>
              </div>

              {products.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 mb-4">
                      You have not listed any products yet
                    </p>
                    <Link href="/sell">
                      <Button>Create Your First Listing</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {product.title}
                              </h3>
                              <Badge
                                variant={
                                  product.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {product.status}
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-2">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>
                                {product.media_type === "images"
                                  ? `${product.media_urls.length} Images`
                                  : "Video"}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-slate-900">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales" className="mt-6">
              {sales.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">No sales yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {(sale.products as any)?.title || "Product"}
                              </h3>
                              <Badge
                                variant={
                                  sale.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {sale.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">
                                  Buyer Email:
                                </span>
                                <p className="text-slate-900">
                                  {sale.buyer_email}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Sale Amount:
                                </span>
                                <p className="text-slate-900">
                                  ${sale.total_amount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Your Earnings (90%):
                                </span>
                                <p className="text-green-600 font-semibold">
                                  ${sale.seller_amount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Date:</span>
                                <p className="text-slate-900">
                                  {new Date(
                                    sale.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="mt-6">
              {purchases.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 mb-4">
                      You have not purchased anything yet
                    </p>
                    <Link href="/marketplace">
                      <Button>Browse Marketplace</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 font-medium">
                          Total Spent
                        </span>
                        <span className="text-2xl font-bold text-slate-900">
                          ${totalSpent.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                
                  {purchases.map((purchase) => (
                    <Card key={purchase.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {(purchase.products as any)?.title || "Product"}
                              </h3>
                              <Badge
                                variant={
                                  purchase.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {purchase.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">
                                  Amount Paid:
                                </span>
                                <p className="text-slate-900 font-semibold">
                                  ${purchase.total_amount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Date:</span>
                                <p className="text-slate-900">
                                  {new Date(
                                    purchase.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Link href={`/dashboard/purchase/${purchase.id}`}>
                            <Button
                              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
