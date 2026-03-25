import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ScrollToTop } from "@/components/ScrollToTop";
import { toast } from "sonner";
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";
import { GlobalSubscriptionGuard } from "@/components/subscription/GlobalSubscriptionGuard";

// ALL pages eager-loaded for instantaneous navigation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Order from "./pages/Order";
import Orders from "./pages/Orders";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import ApiAccess from "./pages/ApiAccess";

// Engagement pages
import EngagementOrder from "./pages/EngagementOrder";
import EngagementOrders from "./pages/EngagementOrders";
import EngagementOrderDetail from "./pages/EngagementOrderDetail";

// Admin pages
import Admin from "./pages/admin/Admin";
import AdminServices from "./pages/admin/AdminServices";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBundles from "./pages/admin/AdminBundles";
import AdminCronMonitor from "./pages/admin/AdminCronMonitor";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminChat from "./pages/admin/AdminChat";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminProviderAccounts from "./pages/admin/AdminProviderAccounts";
import AdminServiceProviderMapping from "./pages/admin/AdminServiceProviderMapping";

// Legal pages
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import RefundPolicy from "./pages/legal/RefundPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min — use cache, don't refetch
      gcTime: 15 * 60 * 1000,          // 15 min cache retention
      refetchOnWindowFocus: false,      // Don't refetch on tab switch
      refetchOnReconnect: false,        // Don't refetch on reconnect
      refetchOnMount: false,            // Use cached data on navigation
      retry: 2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 10000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => {
  useEffect(() => {
    const handleRejection = (e: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", e.reason);
      toast.error("An error occurred. Please try again.");
      e.preventDefault();
    };
    const handleError = (e: ErrorEvent) => {
      console.error("Unhandled error:", e.error || e.message);
    };
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppErrorBoundary>
              <BrowserRouter>
                <ScrollToTop />
                <GlobalSubscriptionGuard>
                  <Routes>
                    {/* User pages */}
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/api-access" element={<ApiAccess />} />

                    {/* Engagement */}
                    <Route path="/engagement-order" element={<EngagementOrder />} />
                    <Route path="/engagement-orders" element={<EngagementOrders />} />
                    <Route path="/engagement-orders/:orderNumber" element={<EngagementOrderDetail />} />

                    {/* Admin */}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/services" element={<AdminServices />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/bundles" element={<AdminBundles />} />
                    <Route path="/admin/cron-monitor" element={<AdminCronMonitor />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                    <Route path="/admin/chat" element={<AdminChat />} />
                    <Route path="/admin/deposits" element={<AdminDeposits />} />
                    <Route path="/admin/provider-accounts" element={<AdminProviderAccounts />} />
                    <Route path="/admin/service-provider-mapping" element={<AdminServiceProviderMapping />} />

                    {/* Legal */}
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/refund" element={<RefundPolicy />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                  </Routes>
                </GlobalSubscriptionGuard>
              </BrowserRouter>
            </AppErrorBoundary>
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
