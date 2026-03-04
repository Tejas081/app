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
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, FolderKanban, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700"
};

const Projects = () => {
  const { user, getAuthHeader, isOwner, isTeamLeader } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    team_leader_id: "",
    status: "active",
    start_date: "",
    end_date: "",
    progress: 0
  });

  const canCreate = isOwner || isTeamLeader;

  useEffect(() => {
    fetchProjects();
    if (canCreate) {
      fetchClients();
      fetchTeamLeaders();
    }
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, getAuthHeader());
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, getAuthHeader());
      setClients(response.data);
    } catch (error) {
      console.error("Failed to fetch clients");
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeader());
      const leaders = response.data.filter(u => u.role === "team_leader" || u.role === "owner");
      setTeamLeaders(leaders);
    } catch (error) {
      console.error("Failed to fetch team leaders");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.team_leader_id) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.client_id) delete payload.client_id;
      
      if (editingProject) {
        await axios.put(`${API}/projects/${editingProject.id}`, payload, getAuthHeader());
        toast.success("Project updated successfully");
      } else {
        await axios.post(`${API}/projects`, payload, getAuthHeader());
        toast.success("Project created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save project");
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}`, getAuthHeader());
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      client_id: "",
      team_leader_id: isTeamLeader ? user.id : "",
      status: "active",
      start_date: "",
      end_date: "",
      progress: 0
    });
    setEditingProject(null);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      client_id: project.client_id || "",
      team_leader_id: project.team_leader_id,
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      progress: project.progress || 0
    });
    setIsDialogOpen(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track project progress</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="create-project-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    data-testid="project-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Project description"
                    data-testid="project-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={formData.client_id || "none"} onValueChange={(value) => setFormData({ ...formData, client_id: value === "none" ? "" : value })}>
                    <SelectTrigger data-testid="project-client-select">
                      <SelectValue placeholder="Select client (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isOwner && (
                  <div className="space-y-2">
                    <Label htmlFor="team_leader">Team Leader *</Label>
                    <Select value={formData.team_leader_id} onValueChange={(value) => setFormData({ ...formData, team_leader_id: value })}>
                      <SelectTrigger data-testid="project-leader-select">
                        <SelectValue placeholder="Select team leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamLeaders.map(leader => (
                          <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      data-testid="project-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      data-testid="project-end-date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="project-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress: {formData.progress}%</Label>
                  <Input
                    id="progress"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                    data-testid="project-progress-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="project-submit-btn">
                    {editingProject ? "Update" : "Create"} Project
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
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="project-search-input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="project-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No projects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <Card key={project.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`project-card-${project.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FolderKanban className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-medium line-clamp-1">{project.name}</CardTitle>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)} data-testid={`edit-project-${project.id}`}>
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(project.id)} data-testid={`delete-project-${project.id}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                )}
                <Badge className={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  {project.client_name && (
                    <p>Client: <span className="text-slate-700">{project.client_name}</span></p>
                  )}
                  <p>Lead: <span className="text-slate-700">{project.team_leader_name || "Not assigned"}</span></p>
                  {(project.start_date || project.end_date) && (
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.start_date && project.end_date && " - "}
                      {project.end_date && new Date(project.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
