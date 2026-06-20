import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setToken } from "@/lib/auth";
import api from "@/lib/axios";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      setToken(res.data.token);
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.response?.data?.error || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">B</div>
          <h1 className="text-3xl font-bold text-gray-900">BillMate</h1>
          <p className="text-muted-foreground mt-1">Start invoicing in minutes</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">Create Account</h2>
            <p className="text-sm text-muted-foreground mb-5">Free plan, no credit card required</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input placeholder="My Shop" value={form.businessName} onChange={set("businessName")} required />
              </div>
              <div className="space-y-2">
                <Label>Owner Name *</Label>
                <Input placeholder="Your full name" value={form.ownerName} onChange={set("ownerName")} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="you@business.com" value={form.email} onChange={set("email")} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input type="tel" placeholder="9876543210" value={form.phone} onChange={set("phone")} required />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create Free Account"}</Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
