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
import { Plus, Search, ShoppingCart, Check, X, Clock, DollarSign } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700"
};

const urgencyColors = {
  low: "bg-slate-100 text-slate-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"
};

const PurchaseRequests = () => {
  const { user, getAuthHeader, isOwner, isHR } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "equipment",
    urgency: "normal"
  });

  const canApprove = isOwner || isHR;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API}/purchase-requests`, getAuthHeader());
      setRequests(response.data);
    } catch (error) {
      toast.error("Failed to fetch purchase requests");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await axios.post(`${API}/purchase-requests`, {
        ...formData,
        amount: parseFloat(formData.amount)
      }, getAuthHeader());
      toast.success("Purchase request submitted successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit request");
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.put(`${API}/purchase-requests/${requestId}/approve`, null, getAuthHeader());
      toast.success("Request approved");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await axios.put(`${API}/purchase-requests/${requestId}/deny`, null, getAuthHeader());
      toast.success("Request denied");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to deny request");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      category: "equipment",
      urgency: "normal"
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
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
    <div className="space-y-6" data-testid="purchase-requests-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Purchase Requests</h1>
          <p className="text-slate-500 mt-1">Submit and manage purchase requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover" data-testid="create-request-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Purchase Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What do you need?"
                  data-testid="request-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about your request"
                  data-testid="request-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  data-testid="request-amount-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="request-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                    <SelectTrigger data-testid="request-urgency-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="request-submit-btn">
                  Submit Request
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
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="request-search-input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="request-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No purchase requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map(request => (
            <Card key={request.id} className="border-slate-200 hover:shadow-md transition-shadow" data-testid={`request-card-${request.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="text-base font-medium line-clamp-1">{request.title}</CardTitle>
                  </div>
                  <Badge className={statusColors[request.status]}>
                    {request.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {request.status === "approved" && <Check className="w-3 h-3 mr-1" />}
                    {request.status === "denied" && <X className="w-3 h-3 mr-1" />}
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-500 line-clamp-2">{request.description}</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-lg">{formatCurrency(request.amount)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{request.category}</Badge>
                  <Badge className={urgencyColors[request.urgency]}>{request.urgency}</Badge>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>Requested by: <span className="text-slate-700">{request.requested_by_name}</span></p>
                  <p>Date: <span className="text-slate-700">{new Date(request.created_at).toLocaleDateString()}</span></p>
                  {request.approved_by_name && (
                    <p>{request.status === "approved" ? "Approved" : "Denied"} by: <span className="text-slate-700">{request.approved_by_name}</span></p>
                  )}
                </div>
                {canApprove && request.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-status-success hover:bg-green-600"
                      onClick={() => handleApprove(request.id)}
                      data-testid={`approve-request-${request.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDeny(request.id)}
                      data-testid={`deny-request-${request.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
