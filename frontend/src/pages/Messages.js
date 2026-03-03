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
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Plus, MessageSquare, Send, Mail, Users, User } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Messages = () => {
  const { user, getAuthHeader, isOwner, isHR } = useAuth();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    recipient_id: "",
    is_broadcast: false
  });

  const canSend = isOwner || isHR;

  useEffect(() => {
    fetchMessages();
    if (canSend) {
      fetchUsers();
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`, getAuthHeader());
      setMessages(response.data);
    } catch (error) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, getAuthHeader());
      setUsers(response.data.filter(u => u.id !== user.id && u.is_active));
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.content) {
      toast.error("Please fill in subject and message");
      return;
    }
    if (!formData.is_broadcast && !formData.recipient_id) {
      toast.error("Please select a recipient or send as broadcast");
      return;
    }

    try {
      const payload = {
        subject: formData.subject,
        content: formData.content,
        is_broadcast: formData.is_broadcast
      };
      if (!formData.is_broadcast) {
        payload.recipient_id = formData.recipient_id;
      }

      await axios.post(`${API}/messages`, payload, getAuthHeader());
      toast.success(formData.is_broadcast ? "Broadcast sent successfully" : "Message sent successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send message");
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`${API}/messages/${messageId}/read`, null, getAuthHeader());
      fetchMessages();
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      content: "",
      recipient_id: "",
      is_broadcast: false
    });
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="messages-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 mt-1">HR communications and announcements</p>
        </div>
        {canSend && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover" data-testid="compose-message-btn">
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="is_broadcast" 
                    checked={formData.is_broadcast}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_broadcast: checked, recipient_id: "" })}
                    data-testid="message-broadcast-checkbox"
                  />
                  <Label htmlFor="is_broadcast" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Send as Broadcast (to all employees)
                  </Label>
                </div>
                {!formData.is_broadcast && (
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient *</Label>
                    <Select value={formData.recipient_id} onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}>
                      <SelectTrigger data-testid="message-recipient-select">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Message subject"
                    data-testid="message-subject-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Message *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your message..."
                    rows={5}
                    data-testid="message-content-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary-hover" data-testid="message-send-btn">
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Messages List */}
      {sortedMessages.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No messages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedMessages.map(message => (
            <Card 
              key={message.id} 
              className={`border-slate-200 hover:shadow-md transition-shadow cursor-pointer ${!message.is_read && message.recipient_id === user?.id ? 'border-l-4 border-l-primary bg-blue-50/30' : ''}`}
              onClick={() => !message.is_read && message.recipient_id === user?.id && markAsRead(message.id)}
              data-testid={`message-card-${message.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${message.is_broadcast ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {message.is_broadcast ? (
                      <Users className={`w-5 h-5 text-purple-600`} />
                    ) : (
                      <Mail className={`w-5 h-5 text-blue-600`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-slate-900">{message.subject}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-500">From: {message.sender_name}</span>
                          {message.is_broadcast ? (
                            <Badge className="bg-purple-100 text-purple-700">Broadcast</Badge>
                          ) : (
                            <Badge variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              To: {message.recipient_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
