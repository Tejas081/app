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
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Shield, Edit2, Trash2, AlertTriangle, Flame, Zap, Info } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryIcons = {
  fire: Flame,
  electrical: Zap,
  general: Info,
  emergency: AlertTriangle
};

const categoryColors = {
  fire: "bg-red-100 text-red-700",
  electrical: "bg-amber-100 text-amber-700",
  general: "bg-blue-100 text-blue-700",
  emergency: "bg-purple-100 text-purple-700"
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700"
};

const SafetyProtocols = () => {
  const { getAuthHeader, isOwner, isHR } = useAuth();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium"
  });

  const canManage = isOwner || isHR;

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      const response = await axios.get(`${API}/safety-protocols`, getAuthHeader());
      setProtocols(response.data);
    } catch (error) {
      toast.error("Failed to fetch safety protocols");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingProtocol) {
        await axios.put(`${API}/safety-protocols/${editingProtocol.id}`, formData, getAuthHeader());
        toast.success("Protocol updated successfully");
      } else {
        await axios.post(`${API}/safety-protocols`, formData, getAuthHeader());
        toast.success("Protocol created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProtocols();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save protocol");
    }
  };

  const handleDelete = async (protocolId) => {
    if (!window.confirm("Are you sure you want to delete this protocol?")) return;
    try {
      await axios.delete(`${API}/safety-protocols/${protocolId}`, getAuthHeader());
      toast.success("Protocol deleted successfully");
      fetchProtocols();
    } catch (error) {
      toast.error("Failed to delete protocol");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "general",
      priority: "medium"
    });
    setEditingProtocol(null);
  };

  const openEditDialog = (protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      title: protocol.title,
      description: protocol.description,
      category: protocol.category,
      priority: protocol.priority
    });
    setIsDialogOpen(true);
  };

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || protocol.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="safety-protocols-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Safety Protocols</h1>
          <p className="text-slate-500 mt-1">Company safety guidelines and procedures</p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="create-protocol-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProtocol ? "Edit Protocol" : "Add Safety Protocol"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Protocol title"
                    data-testid="protocol-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed safety instructions"
                    rows={4}
                    data-testid="protocol-description-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger data-testid="protocol-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fire">Fire Safety</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger data-testid="protocol-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="protocol-submit-btn">
                    {editingProtocol ? "Update" : "Add"} Protocol
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search protocols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="protocol-search-input"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40" data-testid="protocol-filter-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fire">Fire Safety</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No safety protocols found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProtocols.map(protocol => {
            const CategoryIcon = categoryIcons[protocol.category];
            return (
              <Card key={protocol.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`protocol-card-${protocol.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryColors[protocol.category].replace('text-', 'bg-').replace('700', '100')}`}>
                        <CategoryIcon className={`w-5 h-5 ${categoryColors[protocol.category].split(' ')[1]}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium">{protocol.title}</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Updated by {protocol.created_by_name} • {new Date(protocol.updated_at || protocol.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(protocol)} data-testid={`edit-protocol-${protocol.id}`}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(protocol.id)} data-testid={`delete-protocol-${protocol.id}`}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 whitespace-pre-line">{protocol.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={categoryColors[protocol.category]}>{protocol.category}</Badge>
                    <Badge className={priorityColors[protocol.priority]}>{protocol.priority} priority</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SafetyProtocols;
