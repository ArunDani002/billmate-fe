import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Plus, Search, FileText, Trash2, Eye, CheckCircle } from "lucide-react";
import api from "@/lib/axios";

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { PAID: "bg-green-100 text-green-700", UNPAID: "bg-red-100 text-red-700", PARTIAL: "bg-yellow-100 text-yellow-700" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[status] || "bg-gray-100"}`}>{status}</span>;
}
function formatCurrency(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [marking, setMarking] = useState(false);
  const { toast } = useToast();

  function load() {
    setLoading(true);
    api.get("/invoices", { params: { search: search || undefined, status: status || undefined } })
      .then(r => { setInvoices(r.data.invoices); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, status]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try { await api.delete(`/invoices/${id}`); toast({ title: "Invoice deleted" }); load(); }
    catch { toast({ title: "Cannot delete", variant: "destructive" }); }
  };

  const handleMarkPaid = async () => {
    if (!markPaidId) return;
    setMarking(true);
    try {
      await api.put(`/invoices/${markPaidId}/payment-status`, { paymentStatus: "PAID", paymentMethod });
      toast({ title: "Payment recorded" });
      setMarkPaidId(null);
      load();
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setMarking(false); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} total invoices</p>
          </div>
          <Link href="/invoices/new"><Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button></Link>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by invoice #..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={status || "all"} onValueChange={v => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : invoices.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No invoices found</p>
            <Link href="/invoices/new"><Button className="mt-3" size="sm">Create first invoice</Button></Link>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {invoices.map(inv => (
              <Card key={inv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-medium text-sm">{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.paymentStatus} />
                      </div>
                      <div className="text-sm font-medium mt-1 truncate">{inv.customer?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDate(inv.invoiceDate)}</div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(Number(inv.grandTotal))}</div>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/invoices/${inv.id}`}>
                          <Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        {inv.paymentStatus !== "PAID" && (
                          <Button size="icon" variant="ghost" className="text-green-600" onClick={() => setMarkPaidId(inv.id)}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={markPaidId !== null} onOpenChange={() => setMarkPaidId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as Paid</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Select payment method:</p>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidId(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={marking}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
