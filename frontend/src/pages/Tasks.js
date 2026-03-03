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
import { Plus, Search, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const priorityColors = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"
};

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-slate-100 text-slate-700"
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
  on_hold: Clock
};

const Tasks = () => {
  const { user, getAuthHeader, isOwner, isTeamLeader } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    project_id: "",
    priority: "medium",
    status: "pending",
    due_date: ""
  });

  const canCreateTask = isOwner || isTeamLeader;

  useEffect(() => {
    fetchTasks();
    if (canCreateTask) {
      fetchTeamMembers();
      fetchProjects();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, getAuthHeader());
      setTasks(response.data);
    } catch (error) {
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${API}/team-members`, getAuthHeader());
      setTeamMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch team members");
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, getAuthHeader());
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assigned_to) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      if (editingTask) {
        await axios.put(`${API}/tasks/${editingTask.id}`, formData, getAuthHeader());
        toast.success("Task updated successfully");
      } else {
        await axios.post(`${API}/tasks`, formData, getAuthHeader());
        toast.success("Task created successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save task");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${API}/tasks/${taskId}`, getAuthHeader());
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus }, getAuthHeader());
      toast.success("Task status updated");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assigned_to: "",
      project_id: "",
      priority: "medium",
      status: "pending",
      due_date: ""
    });
    setEditingTask(null);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assigned_to: task.assigned_to,
      project_id: task.project_id || "",
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || ""
    });
    setIsDialogOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
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
    <div className="space-y-6" data-testid="tasks-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage and track your tasks</p>
        </div>
        {canCreateTask && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="create-task-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                    data-testid="task-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description"
                    data-testid="task-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assign To *</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger data-testid="task-assignee-select">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger data-testid="task-project-select">
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger data-testid="task-priority-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger data-testid="task-status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    data-testid="task-due-date-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="task-submit-btn">
                    {editingTask ? "Update" : "Create"} Task
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
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="task-search-input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="task-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const StatusIcon = statusIcons[task.status];
            return (
              <Card key={task.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-medium line-clamp-2">{task.title}</CardTitle>
                    {canCreateTask && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(task)} data-testid={`edit-task-${task.id}`}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(task.id)} data-testid={`delete-task-${task.id}`}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    <Badge className={statusColors[task.status]}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>Assigned to: <span className="text-slate-700">{task.assigned_to_name || "Unknown"}</span></p>
                    <p>By: <span className="text-slate-700">{task.assigned_by_name || "Unknown"}</span></p>
                    {task.due_date && (
                      <p>Due: <span className="text-slate-700">{new Date(task.due_date).toLocaleDateString()}</span></p>
                    )}
                  </div>
                  {!canCreateTask && (
                    <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                      <SelectTrigger className="mt-2" data-testid={`update-status-${task.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
