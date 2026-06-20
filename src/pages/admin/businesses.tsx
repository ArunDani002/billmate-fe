import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import api from "@/lib/axios";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700", STARTER: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700", BUSINESS: "bg-amber-100 text-amber-700",
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  function load() {
    setLoading(true);
    api.get("/admin/businesses", { params: { search: search || undefined } })
      .then(r => { setBusinesses(r.data.businesses); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search]);

  const updateStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await api.put(`/admin/businesses/${id}/status`, { isActive });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, isActive: res.data.isActive } : b));
      toast({ title: "Status updated" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const updatePlan = async (id: string, plan: string) => {
    try {
      const res = await api.put(`/admin/businesses/${id}/plan`, { plan });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, plan: res.data.plan } : b));
      toast({ title: "Plan updated" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Businesses</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} registered businesses</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : businesses.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No businesses found</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {businesses.map(b => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{b.businessName}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[b.plan] || ""}`}>{b.plan}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${b.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.isActive ? "Active" : "Suspended"}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{b.ownerName} · {b.email}</div>
                      {b.phone && <div className="text-sm text-muted-foreground">{b.phone}</div>}
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{b.totalInvoices} invoices</span>
                        <span className="text-xs text-muted-foreground">Joined {new Date(b.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Select value={b.plan} onValueChange={v => updatePlan(b.id, v)}>
                        <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Free</SelectItem>
                          <SelectItem value="STARTER">Starter</SelectItem>
                          <SelectItem value="PRO">Pro</SelectItem>
                          <SelectItem value="BUSINESS">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch checked={b.isActive} onCheckedChange={checked => updateStatus(b.id, checked)} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
