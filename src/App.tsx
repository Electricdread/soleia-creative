import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import SharedSession from "./pages/SharedSession";
import CreativeGuide from "./pages/CreativeGuide";
import PrintCreativeGuide from "./pages/PrintCreativeGuide";
import CreativeSession from "./pages/CreativeSession";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminCreative from "./pages/AdminCreative";
import AdminLooks from "./pages/AdminLooks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Route - Login */}
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/creative-guide" element={<ProtectedRoute><CreativeGuide /></ProtectedRoute>} />
              <Route path="/creative-guide/print" element={<ProtectedRoute><PrintCreativeGuide /></ProtectedRoute>} />
              <Route path="/creative/:token" element={<ProtectedRoute><CreativeSession /></ProtectedRoute>} />
              <Route path="/session/:token" element={<ProtectedRoute><SharedSession /></ProtectedRoute>} />
              
              {/* Admin Routes - Require Authentication (admin check handled in components) */}
              <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
              <Route path="/admin/creative" element={<ProtectedRoute requireAdmin><AdminCreative /></ProtectedRoute>} />
              <Route path="/admin/looks" element={<ProtectedRoute requireAdmin><AdminLooks /></ProtectedRoute>} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
