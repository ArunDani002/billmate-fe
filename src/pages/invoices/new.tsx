import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Lock } from "lucide-react";
import api from "@/lib/axios";

const PLAN_TEMPLATES: Record<string, number[]> = { FREE: [1], STARTER: [1,2,3], PRO: [1,2,3,4], BUSINESS: [1,2,3,4] };
const TEMPLATE_NAMES: Record<number, string> = { 1: "Classic", 2: "Modern", 3: "Minimal", 4: "Professional" };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

interface InvoiceItem { name: string; quantity: number; unitPrice: number; gstPercentage: number; discount: number; }
interface FormData { customerId: string; invoiceDate: string; dueDate?: string; templateId: number; paymentStatus: string; paymentMethod?: string; notes?: string; terms?: string; items: InvoiceItem[]; }

export default function NewInvoicePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { invoiceDate: today, templateId: 1, paymentStatus: "UNPAID", items: [{ name: "", quantity: 1, unitPrice: 0, gstPercentage: 18, discount: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const templateId = watch("templateId");

  useEffect(() => {
    api.get("/auth/me").then(r => setPlan(r.data.plan || "FREE"));
    api.get("/customers").then(r => setCustomers(r.data.customers));
  }, []);

  useEffect(() => {
    if (productSearch) api.get("/products", { params: { search: productSearch } }).then(r => setProducts(r.data.products));
    else setProducts([]);
  }, [productSearch]);

  const subtotal = watchedItems.reduce((s, i) => s + Math.max(0, (Number(i.quantity)||0)*(Number(i.unitPrice)||0)-(Number(i.discount)||0)), 0);
  const gstTotal = watchedItems.reduce((s, i) => { const base = Math.max(0, (Number(i.quantity)||0)*(Number(i.unitPrice)||0)-(Number(i.discount)||0)); return s + base*((Number(i.gstPercentage)||0)/100); }, 0);
  const grandTotal = subtotal + gstTotal;

  const allowedTemplates = PLAN_TEMPLATES[plan] || [1];

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await api.post("/invoices", {
        ...data,
        templateId: Number(data.templateId),
        items: data.items.map(i => ({ name: i.name, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), gstPercentage: Number(i.gstPercentage), discount: Number(i.discount)||0 })),
      });
      toast({ title: "Invoice created!", description: `Invoice ${res.data.invoiceNumber} created` });
      setLocation(`/invoices/${res.data.id}`);
    } catch (err: any) {
      toast({ title: "Failed", description: err.response?.data?.error || "Please try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addFromProduct = (p: any) => { append({ name: p.name, quantity: 1, unitPrice: p.price, gstPercentage: p.gstPercentage, discount: 0 }); setProductSearch(""); };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/invoices")}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">New Invoice</h1>
            <p className="text-muted-foreground text-sm">Plan: <Badge variant="secondary">{plan}</Badge></p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Controller name="customerId" control={control} rules={{ required: "Select a customer" }} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Invoice Date *</Label><Input type="date" {...register("invoiceDate", { required: true })} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" {...register("dueDate")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Controller name="paymentStatus" control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Controller name="paymentMethod" control={control} render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={v => field.onChange(v === "none" ? undefined : v)}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Invoice Template</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(t => {
                  const locked = !allowedTemplates.includes(t);
                  return (
                    <button type="button" key={t} disabled={locked} onClick={() => !locked && setValue("templateId", t)}
                      className={`relative border-2 rounded-xl p-4 text-left transition-all ${templateId === t ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"} ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                      <div className="text-sm font-medium">{TEMPLATE_NAMES[t]}</div>
                      <div className="text-xs text-muted-foreground mt-1">Template {t}</div>
                      {locked && <div className="absolute top-2 right-2"><Lock className="w-3 h-3 text-muted-foreground" /></div>}
                    </button>
                  );
                })}
              </div>
              {allowedTemplates.length < 4 && <p className="text-xs text-muted-foreground mt-2">Upgrade your plan to unlock more templates</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Input className="w-40 text-sm h-8" placeholder="Search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                  {productSearch && products.length > 0 && (
                    <div className="absolute top-9 left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {products.map(p => (
                        <button key={p.id} type="button" onClick={() => addFromProduct(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between">
                          <span className="truncate">{p.name}</span>
                          <span className="text-muted-foreground ml-2 shrink-0">₹{p.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => append({ name: "", quantity: 1, unitPrice: 0, gstPercentage: 18, discount: 0 })}>
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input className="flex-1" placeholder="Item name *" {...register(`items.${idx}.name`, { required: true })} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => remove(idx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div><Label className="text-xs">Qty</Label><Input type="number" min="1" step="0.01" {...register(`items.${idx}.quantity`, { required: true, min: 0.01 })} /></div>
                    <div><Label className="text-xs">Unit Price (₹)</Label><Input type="number" min="0" step="0.01" {...register(`items.${idx}.unitPrice`, { required: true, min: 0 })} /></div>
                    <div>
                      <Label className="text-xs">GST %</Label>
                      <Controller name={`items.${idx}.gstPercentage`} control={control} render={({ field }) => (
                        <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["0","5","12","18","28"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div><Label className="text-xs">Discount (₹)</Label><Input type="number" min="0" step="0.01" {...register(`items.${idx}.discount`)} /></div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {(() => {
                      const item = watchedItems[idx];
                      const base = Math.max(0, (Number(item?.quantity)||0)*(Number(item?.unitPrice)||0)-(Number(item?.discount)||0));
                      const gst = base*((Number(item?.gstPercentage)||0)/100);
                      return `${formatCurrency(base)} + ${formatCurrency(gst)} GST = ${formatCurrency(base+gst)}`;
                    })()}
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1 text-right">
                <div className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</div>
                <div className="text-sm text-muted-foreground">GST: {formatCurrency(gstTotal)}</div>
                <div className="text-xl font-bold">Total: {formatCurrency(grandTotal)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Additional Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Notes</Label><Input {...register("notes")} placeholder="Thank you for your business!" /></div>
              <div className="space-y-2"><Label>Terms & Conditions</Label><Input {...register("terms")} placeholder="Payment due within 30 days" /></div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setLocation("/invoices")}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Invoice"}</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
