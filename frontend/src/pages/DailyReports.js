import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Plus, ClipboardList, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DailyReports = () => {
  const { user, getAuthHeader, isOwner, isTeamLeader, isEmployee } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tasks_completed: "",
    tasks_in_progress: "",
    issues: "",
    notes: ""
  });

  const canSubmit = isOwner || isTeamLeader || isEmployee;

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/daily-reports?date=${selectedDate}`, getAuthHeader());
      setReports(response.data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }

    try {
      const payload = {
        date: formData.date,
        tasks_completed: formData.tasks_completed.split('\n').filter(t => t.trim()),
        tasks_in_progress: formData.tasks_in_progress.split('\n').filter(t => t.trim()),
        issues: formData.issues || null,
        notes: formData.notes || null
      };

      await axios.post(`${API}/daily-reports`, payload, getAuthHeader());
      toast.success("Daily report submitted successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit report");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tasks_completed: "",
      tasks_in_progress: "",
      issues: "",
      notes: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="daily-reports-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Daily Reports</h1>
          <p className="text-slate-500 mt-1">Submit and view daily progress reports</p>
        </div>
        {canSubmit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="submit-report-btn">
                <Plus className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit Daily Report</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    data-testid="report-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tasks_completed">
                    <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                    Tasks Completed (one per line)
                  </Label>
                  <Textarea
                    id="tasks_completed"
                    value={formData.tasks_completed}
                    onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
                    placeholder="List completed tasks..."
                    rows={3}
                    data-testid="report-completed-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tasks_in_progress">
                    <Clock className="w-4 h-4 inline mr-1 text-blue-600" />
                    Tasks In Progress (one per line)
                  </Label>
                  <Textarea
                    id="tasks_in_progress"
                    value={formData.tasks_in_progress}
                    onChange={(e) => setFormData({ ...formData, tasks_in_progress: e.target.value })}
                    placeholder="List ongoing tasks..."
                    rows={3}
                    data-testid="report-progress-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issues">
                    <AlertCircle className="w-4 h-4 inline mr-1 text-amber-600" />
                    Issues / Blockers
                  </Label>
                  <Textarea
                    id="issues"
                    value={formData.issues}
                    onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                    placeholder="Any blockers or issues..."
                    rows={2}
                    data-testid="report-issues-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any other notes..."
                    rows={2}
                    data-testid="report-notes-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="report-submit-btn">
                    Submit Report
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
          <Calendar className="w-4 h-4 text-slate-500" />
          <Label>View reports for:</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            data-testid="report-filter-date"
          />
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No reports for this date</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <Card key={report.id} className="border-slate-200" data-testid={`report-card-${report.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">{report.user_name?.charAt(0)?.toUpperCase() || "U"}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">{report.user_name}</CardTitle>
                      <p className="text-sm text-slate-500">{new Date(report.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    Submitted: {new Date(report.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.tasks_completed?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 flex items-center gap-1 mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Completed Tasks
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-2">
                      {report.tasks_completed.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.tasks_in_progress?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 flex items-center gap-1 mb-2">
                      <Clock className="w-4 h-4" />
                      In Progress
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-2">
                      {report.tasks_in_progress.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.issues && (
                  <div>
                    <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      Issues / Blockers
                    </h4>
                    <p className="text-sm text-slate-600 ml-5">{report.issues}</p>
                  </div>
                )}
                {report.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Notes:</span> {report.notes}
                    </p>
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

export default DailyReports;
