import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FloatingThemeToggle } from "@/components/FloatingThemeToggle";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LegacyGuideRedirect } from "@/components/LegacyGuideRedirect";
import Index from "./pages/Index";
import SharedSession from "./pages/SharedSession";
import CreativeGuideServices from "./pages/CreativeGuideServices";
import ElevatorDisplayGuide from "./pages/ElevatorDisplayGuide";
import TVDisplayGuide from "./pages/TVDisplayGuide";
import TickerDisplayGuide from "./pages/TickerDisplayGuide";
import DocumentViewer from "./pages/DocumentViewer";
import PrintCreativeGuide from "./pages/PrintCreativeGuide";
import ContentDelivery from "./pages/ContentDelivery";
import CreativeSession from "./pages/CreativeSession";


import AdminLogin from "./pages/AdminLogin";
import AdminPortal from "./pages/AdminPortal";
import AdminCreative from "./pages/AdminCreative";
import AdminUsers from "./pages/AdminUsers";
import AdminProposals from "./pages/AdminProposals";
import AdminJobs from "./pages/AdminJobs";
import AdminJobDetail from "./pages/AdminJobDetail";
import AdminCalendar from "./pages/AdminCalendar";
import AdminEmailPreviews from "./pages/AdminEmailPreviews";
import AdminStorage from "./pages/AdminStorage";
import AdminPackets from "./pages/AdminPackets";
import ClientPacket from "./pages/ClientPacket";
import ClientProposal from "./pages/ClientProposal";
import OfficePortal from "./pages/OfficePortal";
import Tutorial from "./pages/Tutorial";
import NotFound from "./pages/NotFound";
import ShowBloxPreview from "./pages/ShowBloxPreview";
import SharedLookBook from "./pages/SharedLookBook";
import RateCard from "./pages/RateCard";

// Lazy-loaded so its heavy 3D (three.js) bundle only downloads when this page
// is opened — keeps all other pages (proposals, sessions) light.
const VenueVideoMapping = lazy(() => import("./pages/VenueVideoMapping"));
const SessionVideoMapping = lazy(() => import("./pages/SessionVideoMapping"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Dark is the house style — the gold reads against it the way it was
        designed to, and it is what the studio works in. Light stays fully
        supported behind the toggle. */}
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <FloatingThemeToggle />
            <Routes>
              {/* Public Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/looks/:token" element={<SharedLookBook />} />
              <Route path="/rate-card" element={<RateCard />} />
              
              {/* Root redirects to Admin Portal */}
              <Route path="/" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
              
              {/* Protected Routes - Require Authentication */}
              {/* Services is the Creative Guide. The older landing page that lived
                  here (CreativeGuideView, retired 2026-08-26) is in git history;
                  every "home" link in the app still points at /creative-guide,
                  so the bare route sends them on. */}
              <Route path="/creative-guide" element={<Navigate to="/creative-guide/services" replace />} />
              <Route path="/creativeguide/*" element={<LegacyGuideRedirect />} />
              <Route path="/creative-guide/services" element={<CreativeGuideServices />} />
              <Route path="/creative-guide/tv" element={<TVDisplayGuide />} />
              <Route path="/creative-guide/elevator" element={<ElevatorDisplayGuide />} />
              <Route path="/creative-guide/ticker" element={<TickerDisplayGuide />} />
              <Route path="/creative-guide/doc/:slug" element={<DocumentViewer />} />
              <Route path="/creative-guide/print" element={<PrintCreativeGuide />} />
              <Route path="/creative-guide/content-delivery" element={<ContentDelivery />} />
              <Route path="/creative-guide/video-mapping" element={<Suspense fallback={<RouteFallback />}><VenueVideoMapping /></Suspense>} />
              <Route path="/session/:token/video-mapping" element={<Suspense fallback={<RouteFallback />}><SessionVideoMapping /></Suspense>} />
              <Route path="/creative/:token" element={<CreativeSession />} />
              <Route path="/session/:token" element={<ProtectedRoute><SharedSession /></ProtectedRoute>} />
              
              {/* Admin Routes - Require Admin Role */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPortal /></ProtectedRoute>} />
              <Route path="/admin/creative" element={<ProtectedRoute requireAdmin><AdminCreative /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/jobs" element={<ProtectedRoute requireAdmin><AdminJobs /></ProtectedRoute>} />
              <Route path="/admin/jobs/:id" element={<ProtectedRoute requireAdmin><AdminJobDetail /></ProtectedRoute>} />
              <Route path="/admin/proposals" element={<ProtectedRoute requireAdmin><AdminProposals /></ProtectedRoute>} />
              <Route path="/admin/calendar" element={<ProtectedRoute requireAdmin><AdminCalendar /></ProtectedRoute>} />
              <Route path="/admin/email-previews" element={<ProtectedRoute requireAdmin><AdminEmailPreviews /></ProtectedRoute>} />
              <Route path="/admin/storage" element={<ProtectedRoute requireAdmin><AdminStorage /></ProtectedRoute>} />
              <Route path="/admin/packets" element={<ProtectedRoute requireAdmin><AdminPackets /></ProtectedRoute>} />

              {/* Public Packet Page */}
              <Route path="/packet/:token" element={<ClientPacket />} />

              {/* Public Proposal Page */}
              <Route path="/proposal/:token" element={<ClientProposal />} />
              
              {/* ShowBlox Content Preview */}
              <Route path="/preview/:token" element={<ShowBloxPreview />} />
              
              {/* Operator Office Portal - Admin role required + email-locked to operator */}
              <Route path="/office" element={<ProtectedRoute requireAdmin><OfficePortal /></ProtectedRoute>} />
              
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
