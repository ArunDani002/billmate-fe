import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Download, CheckCircle, Trash2 } from "lucide-react";
import { generatePdf } from "@/utils/invoice-pdf";
import api from "@/lib/axios";

function formatCurrency(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { PAID: "bg-green-100 text-green-700 border-green-200", UNPAID: "bg-red-100 text-red-700 border-red-200", PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${cls[status] || ""}`}>{status}</span>;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${params.id}`)
      .then(r => setInvoice(r.data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      const res = await api.put(`/invoices/${params.id}/payment-status`, { paymentStatus: "PAID", paymentMethod });
      setInvoice(res.data);
      setMarkPaidOpen(false);
      toast({ title: "Payment recorded" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setMarking(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice?")) return;
    try { await api.delete(`/invoices/${params.id}`); setLocation("/invoices"); toast({ title: "Invoice deleted" }); }
    catch { toast({ title: "Cannot delete", variant: "destructive" }); }
  };

  const handleDownloadPdf = async () => {
    if (invoice) await generatePdf(invoice, invoice.business, invoice.business?.plan ?? "FREE");
  };

  if (loading) return <Layout><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}</div></Layout>;
  if (!invoice) return <Layout><div className="text-center py-12 text-muted-foreground">Invoice not found</div></Layout>;

  const business = invoice.business || {};
  const customer = invoice.customer || {};

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={invoice.paymentStatus} />
              {invoice.paymentMethod && <span className="text-sm text-muted-foreground">{invoice.paymentMethod.replace("_", " ")}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPdf}><Download className="w-4 h-4" /> PDF</Button>
            {invoice.paymentStatus !== "PAID" && (
              <Button size="sm" className="gap-2" onClick={() => setMarkPaidOpen(true)}><CheckCircle className="w-4 h-4" /> Mark Paid</Button>
            )}
            <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-lg text-primary">{business.businessName || "Your Business"}</div>
                {business.address && <div className="text-sm text-muted-foreground">{business.address}</div>}
                {business.phone && <div className="text-sm text-muted-foreground">📞 {business.phone}</div>}
                {business.email && <div className="text-sm text-muted-foreground">✉ {business.email}</div>}
                {business.gstNumber && <div className="text-sm text-muted-foreground">GST: {business.gstNumber}</div>}
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-sm">Invoice Date: <span className="text-foreground font-medium">{formatDate(invoice.invoiceDate)}</span></div>
                {invoice.dueDate && <div className="text-muted-foreground text-sm">Due Date: <span className="text-foreground font-medium">{formatDate(invoice.dueDate)}</span></div>}
              </div>
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="text-sm text-muted-foreground mb-1">Bill To:</div>
              <div className="font-semibold">{customer.name}</div>
              {customer.phone && <div className="text-sm text-muted-foreground">📞 {customer.phone}</div>}
              {customer.email && <div className="text-sm text-muted-foreground">✉ {customer.email}</div>}
              {customer.address && <div className="text-sm text-muted-foreground">📍 {customer.address}</div>}
              {customer.gstNumber && <div className="text-sm text-muted-foreground">GST: {customer.gstNumber}</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Item</th>
                    <th className="text-right px-4 py-3 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-3 font-medium">GST</th>
                    <th className="text-right px-4 py-3 font-medium">Discount</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><div className="font-medium">{item.name}</div></td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right">{item.gstPercentage}%</td>
                      <td className="px-4 py-3 text-right">{item.discount ? formatCurrency(item.discount) : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t px-4 py-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(Number(invoice.subtotal))}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>GST</span><span>{formatCurrency(Number(invoice.totalTax))}</span></div>
              {invoice.totalDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>−{formatCurrency(Number(invoice.totalDiscount))}</span></div>}
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Grand Total</span><span>{formatCurrency(Number(invoice.grandTotal))}</span></div>
            </div>
          </CardContent>
        </Card>

        {(invoice.notes || invoice.terms) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {invoice.notes && <div><div className="text-sm font-medium mb-1">Notes</div><div className="text-sm text-muted-foreground">{invoice.notes}</div></div>}
              {invoice.terms && <div><div className="text-sm font-medium mb-1">Terms & Conditions</div><div className="text-sm text-muted-foreground">{invoice.terms}</div></div>}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={marking}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
