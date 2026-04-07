import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./features/admin/AdminDashboardPage";
import CoordinatorDashboardPage from "./features/coordinator/CoordinatorDashboardPage";
import StudentDashboardPage from "./features/student/StudentDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user!.role === "admin" ? "admin" : user!.role === "coordinator" ? "coordinator" : "student"}`} replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/coordinator/*" element={<ProtectedRoute allowedRoles={["coordinator"]}><CoordinatorDashboardPage /></ProtectedRoute>} />
      <Route path="/student/*" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
