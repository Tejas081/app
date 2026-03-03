import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Users,
  Clock,
  ShoppingCart,
  FileText,
  DollarSign,
  Shield,
  MessageSquare,
  ClipboardList,
  UserCog,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";

const roleLabels = {
  owner: "Owner",
  finance_manager: "Finance Manager",
  hr: "HR Manager",
  team_leader: "Team Leader",
  employee: "Employee",
  document_manager: "Document Manager"
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavItems = () => {
    const role = user?.role;
    const items = [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "finance_manager", "hr", "team_leader", "employee", "document_manager"] },
      { path: "/tasks", label: "Tasks", icon: ListTodo, roles: ["owner", "team_leader", "employee"] },
      { path: "/projects", label: "Projects", icon: FolderKanban, roles: ["owner", "team_leader", "finance_manager"] },
      { path: "/clients", label: "Clients", icon: Users, roles: ["owner", "team_leader"] },
      { path: "/attendance", label: "Attendance", icon: Clock, roles: ["owner", "hr", "employee"] },
      { path: "/purchase-requests", label: "Purchase Requests", icon: ShoppingCart, roles: ["owner", "hr", "finance_manager", "team_leader", "employee"] },
      { path: "/documents", label: "Documents", icon: FileText, roles: ["owner", "hr", "document_manager", "employee"] },
      { path: "/finance", label: "Finance", icon: DollarSign, roles: ["owner", "finance_manager"] },
      { path: "/safety-protocols", label: "Safety Protocols", icon: Shield, roles: ["owner", "hr", "team_leader", "employee", "document_manager"] },
      { path: "/messages", label: "Messages", icon: MessageSquare, roles: ["owner", "hr", "team_leader", "employee", "document_manager", "finance_manager"] },
      { path: "/daily-reports", label: "Daily Reports", icon: ClipboardList, roles: ["owner", "team_leader", "employee"] },
      { path: "/users", label: "User Management", icon: UserCog, roles: ["owner", "hr"] },
    ];
    return items.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-heading font-bold text-lg text-slate-900">Taron Tech</span>
            </Link>
            <button 
              className="lg:hidden p-1 hover:bg-slate-100 rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                  data-testid={`nav-${item.path.slice(1)}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-white text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500">{roleLabels[user?.role]}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded-md"
              onClick={() => setSidebarOpen(true)}
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            <div className="hidden lg:block">
              <h1 className="font-heading font-semibold text-lg text-slate-900">
                {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5 text-slate-600" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
