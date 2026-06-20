import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, Pencil, Trash2 } from "lucide-react";
import api from "@/lib/axios";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const BLANK = { name: "", type: "PRODUCT", price: "", gstPercentage: "18", unit: "", description: "", stockQuantity: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const { toast } = useToast();

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setSelect = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  function load() {
    setLoading(true);
    api.get("/products", { params: { search: search || undefined, type: typeFilter || undefined } })
      .then(r => { setProducts(r.data.products); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, typeFilter]);

  const openCreate = () => { setEditId(null); setForm({ ...BLANK }); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, type: p.type, price: String(p.price), gstPercentage: String(p.gstPercentage), unit: p.unit || "", description: p.description || "", stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, type: form.type, price: Number(form.price), gstPercentage: Number(form.gstPercentage), unit: form.unit || undefined, description: form.description || undefined, stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : undefined };
    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
        toast({ title: "Item updated" });
      } else {
        await api.post("/products", payload);
        toast({ title: "Item added" });
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.response?.data?.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try { await api.delete(`/products/${id}`); toast({ title: "Deleted" }); load(); }
    catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products & Services</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} items</p>
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add Item</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter || "all"} onValueChange={v => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PRODUCT">Product</SelectItem>
              <SelectItem value="SERVICE">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : products.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No items yet</p>
            <Button className="mt-3" size="sm" onClick={openCreate}>Add first item</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{p.name}</span>
                        <Badge variant={p.type === "PRODUCT" ? "default" : "secondary"} className="text-[10px] shrink-0">{p.type}</Badge>
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-bold text-primary">{formatCurrency(p.price)}</span>
                        <span className="text-xs text-muted-foreground">+{p.gstPercentage}% GST</span>
                        {p.unit && <span className="text-xs text-muted-foreground">per {p.unit}</span>}
                      </div>
                      {p.stockQuantity != null && <div className="text-xs text-muted-foreground mt-1">Stock: {p.stockQuantity}</div>}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Name *</Label><Input placeholder="Item name" value={form.name} onChange={set("name")} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setSelect("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Unit</Label><Input placeholder="pcs, kg, hr..." value={form.unit} onChange={set("unit")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Price (₹) *</Label><Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={set("price")} required /></div>
                <div className="space-y-2">
                  <Label>GST %</Label>
                  <Select value={form.gstPercentage} onValueChange={v => setSelect("gstPercentage", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["0","5","12","18","28"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Stock Quantity</Label><Input type="number" placeholder="Leave blank for services" value={form.stockQuantity} onChange={set("stockQuantity")} /></div>
              <div className="space-y-2"><Label>Description</Label><Input placeholder="Optional description" value={form.description} onChange={set("description")} /></div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{editId ? "Update" : "Add Item"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
