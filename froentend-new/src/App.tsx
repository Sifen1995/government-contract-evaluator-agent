import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/hooks/useAuth";
import { LandingPage } from "@/components/landing/LandingPage";
import { LoginPage } from "@/components/auth/LoginPage";
import { RegisterPage } from "@/components/auth/RegisterPage";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/components/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/components/auth/VerifyEmailPage";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { OpportunitiesPage } from "@/components/opportunities/OpportunitiesPage";
import { OpportunityDetailPage } from "@/components/opportunities/OpportunityDetailPage";
import { PipelinePage } from "@/components/pipeline/PipelinePage";
import { AgenciesPage } from "@/components/agencies/AgenciesPage";
import { AgencyDetailPage } from "@/components/agencies/AgencyDetailPage";
import { AnalyticsPage } from "@/components/analytics/AnalyticsPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { OnboardingPage } from "@/components/onboarding/OnboardingPage";
import { UnsubscribePage } from "@/components/unsubscribe/UnsubscribePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <OpportunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities/:id"
              element={
                <ProtectedRoute>
                  <OpportunityDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipeline"
              element={
                <ProtectedRoute>
                  <PipelinePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agencies"
              element={
                <ProtectedRoute>
                  <AgenciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agencies/:id"
              element={
                <ProtectedRoute>
                  <AgencyDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
