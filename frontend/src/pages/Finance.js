import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt, PieChart } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Finance = () => {
  const { getAuthHeader } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: "",
    category: "salary",
    date: new Date().toISOString().split('T')[0],
    is_gst_applicable: false,
    gst_amount: ""
  });
  const [incomeForm, setIncomeForm] = useState({
    title: "",
    description: "",
    amount: "",
    source: "project",
    date: new Date().toISOString().split('T')[0],
    is_gst_applicable: false,
    gst_amount: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, incomeRes, summaryRes] = await Promise.all([
        axios.get(`${API}/expenses`, getAuthHeader()),
        axios.get(`${API}/income`, getAuthHeader()),
        axios.get(`${API}/finance/summary`, getAuthHeader())
      ]);
      setExpenses(expensesRes.data);
      setIncome(incomeRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error("Failed to fetch finance data");
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        gst_amount: expenseForm.gst_amount ? parseFloat(expenseForm.gst_amount) : null
      }, getAuthHeader());
      toast.success("Expense recorded successfully");
      setIsExpenseDialogOpen(false);
      resetExpenseForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to record expense");
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.title || !incomeForm.amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
        gst_amount: incomeForm.gst_amount ? parseFloat(incomeForm.gst_amount) : null
      }, getAuthHeader());
      toast.success("Income recorded successfully");
      setIsIncomeDialogOpen(false);
      resetIncomeForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to record income");
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: "",
      description: "",
      amount: "",
      category: "salary",
      date: new Date().toISOString().split('T')[0],
      is_gst_applicable: false,
      gst_amount: ""
    });
  };

  const resetIncomeForm = () => {
    setIncomeForm({
      title: "",
      description: "",
      amount: "",
      source: "project",
      date: new Date().toISOString().split('T')[0],
      is_gst_applicable: false,
      gst_amount: ""
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="finance-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Finance</h1>
          <p className="text-slate-500 mt-1">Track income, expenses, and GST</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => { setIsExpenseDialogOpen(open); if (!open) resetExpenseForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" data-testid="add-expense-btn">
                <TrendingDown className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-title">Title *</Label>
                  <Input
                    id="expense-title"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                    placeholder="Expense title"
                    data-testid="expense-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Amount *</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="expense-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-category">Category</Label>
                    <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                      <SelectTrigger data-testid="expense-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    data-testid="expense-date-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="expense-gst" 
                    checked={expenseForm.is_gst_applicable}
                    onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, is_gst_applicable: checked })}
                    data-testid="expense-gst-checkbox"
                  />
                  <Label htmlFor="expense-gst">GST Applicable</Label>
                </div>
                {expenseForm.is_gst_applicable && (
                  <div className="space-y-2">
                    <Label htmlFor="expense-gst-amount">GST Amount</Label>
                    <Input
                      id="expense-gst-amount"
                      type="number"
                      value={expenseForm.gst_amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, gst_amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="expense-gst-input"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" data-testid="expense-submit-btn">Record Expense</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isIncomeDialogOpen} onOpenChange={(open) => { setIsIncomeDialogOpen(open); if (!open) resetIncomeForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-status-success hover:bg-green-600" data-testid="add-income-btn">
                <TrendingUp className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Income</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleIncomeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income-title">Title *</Label>
                  <Input
                    id="income-title"
                    value={incomeForm.title}
                    onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
                    placeholder="Income title"
                    data-testid="income-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income-amount">Amount *</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="income-amount-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-source">Source</Label>
                    <Select value={incomeForm.source} onValueChange={(value) => setIncomeForm({ ...incomeForm, source: value })}>
                      <SelectTrigger data-testid="income-source-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-date">Date</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    data-testid="income-date-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="income-gst" 
                    checked={incomeForm.is_gst_applicable}
                    onCheckedChange={(checked) => setIncomeForm({ ...incomeForm, is_gst_applicable: checked })}
                    data-testid="income-gst-checkbox"
                  />
                  <Label htmlFor="income-gst">GST Applicable</Label>
                </div>
                {incomeForm.is_gst_applicable && (
                  <div className="space-y-2">
                    <Label htmlFor="income-gst-amount">GST Amount</Label>
                    <Input
                      id="income-gst-amount"
                      type="number"
                      value={incomeForm.gst_amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, gst_amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="income-gst-input"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsIncomeDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-status-success hover:bg-green-600" data-testid="income-submit-btn">Record Income</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 border-t-4 border-t-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Income</p>
                <p className="text-2xl font-heading font-bold text-slate-900 mt-1">{formatCurrency(summary.total_income)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 border-t-4 border-t-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                <p className="text-2xl font-heading font-bold text-slate-900 mt-1">{formatCurrency(summary.total_expenses)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 border-t-4 border-t-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Net Profit</p>
                <p className={`text-2xl font-heading font-bold mt-1 ${summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.net_profit)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 border-t-4 border-t-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">GST Liability</p>
                <p className="text-2xl font-heading font-bold text-slate-900 mt-1">{formatCurrency(summary.gst_liability)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="income" data-testid="tab-income">Income</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">GST Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">GST Collected</span>
                    <span className="font-semibold">{formatCurrency(summary.gst_collected)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-600">GST Paid</span>
                    <span className="font-semibold">{formatCurrency(summary.gst_paid)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-amber-700 font-medium">Net GST Liability</span>
                    <span className="font-bold text-amber-700">{formatCurrency(summary.gst_liability)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">P&L Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Total Revenue</span>
                    <span className="font-semibold text-green-700">{formatCurrency(summary.total_income)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">Total Expenses</span>
                    <span className="font-semibold text-red-700">{formatCurrency(summary.total_expenses)}</span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${summary.net_profit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
                    <span className={`font-medium ${summary.net_profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {summary.net_profit >= 0 ? 'Net Profit' : 'Net Loss'}
                    </span>
                    <span className={`font-bold ${summary.net_profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatCurrency(Math.abs(summary.net_profit))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {income.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No income records</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header">Title</TableHead>
                      <TableHead className="table-header">Source</TableHead>
                      <TableHead className="table-header">Amount</TableHead>
                      <TableHead className="table-header">GST</TableHead>
                      <TableHead className="table-header">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income.map(inc => (
                      <TableRow key={inc.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">{inc.title}</TableCell>
                        <TableCell><Badge variant="outline">{inc.source}</Badge></TableCell>
                        <TableCell className="text-green-600 font-semibold">{formatCurrency(inc.amount)}</TableCell>
                        <TableCell>{inc.is_gst_applicable ? formatCurrency(inc.gst_amount) : "-"}</TableCell>
                        <TableCell>{new Date(inc.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No expense records</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header">Title</TableHead>
                      <TableHead className="table-header">Category</TableHead>
                      <TableHead className="table-header">Amount</TableHead>
                      <TableHead className="table-header">GST</TableHead>
                      <TableHead className="table-header">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map(exp => (
                      <TableRow key={exp.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">{exp.title}</TableCell>
                        <TableCell><Badge variant="outline">{exp.category}</Badge></TableCell>
                        <TableCell className="text-red-600 font-semibold">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell>{exp.is_gst_applicable ? formatCurrency(exp.gst_amount) : "-"}</TableCell>
                        <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
