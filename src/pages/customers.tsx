import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, User, Pencil, Trash2, Phone, Mail, MapPin } from "lucide-react";
import api from "@/lib/axios";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", gstNumber: "" });
  const { toast } = useToast();

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [f]: e.target.value }));

  function load() {
    setLoading(true);
    api.get("/customers", { params: { search: search || undefined } })
      .then(r => { setCustomers(r.data.customers); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditId(null); setForm({ name: "", phone: "", email: "", address: "", gstNumber: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", gstNumber: c.gstNumber || "" }); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        toast({ title: "Customer updated" });
      } else {
        await api.post("/customers", form);
        toast({ title: "Customer added" });
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
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}`);
      toast({ title: "Customer deleted" });
      load();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} customers</p>
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" /> Add Customer</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}</div>
        ) : customers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No customers yet</p>
            <Button className="mt-3" size="sm" onClick={openCreate}>Add first customer</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {customers.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {c.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{c.phone}</span>}
                          {c.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{c.email}</span>}
                          {c.address && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{c.address}</span>}
                        </div>
                        {c.gstNumber && <div className="text-xs text-muted-foreground mt-1">GST: {c.gstNumber}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle>{editId ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Name *</Label><Input placeholder="Customer name" value={form.name} onChange={set("name")} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="9876543210" value={form.phone} onChange={set("phone")} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="customer@email.com" value={form.email} onChange={set("email")} /></div>
              <div className="space-y-2"><Label>Address</Label><Input placeholder="Full address" value={form.address} onChange={set("address")} /></div>
              <div className="space-y-2"><Label>GST Number</Label><Input placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={set("gstNumber")} /></div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{editId ? "Update" : "Add Customer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
