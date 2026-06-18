import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CreateRO from "@/pages/CreateRO";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import EditRO from "@/pages/EditRO";
import SearchPage from "@/pages/SearchPage";
import Reports from "@/pages/Reports";
import NotFound from "./pages/NotFound";
import InventoryList from "@/pages/inventory/InventoryList";
import InventoryCreate from "@/pages/inventory/InventoryCreate";
import InventoryEdit from "@/pages/inventory/InventoryEdit";
import MechanicList from "@/pages/mechanics/MechanicList";
import MechanicCreate from "@/pages/mechanics/MechanicCreate";
import MechanicEdit from "@/pages/mechanics/MechanicEdit";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateRO />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/orders/:id/edit" element={<EditRO />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/create" element={<InventoryCreate />} />
        <Route path="/inventory/:id/edit" element={<InventoryEdit />} />
        <Route path="/mechanics" element={<MechanicList />} />
        <Route path="/mechanics/create" element={<MechanicCreate />} />
        <Route path="/mechanics/:id/edit" element={<MechanicEdit />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
