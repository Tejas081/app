import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { 
  Users, 
  FolderKanban, 
  ListTodo, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, color = "primary", trend, trendValue }) => (
  <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-heading font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-status-success' : 'text-status-error'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color === 'primary' ? 'bg-blue-50 text-primary' : color === 'success' ? 'bg-green-50 text-status-success' : color === 'warning' ? 'bg-amber-50 text-status-warning' : 'bg-red-50 text-status-error'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, getAuthHeader } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API}/dashboard/stats`, getAuthHeader());
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getAuthHeader]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const renderOwnerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={stats.total_users || 0} icon={Users} color="primary" />
      <StatCard title="Active Projects" value={stats.total_projects || 0} icon={FolderKanban} color="success" />
      <StatCard title="Total Tasks" value={stats.total_tasks || 0} icon={ListTodo} color="warning" />
      <StatCard title="Pending Tasks" value={stats.pending_tasks || 0} icon={AlertCircle} color="error" />
      <StatCard title="Total Clients" value={stats.total_clients || 0} icon={Users} color="primary" />
      <StatCard title="Pending Requests" value={stats.pending_requests || 0} icon={ShoppingCart} color="warning" />
      <StatCard title="Total Income" value={formatCurrency(stats.total_income)} icon={TrendingUp} color="success" />
      <StatCard title="Total Expenses" value={formatCurrency(stats.total_expenses)} icon={TrendingDown} color="error" />
    </div>
  );

  const renderFinanceManagerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Total Income" value={formatCurrency(stats.total_income)} icon={TrendingUp} color="success" />
      <StatCard title="Total Expenses" value={formatCurrency(stats.total_expenses)} icon={TrendingDown} color="error" />
      <StatCard title="Pending Requests" value={stats.pending_requests || 0} icon={ShoppingCart} color="warning" />
    </div>
  );

  const renderHRDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Employees" value={stats.total_employees || 0} icon={Users} color="primary" />
      <StatCard title="Today's Attendance" value={stats.today_attendance || 0} icon={Clock} color="success" />
      <StatCard title="Pending Requests" value={stats.pending_requests || 0} icon={ShoppingCart} color="warning" />
      <StatCard title="Total Documents" value={stats.total_documents || 0} icon={FileText} color="primary" />
    </div>
  );

  const renderTeamLeaderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="My Projects" value={stats.my_projects || 0} icon={FolderKanban} color="primary" />
      <StatCard title="Assigned Tasks" value={stats.my_tasks || 0} icon={ListTodo} color="success" />
      <StatCard title="Pending Tasks" value={stats.pending_tasks || 0} icon={AlertCircle} color="warning" />
      <StatCard title="My Clients" value={stats.my_clients || 0} icon={Users} color="primary" />
    </div>
  );

  const renderEmployeeDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="My Tasks" value={stats.my_tasks || 0} icon={ListTodo} color="primary" />
      <StatCard title="Pending Tasks" value={stats.pending_tasks || 0} icon={AlertCircle} color="warning" />
      <StatCard title="Completed Tasks" value={stats.completed_tasks || 0} icon={CheckCircle2} color="success" />
    </div>
  );

  const renderDocumentManagerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Documents" value={stats.total_documents || 0} icon={FileText} color="primary" />
      <StatCard title="Engineering Docs" value={stats.engineering_docs || 0} icon={FileText} color="success" />
      <StatCard title="HR Documents" value={stats.hr_docs || 0} icon={FileText} color="warning" />
    </div>
  );

  const renderDashboard = () => {
    switch (user?.role) {
      case "owner":
        return renderOwnerDashboard();
      case "finance_manager":
        return renderFinanceManagerDashboard();
      case "hr":
        return renderHRDashboard();
      case "team_leader":
        return renderTeamLeaderDashboard();
      case "employee":
        return renderEmployeeDashboard();
      case "document_manager":
        return renderDocumentManagerDashboard();
      default:
        return <p>No dashboard available for your role.</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleLabels = {
    owner: "Owner",
    finance_manager: "Finance Manager",
    hr: "HR Manager",
    team_leader: "Team Leader",
    employee: "Employee",
    document_manager: "Document Manager"
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-slate-500 mt-1">
          {roleLabels[user?.role]} Dashboard • Here's what's happening today.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
