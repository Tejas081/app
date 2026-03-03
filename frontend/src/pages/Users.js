import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { Plus, Search, UserPlus, Edit2, Trash2, Shield, Users } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const roleColors = {
  owner: "bg-purple-100 text-purple-700",
  finance_manager: "bg-green-100 text-green-700",
  hr: "bg-blue-100 text-blue-700",
  team_leader: "bg-amber-100 text-amber-700",
  employee: "bg-slate-100 text-slate-700",
  document_manager: "bg-pink-100 text-pink-700"
};

const roleLabels = {
  owner: "Owner",
  finance_manager: "Finance Manager",
  hr: "HR Manager",
  team_leader: "Team Leader",
  employee: "Employee",
  document_manager: "Document Manager"
};

const UserManagement = () => {
  const { user, getAuthHeader, isOwner } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    phone: "",
    department: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeader());
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingUser) {
        const updates = { ...formData };
        if (!updates.password) delete updates.password;
        await axios.put(`${API}/users/${editingUser.id}`, updates, getAuthHeader());
        toast.success("User updated successfully");
      } else {
        await axios.post(`${API}/auth/register`, formData, getAuthHeader());
        toast.success("User created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save user");
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?")) return;
    try {
      await axios.delete(`${API}/users/${userId}`, getAuthHeader());
      toast.success("User deactivated");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to deactivate user");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      phone: "",
      department: ""
    });
    setEditingUser(null);
  };

  const openEditDialog = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      phone: u.phone || "",
      department: u.department || ""
    });
    setIsDialogOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system users and their roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover" data-testid="add-user-btn">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  data-testid="user-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@taron.com"
                  data-testid="user-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? "New Password (leave blank to keep)" : "Password *"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  data-testid="user-password-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="team_leader">Team Leader</SelectItem>
                    <SelectItem value="hr">HR Manager</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="document_manager">Document Manager</SelectItem>
                    {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    data-testid="user-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Engineering"
                    data-testid="user-department-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="user-submit-btn">
                  {editingUser ? "Update" : "Create"} User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="user-search-input"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48" data-testid="user-filter-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="finance_manager">Finance Manager</SelectItem>
            <SelectItem value="hr">HR Manager</SelectItem>
            <SelectItem value="team_leader">Team Leader</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="document_manager">Document Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header">User</TableHead>
                    <TableHead className="table-header">Role</TableHead>
                    <TableHead className="table-header">Department</TableHead>
                    <TableHead className="table-header">Phone</TableHead>
                    <TableHead className="table-header">Status</TableHead>
                    <TableHead className="table-header text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id} className="hover:bg-slate-50/50" data-testid={`user-row-${u.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">{u.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[u.role]}>
                          <Shield className="w-3 h-3 mr-1" />
                          {roleLabels[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{u.department || "-"}</TableCell>
                      <TableCell className="text-slate-600">{u.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(u)} data-testid={`edit-user-${u.id}`}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          {isOwner && u.id !== user.id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeactivate(u.id)} data-testid={`deactivate-user-${u.id}`}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
