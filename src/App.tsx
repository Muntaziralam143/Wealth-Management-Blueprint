import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
<<<<<<< HEAD
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Portfolio from "./pages/Portfolio";
import Simulations from "./pages/Simulations";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
=======
>>>>>>> 779bb41 (Changes)
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
<<<<<<< HEAD
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/simulations" element={<Simulations />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
=======
              <Route path="/login" element={<Landing />} />
              <Route path="/register" element={<Landing />} />
              <Route path="/dashboard" element={<Landing />} />
              <Route path="/goals" element={<Landing />} />
              <Route path="/portfolio" element={<Landing />} />
              <Route path="/simulations" element={<Landing />} />
              <Route path="/reports" element={<Landing />} />
              <Route path="/profile" element={<Landing />} />
>>>>>>> 779bb41 (Changes)
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
