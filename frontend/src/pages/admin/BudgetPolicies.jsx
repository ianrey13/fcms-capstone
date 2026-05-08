// src/pages/admin/BudgetPolicies.jsx
import React, { useState, useEffect } from 'react';
import { budgetPolicyAPI, departmentAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  History,
  Building2,
  Info,
  RotateCcw,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BudgetPolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    department_id: '',
    default_weekly_allocation: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPolicies(),
        fetchDepartments(),
        fetchBudgetStatus(),
        fetchEventLogs()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await budgetPolicyAPI.getAll();
      const policyData = response.data?.data || response.data || [];
      setPolicies(Array.isArray(policyData) ? policyData : []);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      setPolicies([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      const deptData = response.data?.data || response.data || [];
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setDepartments([]);
    }
  };

  const fetchBudgetStatus = async () => {
    try {
      const response = await budgetPolicyAPI.getBudgetStatus();
      let statusData = response.data?.data || response.data || [];
      
      if (Array.isArray(statusData)) {
        statusData = statusData.map(item => ({
          department_id: item.department_id,
          allocated_amount: parseFloat(item.allocated_amount || item.total_budget || 0),
          spent_amount: parseFloat(item.spent_amount || item.total_spent || 0),
          remaining_amount: parseFloat(item.remaining_amount || (item.allocated_amount - item.spent_amount) || 0),
          week_start: item.week_start,
          week_end: item.week_end,
          status: item.status
        }));
      }
      setBudgetStatus(statusData);
    } catch (error) {
      console.error('Failed to fetch budget status:', error);
      setBudgetStatus([]);
    }
  };

  const fetchEventLogs = async () => {
    try {
      const response = await budgetPolicyAPI.getEventLogs();
      const logsData = response.data?.data || response.data || [];
      setEventLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Failed to fetch event logs:', error);
      setEventLogs([]);
    }
  };

  const getPolicyAmount = (departmentId) => {
    const policy = policies.find(p => p.department_id === departmentId);
    return policy?.default_weekly_allocation || 0;
  };

  const handleActivateBudget = async (departmentId, departmentName) => {
    setActivating(true);
    try {
      const amount = getPolicyAmount(departmentId);
      
      if (amount <= 0) {
        setErrorMessage(`Cannot activate budget for ${departmentName}. Please set a weekly allocation amount first.`);
        setShowActivateConfirm(null);
        setTimeout(() => setErrorMessage(''), 5000);
        setActivating(false);
        return;
      }
      
      const response = await budgetPolicyAPI.forceActivate({
        department_id: departmentId,
        amount: amount
      });
      
      if (response.data.success) {
        setSuccessMessage(`✅ Budget activated for ${departmentName}! New period created with ₱${amount.toLocaleString()}.`);
        setShowActivateConfirm(null);
        await fetchAllData();
      } else {
        setErrorMessage(response.data.message || 'Failed to activate budget');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Activate error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to activate budget');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setActivating(false);
    }
  };

  const handleForceReset = async () => {
    setResetting(true);
    try {
      const response = await budgetPolicyAPI.runWeeklyReset();
      
      if (response.data.success) {
        setSuccessMessage(`✅ Weekly budget reset completed! Closed: ${response.data.periods_closed || 0} periods, Created: ${response.data.periods_created || 0} new periods.`);
        setShowResetConfirm(false);
        await fetchAllData();
      } else {
        setErrorMessage(response.data.message || 'Reset completed but with issues.');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Reset error:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to reset budget periods');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setResetting(false);
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const search = searchTerm.toLowerCase();
    const department = departments.find(d => d.department_id === policy.department_id);
    return (
      department?.department_name?.toLowerCase().includes(search) ||
      department?.department_code?.toLowerCase().includes(search)
    );
  });

  const hasActiveFilters = searchTerm !== "";
  const clearFilters = () => {
    setSearchTerm('');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.department_id) {
      errors.department_id = 'Please select a department';
    }
    if (!formData.default_weekly_allocation) {
      errors.default_weekly_allocation = 'Weekly allocation is required';
    } else if (parseFloat(formData.default_weekly_allocation) < 0) {
      errors.default_weekly_allocation = 'Allocation must be a positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = {
        department_id: parseInt(formData.department_id),
        default_weekly_allocation: parseFloat(formData.default_weekly_allocation)
      };

      if (editingPolicy) {
        await budgetPolicyAPI.update(editingPolicy.department_id, data);
        setSuccessMessage('Budget policy updated successfully');
      } else {
        await budgetPolicyAPI.create(data);
        setSuccessMessage('Budget policy created successfully');
      }
      
      setShowModal(false);
      resetForm();
      await fetchAllData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'Operation failed';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    setLoading(true);
    try {
      await budgetPolicyAPI.delete(departmentId);
      setSuccessMessage('Budget policy deleted successfully');
      setShowDeleteConfirm(null);
      await fetchAllData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete policy';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ department_id: '', default_weekly_allocation: '' });
    setFormErrors({});
    setEditingPolicy(null);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      department_id: policy.department_id,
      default_weekly_allocation: policy.default_weekly_allocation
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const viewBudgetStatus = (department) => {
    setSelectedDepartment(department);
    setShowStatusModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusColor = (percentage) => {
    if (percentage < 50) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage < 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.department_id === departmentId);
    return dept ? `${dept.department_name} (${dept.department_code})` : 'Unknown';
  };

  const getDepartmentBudgetStatus = (departmentId) => {
    return budgetStatus.filter(status => status.department_id === departmentId);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Budget Policies
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage department weekly fuel budget allocations
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950/30"
            disabled={resetting}
          >
            <RotateCcw className="h-4 w-4" />
            {resetting ? 'Resetting...' : 'Force Weekly Reset (Demo)'}
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchAllData} 
            className="flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={openCreateModal} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Budget Policy
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Budget Allocation</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(policies.reduce((sum, p) => sum + parseFloat(p.default_weekly_allocation || 0), 0))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Weekly across all departments</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Departments with Policies</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{policies.length} / {departments.length}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Departments configured</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Weekly Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(policies.length > 0 
                ? policies.reduce((sum, p) => sum + parseFloat(p.default_weekly_allocation || 0), 0) / policies.length 
                : 0)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Per department</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div 
          className="px-6 py-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        
        {showFilters && (
          <div className="p-6 animate-slide-down">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchAllData}
                  className="flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Budget Policies Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <DollarSign className="h-5 w-5" />
            Department Budget Policies
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy' : 'policies'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No budget policies found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weekly Allocation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Estimate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Yearly Estimate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPolicies.map((policy, index) => {
                    const department = departments.find(d => d.department_id === policy.department_id);
                    const monthlyEstimate = parseFloat(policy.default_weekly_allocation || 0) * 4;
                    const yearlyEstimate = monthlyEstimate * 12;
                    const departmentStatus = getDepartmentBudgetStatus(policy.department_id);
                    const hasActivePeriod = departmentStatus.length > 0;
                    
                    return (
                      <tr key={policy.department_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{department?.department_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{department?.department_code || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(policy.default_weekly_allocation)}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">per week</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 dark:text-slate-300">{formatCurrency(monthlyEstimate)}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">per month</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 dark:text-slate-300">{formatCurrency(yearlyEstimate)}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">per year</p>
                        </td>
                        <td className="px-4 py-3">
                          {hasActivePeriod ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <Info className="h-3 w-3" />
                                Pending Reset
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowActivateConfirm({ 
                                  id: policy.department_id, 
                                  name: department?.department_name,
                                  amount: policy.default_weekly_allocation
                                })}
                                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/30 text-xs h-7"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewBudgetStatus(department)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/30 h-8 w-8 p-0"
                              title="View Budget Status"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(policy)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                              title="Edit Policy"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(policy)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                              title="Delete Policy"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Reset Information */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Weekly Budget Reset Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Automated Weekly Reset</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Budget periods are automatically reset every <strong>Monday at midnight</strong>. 
                  New budget periods are created using each department's default weekly allocation.
                </p>
                <div className="mt-3 flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogsModal(true)}
                    className="bg-white dark:bg-slate-800 dark:border-slate-700"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View Reset Logs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Force Weekly Budget Reset
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              This will close all active budget periods and create new ones based on department policies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-medium">⚠️ Demonstration Only</p>
                  <p className="mt-1">
                    This button is for demonstration purposes only. In production, the budget reset 
                    will run automatically every Monday at midnight.
                  </p>
                  <p className="mt-2 text-xs">
                    This will affect ALL departments with budget policies.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>What will happen:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                <li>All active budget periods will be closed</li>
                <li>New budget periods will be created for each department</li>
                <li>New periods will use the department's weekly allocation amount</li>
                <li>The reset will be logged in the event logs</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)} className="dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleForceReset} 
              disabled={resetting}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Yes, Force Reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Budget Confirmation Modal */}
      {showActivateConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Activate Budget Period</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                Are you sure you want to activate the budget for <strong>{showActivateConfirm.name}</strong>?
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                  <li>A new budget period will be created for this department</li>
                  <li>The period will start today and end on the next Sunday</li>
                  <li>Allocation amount: {formatCurrency(showActivateConfirm.amount)}</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleActivateBudget(showActivateConfirm.id, showActivateConfirm.name)}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  disabled={activating}
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Yes, Activate Budget
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowActivateConfirm(null)}
                  className="flex-1 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingPolicy ? 'Edit Budget Policy' : 'Add Budget Policy'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department *
                </Label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  disabled={!!editingPolicy}
                  className={`w-full mt-1.5 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white ${formErrors.department_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} ${editingPolicy ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter(dept => !policies.some(p => p.department_id === dept.department_id) || editingPolicy?.department_id === dept.department_id)
                    .map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name} ({dept.department_code})
                      </option>
                    ))}
                </select>
                {formErrors.department_id && <p className="text-red-500 text-xs mt-1">{formErrors.department_id}</p>}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Weekly Allocation (₱) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.default_weekly_allocation}
                  onChange={(e) => setFormData({ ...formData, default_weekly_allocation: e.target.value })}
                  placeholder="e.g., 5000.00"
                  className={`mt-1.5 dark:bg-slate-900 dark:border-slate-700 ${formErrors.default_weekly_allocation ? 'border-red-500' : ''}`}
                />
                {formErrors.default_weekly_allocation && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.default_weekly_allocation}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Amount allocated to this department every week (Monday-Friday)
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Estimated monthly budget:</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(parseFloat(formData.default_weekly_allocation || 0) * 4)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md" disabled={loading}>
                  {loading ? 'Saving...' : (editingPolicy ? 'Update Policy' : 'Create Policy')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Status Modal */}
      {showStatusModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Budget Status</h2>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedDepartment.department_name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedDepartment.department_code}</p>
              </div>
              
              {(() => {
                const departmentStatus = budgetStatus.filter(s => s.department_id === selectedDepartment.department_id);
                
                if (departmentStatus.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Info className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                      <p className="text-slate-600 dark:text-slate-400">No active budget period found</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                        Budget periods are created automatically every Monday.
                        <br />The next reset will create this department's budget period.
                        <br />Or click "Activate" to create one now.
                      </p>
                    </div>
                  );
                }
                
                return departmentStatus.map((status, index) => {
                  const percentage = status.allocated_amount > 0 
                    ? (status.spent_amount / status.allocated_amount) * 100 
                    : 0;
                  return (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Weekly Allocation:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(status.allocated_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Spent:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(status.spent_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Remaining:</span>
                        <span className={`font-semibold ${getStatusColor(percentage)}`}>
                          {formatCurrency(status.remaining_amount)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Utilization</span>
                          <span className={getStatusColor(percentage)}>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-red-600' : percentage >= 50 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span>Period: {new Date(status.week_start).toLocaleDateString()} - {new Date(status.week_end).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Event Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b dark:border-slate-700 bg-white dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Reset Event Logs</h2>
              <button onClick={() => setShowLogsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              {eventLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No event logs available</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                    The weekly budget reset runs every Monday at midnight.
                    <br />Logs will appear here after the first reset.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventLogs.map((log, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex justfiy-between items-start">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{log.event_name || 'Budget Reset'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(log.run_at || log.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          log.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {log.status || 'completed'}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        <p>Periods closed: <span className="font-medium">{log.periods_closed || 0}</span></p>
                        <p>Periods created: <span className="font-medium">{log.periods_created || 0}</span></p>
                        {log.error_message && (
                          <p className="text-red-600 dark:text-red-400 text-xs mt-2">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2 text-slate-900 dark:text-white">Delete Budget Policy</h2>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                Are you sure you want to delete the budget policy for <strong>{getDepartmentName(showDeleteConfirm.department_id)}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-6">
                ⚠️ Warning: This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(showDeleteConfirm.department_id)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPolicies;