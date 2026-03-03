import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SetupOwner = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "Management"
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/setup-owner`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        department: formData.department,
        role: "owner"
      });
      toast.success("Owner account created successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Setup error:", error);
      toast.error(error.response?.data?.detail || "Failed to create owner account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(248,250,252,0.9), rgba(248,250,252,0.95)), url('https://images.unsplash.com/photo-1772033762692-22922c5c8a79?crop=entropy&cs=srgb&fm=jpg&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Card className="w-full max-w-md shadow-xl border-slate-200" data-testid="setup-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <CardTitle className="font-heading text-2xl">Setup Owner Account</CardTitle>
          <CardDescription className="text-slate-500">Create the first administrator account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                data-testid="setup-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="owner@taron.com"
                value={formData.email}
                onChange={handleChange}
                data-testid="setup-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                data-testid="setup-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                data-testid="setup-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                data-testid="setup-confirm-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={loading}
              data-testid="setup-submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Owner Account
                </span>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-slate-500 hover:text-primary flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupOwner;
