import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/auth";
import { Home, Users, Package, FileText, BarChart, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(res => setUser(res.data))
      .catch(() => setLocation("/login"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  const isAdmin = user.role === "admin";

  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: Shield },
        { href: "/admin/businesses", label: "Businesses", icon: Users },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: Home },
        { href: "/invoices", label: "Invoices", icon: FileText },
        { href: "/customers", label: "Customers", icon: Users },
        { href: "/products", label: "Products", icon: Package },
        { href: "/reports", label: "Reports", icon: BarChart },
        { href: "/settings", label: "Settings", icon: Settings },
      ];

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r">
        <div className="p-4 border-b">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-xl font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">B</div>
            BillMate
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${location.startsWith(item.href) ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-3">
            <div className="font-medium truncate">{user.businessName || "Admin"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Nav — shown for ALL users */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around items-center px-1 py-1">
          {navItems.slice(0, isAdmin ? 2 : 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center p-2 rounded-md cursor-pointer min-w-[56px] ${location.startsWith(item.href) ? "text-primary" : "text-gray-500"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium leading-tight text-center">{item.label}</span>
              </div>
            </Link>
          ))}
          {/* More items for business users */}
          {!isAdmin && navItems.slice(4).map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center p-2 rounded-md cursor-pointer min-w-[56px] ${location.startsWith(item.href) ? "text-primary" : "text-gray-500"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium leading-tight text-center">{item.label}</span>
              </div>
            </Link>
          ))}
          {/* Logout always visible on mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center p-2 rounded-md cursor-pointer min-w-[56px] text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
