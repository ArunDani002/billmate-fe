import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, CreditCard, CheckCircle } from "lucide-react";
import api from "@/lib/axios";

const PLAN_INFO: Record<string, { label: string; color: string; features: string[] }> = {
  FREE: { label: "Free", color: "bg-gray-100 text-gray-700", features: ["Up to 10 invoices/month", "1 invoice template", "Basic dashboard"] },
  STARTER: { label: "Starter", color: "bg-blue-100 text-blue-700", features: ["Up to 100 invoices/month", "3 invoice templates", "Excel export", "Reports"] },
  PRO: { label: "Pro", color: "bg-purple-100 text-purple-700", features: ["Unlimited invoices", "All 4 templates", "Advanced reports"] },
  BUSINESS: { label: "Business", color: "bg-amber-100 text-amber-700", features: ["Everything in Pro", "API access", "Custom branding"] },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", phone: "", address: "", gstNumber: "" });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    api.get("/business/profile").then(r => {
      setProfile(r.data);
      setForm({ businessName: r.data.businessName || "", ownerName: r.data.ownerName || "", email: r.data.email || "", phone: r.data.phone || "", address: r.data.address || "", gstNumber: r.data.gstNumber || "" });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/business/profile", form);
      setProfile(res.data);
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const plan = profile?.plan || "FREE";
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.FREE;

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your business profile</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Your Plan</CardTitle>
              <Badge className={`${planInfo.color} border-0`}>{planInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {planInfo.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
            {plan === "FREE" && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">Upgrade to unlock more features</p>
                <p className="text-xs text-muted-foreground mt-1">Contact admin@billmate.app to upgrade your plan</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Business Profile</CardTitle>
            <CardDescription>This information appears on your invoices</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Business Name *</Label><Input value={form.businessName} onChange={set("businessName")} required /></div>
                    <div className="space-y-2"><Label>Owner Name *</Label><Input value={form.ownerName} onChange={set("ownerName")} required /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
                    <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={set("phone")} required /></div>
                  </div>
                  <div className="space-y-2"><Label>Business Address</Label><Input placeholder="Full address" value={form.address} onChange={set("address")} /></div>
                  <div className="space-y-2"><Label>GST Number</Label><Input placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={set("gstNumber")} /></div>
                </>
              )}
            </CardContent>
            <div className="px-6 pb-6">
              <Button type="submit" disabled={saving || loading}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
