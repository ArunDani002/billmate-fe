import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setToken } from "@/lib/auth";
import api from "@/lib/axios";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      setToken(res.data.token);
      setLocation(res.data.business.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.response?.data?.error || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mb-4">B</div>
          <h1 className="text-4xl font-bold tracking-tight">
            BillMate
          </h1>

          <p className="text-muted-foreground mt-1">
            Simple. Fast. Professional Billing.
          </p>

          <p className="text-xs text-muted-foreground mt-3">
            A DAVerse Tech Product
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-1">Sign In</h2>
            <p className="text-sm text-muted-foreground mb-5">Enter your credentials to access your account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@business.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">Register free</Link>
            </p>
            {/* <div className="text-xs text-muted-foreground text-center border-t pt-3 mt-4 space-y-1">
              <p className="font-medium">Demo credentials:</p>
              <p>Business: ravi@demo.com / demo123</p>
              <p>Admin: admin@billmate.app / admin123</p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
