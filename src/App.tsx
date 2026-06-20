import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import InvoicesPage from "@/pages/invoices";
import NewInvoicePage from "@/pages/invoices/new";
import InvoiceDetailPage from "@/pages/invoices/detail";
import CustomersPage from "@/pages/customers";
import ProductsPage from "@/pages/products";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminDashboardPage from "@/pages/admin/index";
import AdminBusinessesPage from "@/pages/admin/businesses";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/invoices/new" component={NewInvoicePage} />
      <Route path="/invoices/:id" component={InvoiceDetailPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/businesses" component={AdminBusinessesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
