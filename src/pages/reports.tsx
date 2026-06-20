import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, IndianRupee, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

function formatCurrency(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }
const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | undefined>(currentMonth);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("FREE");

  useEffect(() => {
    api.get("/auth/me").then(r => setPlan(r.data.plan || "FREE"));
  }, []);

  useEffect(() => {
    setLoading(true);
    const startDate = month
      ? `${year}-${String(month).padStart(2,"0")}-01`
      : `${year}-01-01`;
    const endDate = month
      ? `${year}-${String(month).padStart(2,"0")}-${new Date(year, month, 0).getDate()}`
      : `${year}-12-31`;
    api.get("/reports/sales", { params: { period: "custom", startDate, endDate } })
      .then(r => setReport(r.data))
      .finally(() => setLoading(false));
  }, [year, month]);

  const invoices: any[] = useMemo(() => report?.invoices || [], [report]);
  const paidCount = invoices.filter(i => i.paymentStatus === "PAID").length;
  const unpaidCount = invoices.filter(i => i.paymentStatus === "UNPAID").length;
  const partialCount = invoices.filter(i => i.paymentStatus === "PARTIAL").length;
  const avgInvoiceValue = report?.totalInvoices ? (report.totalSales / report.totalInvoices) : 0;
  const canExport = ["STARTER","PRO","BUSINESS"].includes(plan);

  const monthlyBreakdown = useMemo(() => {
    if (month) return [];
    const buckets: Record<number, number> = {};
    invoices.forEach(inv => { const m = new Date(inv.invoiceDate).getMonth(); buckets[m] = (buckets[m] || 0) + Number(inv.grandTotal); });
    return MONTH_NAMES.map((name, idx) => ({ month: name, revenue: buckets[idx] || 0 }));
  }, [invoices, month]);

  const topCustomers = useMemo(() => {
    const acc: Record<string, number> = {};
    invoices.forEach(inv => { const name = inv.customer?.name || "Unknown"; acc[name] = (acc[name] || 0) + Number(inv.grandTotal); });
    return Object.entries(acc).map(([customerName, revenue]) => ({ customerName, revenue })).sort((a,b) => b.revenue - a.revenue).slice(0,5);
  }, [invoices]);

  const paymentStatusData = [
    { name: "Paid", value: paidCount }, { name: "Unpaid", value: unpaidCount }, { name: "Partial", value: partialCount },
  ].filter(d => d.value > 0);

  const handleExcelExport = async () => {
    if (!canExport) { toast({ title: "Upgrade required", description: "Excel export available from STARTER plan", variant: "destructive" }); return; }
    try {
      const XLSX = await import("xlsx");
      const rows = invoices.map((inv: any) => ({ "Invoice #": inv.invoiceNumber, "Date": inv.invoiceDate, "Customer": inv.customer?.name || "", "Subtotal": inv.subtotal, "Discount": inv.totalDiscount, "GST": inv.totalTax, "Grand Total": inv.grandTotal, "Status": inv.paymentStatus }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
      XLSX.writeFile(wb, `BillMate-Report-${year}${month ? `-${String(month).padStart(2,"0")}` : ""}.xlsx`);
      toast({ title: "Excel exported!" });
    } catch { toast({ title: "Export failed", variant: "destructive" }); }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { v: 1, l: "January" }, { v: 2, l: "February" }, { v: 3, l: "March" }, { v: 4, l: "April" },
    { v: 5, l: "May" }, { v: 6, l: "June" }, { v: 7, l: "July" }, { v: 8, l: "August" },
    { v: 9, l: "September" }, { v: 10, l: "October" }, { v: 11, l: "November" }, { v: 12, l: "December" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Sales analytics & export</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={month ? String(month) : "all"} onValueChange={v => setMonth(v === "all" ? undefined : Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Full Year</SelectItem>
                {months.map(m => <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={canExport ? "default" : "outline"} className="gap-2" onClick={handleExcelExport}>
              <Download className="w-4 h-4" /> Excel
              {!canExport && <Badge variant="secondary" className="text-[10px]">STARTER+</Badge>}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><IndianRupee className="w-4 h-4 text-green-600" /><span className="text-sm text-muted-foreground">Total Revenue</span></div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(report?.totalSales || 0)}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-600" /><span className="text-sm text-muted-foreground">Invoices</span></div>
                <div className="text-2xl font-bold">{report?.totalInvoices || 0}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">Avg Invoice</span></div>
                <div className="text-2xl font-bold">{formatCurrency(avgInvoiceValue)}</div>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><IndianRupee className="w-4 h-4 text-orange-600" /><span className="text-sm text-muted-foreground">Outstanding</span></div>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(report?.unpaidAmount || 0)}</div>
              </CardContent></Card>
            </div>

            {!month && monthlyBreakdown.some(m => m.revenue > 0) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Monthly Revenue — {year}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {invoices.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {paymentStatusData.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={paymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                            {paymentStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {topCustomers.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Top Customers</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topCustomers.map((c, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i+1}</div>
                              <span className="text-sm font-medium truncate">{c.customerName}</span>
                            </div>
                            <span className="text-sm font-semibold">{formatCurrency(c.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {invoices.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Invoice</th>
                          <th className="text-left px-4 py-3 font-medium">Customer</th>
                          <th className="text-left px-4 py-3 font-medium">Date</th>
                          <th className="text-right px-4 py-3 font-medium">Amount</th>
                          <th className="text-left px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoices.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3 font-mono font-medium">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3">{inv.customer?.name || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(inv.grandTotal))}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inv.paymentStatus==="PAID" ? "bg-green-100 text-green-700" : inv.paymentStatus==="UNPAID" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{inv.paymentStatus}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {invoices.length === 0 && !loading && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No invoices found for the selected period.</CardContent></Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
