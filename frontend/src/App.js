import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import SetupOwner from "./pages/SetupOwner";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Attendance from "./pages/Attendance";
import PurchaseRequests from "./pages/PurchaseRequests";
import Documents from "./pages/Documents";
import Finance from "./pages/Finance";
import SafetyProtocols from "./pages/SafetyProtocols";
import Messages from "./pages/Messages";
import DailyReports from "./pages/DailyReports";
import Users from "./pages/Users";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<SetupOwner />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/tasks" element={
        <ProtectedRoute allowedRoles={["owner", "team_leader", "employee"]}>
          <Tasks />
        </ProtectedRoute>
      } />
      
      <Route path="/projects" element={
        <ProtectedRoute allowedRoles={["owner", "team_leader", "finance_manager"]}>
          <Projects />
        </ProtectedRoute>
      } />
      
      <Route path="/clients" element={
        <ProtectedRoute allowedRoles={["owner", "team_leader"]}>
          <Clients />
        </ProtectedRoute>
      } />
      
      <Route path="/attendance" element={
        <ProtectedRoute allowedRoles={["owner", "hr", "employee"]}>
          <Attendance />
        </ProtectedRoute>
      } />
      
      <Route path="/purchase-requests" element={
        <ProtectedRoute>
          <PurchaseRequests />
        </ProtectedRoute>
      } />
      
      <Route path="/documents" element={
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      } />
      
      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={["owner", "finance_manager"]}>
          <Finance />
        </ProtectedRoute>
      } />
      
      <Route path="/safety-protocols" element={
        <ProtectedRoute>
          <SafetyProtocols />
        </ProtectedRoute>
      } />
      
      <Route path="/messages" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      
      <Route path="/daily-reports" element={
        <ProtectedRoute>
          <DailyReports />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={["owner", "hr"]}>
          <Users />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
