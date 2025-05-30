
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AuthRequired from "./components/AuthRequired";
import MachinesPage from "./pages/MachinesPage";
import ToolingPage from "./pages/ToolingPage";
import MaterialsPage from "./pages/MaterialsPage";
import PartsPage from "./pages/PartsPage";
import PartDetailPage from "./pages/PartDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/app" element={<AuthRequired><Navigate to="/app/dashboard" replace /></AuthRequired>} />
          <Route path="/app/dashboard" element={<AuthRequired><Dashboard /></AuthRequired>} />
          <Route path="/app/machines" element={<AuthRequired><MachinesPage /></AuthRequired>} />
          <Route path="/app/tooling" element={<AuthRequired><ToolingPage /></AuthRequired>} />
          <Route path="/app/materials" element={<AuthRequired><MaterialsPage /></AuthRequired>} />
          <Route path="/app/parts" element={<AuthRequired><PartsPage /></AuthRequired>} />
          <Route path="/app/parts/:id" element={<AuthRequired><PartDetailPage /></AuthRequired>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
