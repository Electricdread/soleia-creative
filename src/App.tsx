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
import DeliveryGuide from "./pages/DeliveryGuide";

import SessionDeliveryGuide from "./pages/SessionDeliveryGuide";
import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminCreative from "./pages/AdminCreative";
import AdminLooks from "./pages/AdminLooks";
import AdminUsers from "./pages/AdminUsers";
import AdminProposals from "./pages/AdminProposals";
import AdminCalendar from "./pages/AdminCalendar";
import AdminEmailPreviews from "./pages/AdminEmailPreviews";
import AdminStorage from "./pages/AdminStorage";
import ClientProposal from "./pages/ClientProposal";
import OfficePortal from "./pages/OfficePortal";
import Tutorial from "./pages/Tutorial";
import NotFound from "./pages/NotFound";
import ShowBloxPreview from "./pages/ShowBloxPreview";
import SharedLookBook from "./pages/SharedLookBook";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/delivery-guide" element={<DeliveryGuide />} />
              
              <Route path="/delivery/:token" element={<SessionDeliveryGuide />} />
              <Route path="/looks/:token" element={<SharedLookBook />} />
              
              {/* Root redirects to Admin Portal */}
              <Route path="/" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/creative-guide" element={<ProtectedRoute requireAdmin><CreativeGuide /></ProtectedRoute>} />
              <Route path="/creative-guide/print" element={<ProtectedRoute requireAdmin><PrintCreativeGuide /></ProtectedRoute>} />
              <Route path="/creative/:token" element={<CreativeSession />} />
              <Route path="/session/:token" element={<ProtectedRoute><SharedSession /></ProtectedRoute>} />
              
              {/* Admin Routes - Require Admin Role */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPortal /></ProtectedRoute>} />
              <Route path="/admin/creative" element={<ProtectedRoute requireAdmin><AdminCreative /></ProtectedRoute>} />
              <Route path="/admin/looks" element={<ProtectedRoute requireAdmin><AdminLooks /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/proposals" element={<ProtectedRoute requireAdmin><AdminProposals /></ProtectedRoute>} />
              <Route path="/admin/calendar" element={<ProtectedRoute requireAdmin><AdminCalendar /></ProtectedRoute>} />
              <Route path="/admin/email-previews" element={<ProtectedRoute requireAdmin><AdminEmailPreviews /></ProtectedRoute>} />
              <Route path="/admin/storage" element={<ProtectedRoute requireAdmin><AdminStorage /></ProtectedRoute>} />
              
              {/* Public Proposal Page */}
              <Route path="/proposal/:token" element={<ClientProposal />} />
              
              {/* ShowBlox Content Preview */}
              <Route path="/preview/:token" element={<ShowBloxPreview />} />
              
              {/* Operator Office Portal - Email-locked to luisdreams@me.com */}
              <Route path="/office" element={<OfficePortal />} />
              
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
