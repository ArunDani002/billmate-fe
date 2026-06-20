import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Users, TrendingUp, Clock, Plus, IndianRupee } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = { PAID: "bg-green-100 text-green-700", UNPAID: "bg-red-100 text-red-700", PARTIAL: "bg-yellow-100 text-yellow-700" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c[status] || "bg-gray-100"}`}>{status}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Layout><div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's your overview.</p>
          </div>
          <Link href="/invoices/new"><Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month</span>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><IndianRupee className="w-4 h-4 text-green-600" /></div>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.monthlySales || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{stats?.totalInvoices || 0} invoices total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Outstanding</span>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><Clock className="w-4 h-4 text-orange-600" /></div>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats?.unpaidInvoices || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">unpaid invoices</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            </div>
            <div className="text-2xl font-bold">{stats?.invoiceCountThisMonth || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">invoices created</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Customers</span>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
            </div>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">active clients</div>
          </CardContent></Card>
        </div>

        {stats?.monthlyRevenue?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Last 6 Months</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Link href="/invoices"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.recentInvoices?.length > 0 ? (
              <div className="divide-y">
                {stats.recentInvoices.map((inv: any) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">{inv.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{inv.customerName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatCurrency(Number(inv.grandTotal))}</div>
                        <StatusBadge status={inv.paymentStatus} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No invoices yet</p>
                <Link href="/invoices/new"><Button className="mt-3" size="sm">Create first invoice</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
