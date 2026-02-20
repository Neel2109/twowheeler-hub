import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CreateRO from "@/pages/CreateRO";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import EditRO from "@/pages/EditRO";
import SearchPage from "@/pages/SearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateRO />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/:id/edit" element={<EditRO />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
