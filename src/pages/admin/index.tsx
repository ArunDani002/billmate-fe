import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, FileText, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700", STARTER: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700", BUSINESS: "bg-amber-100 text-amber-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}</div></Layout>;

  const planData = stats?.planBreakdown ? Object.entries(stats.planBreakdown).map(([plan, count]) => ({ plan, count })) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform overview</p>
          </div>
          <Link href="/admin/businesses"><Button variant="outline" className="gap-2"><Building2 className="w-4 h-4" /> Manage Businesses</Button></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="text-sm text-muted-foreground">Total Businesses</span></div>
            <div className="text-3xl font-bold">{stats?.totalBusinesses || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">{stats?.activeBusinesses || 0} active</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-green-600" /><span className="text-sm text-muted-foreground">Total Invoices</span></div>
            <div className="text-3xl font-bold">{stats?.totalInvoices || 0}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-purple-600" /><span className="text-sm text-muted-foreground">Recent Signups</span></div>
            <div className="text-3xl font-bold">{stats?.recentSignups?.length || 0}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-orange-600" /><span className="text-sm text-muted-foreground">Active</span></div>
            <div className="text-3xl font-bold">{stats?.activeBusinesses || 0}</div>
          </CardContent></Card>
        </div>

        {planData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Businesses by Plan</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="plan" /><YAxis allowDecimals={false} /><Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Businesses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {stats?.recentSignups?.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Signups</CardTitle>
              <Link href="/admin/businesses"><Button variant="ghost" size="sm">View all</Button></Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {stats.recentSignups.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <div className="font-medium text-sm">{b.businessName}</div>
                      <div className="text-xs text-muted-foreground">{b.ownerName} · {b.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[b.plan] || ""}`}>{b.plan}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${b.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
