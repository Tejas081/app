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
import { Plus, Search, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  half_day: "bg-amber-100 text-amber-700",
  leave: "bg-slate-100 text-slate-700"
};

const statusIcons = {
  present: CheckCircle,
  absent: XCircle,
  half_day: Clock,
  leave: Calendar
};

const Attendance = () => {
  const { user, getAuthHeader, isOwner, isHR } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    date: new Date().toISOString().split('T')[0],
    status: "present",
    check_in: "",
    check_out: "",
    notes: ""
  });

  const canManage = isOwner || isHR;

  useEffect(() => {
    fetchAttendance();
    if (canManage) {
      fetchUsers();
    }
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      let url = `${API}/attendance?date=${selectedDate}`;
      const response = await axios.get(url, getAuthHeader());
      setAttendance(response.data);
    } catch (error) {
      toast.error("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeader());
      setUsers(response.data.filter(u => u.is_active));
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id || !formData.date) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await axios.post(`${API}/attendance`, formData, getAuthHeader());
      toast.success("Attendance recorded successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to record attendance");
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      date: selectedDate,
      status: "present",
      check_in: "",
      check_out: "",
      notes: ""
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";
    try {
      return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">Track employee attendance and working hours</p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="record-attendance-btn">
                <Plus className="w-4 h-4 mr-2" />
                Record Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Attendance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Employee *</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger data-testid="attendance-user-select">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    data-testid="attendance-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger data-testid="attendance-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_in">Check In</Label>
                    <Input
                      id="check_in"
                      type="datetime-local"
                      value={formData.check_in}
                      onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                      data-testid="attendance-checkin-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out">Check Out</Label>
                    <Input
                      id="check_out"
                      type="datetime-local"
                      value={formData.check_out}
                      onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                      data-testid="attendance-checkout-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    data-testid="attendance-notes-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="attendance-submit-btn">
                    Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Date:</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            data-testid="attendance-filter-date"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">
            Attendance for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No attendance records for this date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="table-header">Employee</TableHead>
                    <TableHead className="table-header">Status</TableHead>
                    <TableHead className="table-header">Check In</TableHead>
                    <TableHead className="table-header">Check Out</TableHead>
                    <TableHead className="table-header">Working Hours</TableHead>
                    <TableHead className="table-header">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map(record => {
                    const StatusIcon = statusIcons[record.status];
                    return (
                      <TableRow key={record.id} className="hover:bg-slate-50/50" data-testid={`attendance-row-${record.id}`}>
                        <TableCell className="font-medium">{record.user_name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[record.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(record.check_in)}</TableCell>
                        <TableCell>{formatTime(record.check_out)}</TableCell>
                        <TableCell>{record.working_hours ? `${record.working_hours} hrs` : "-"}</TableCell>
                        <TableCell className="text-slate-500">{record.notes || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
