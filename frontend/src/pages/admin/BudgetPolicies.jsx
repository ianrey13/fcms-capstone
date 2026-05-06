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
  Loader2
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

  // Get policy amount for a department
  const getPolicyAmount = (departmentId) => {
    const policy = policies.find(p => p.department_id === departmentId);
    return policy?.default_weekly_allocation || 0;
  };

  // ✅ Activate budget for a single department
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

  // ✅ Force reset all budgets (Demo)
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

  // Filter policies based on search
  const filteredPolicies = policies.filter(policy => {
    const search = searchTerm.toLowerCase();
    const department = departments.find(d => d.department_id === policy.department_id);
    return (
      department?.department_name?.toLowerCase().includes(search) ||
      department?.department_code?.toLowerCase().includes(search)
    );
  });

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
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.department_id === departmentId);
    return dept ? `${dept.department_name} (${dept.department_code})` : 'Unknown';
  };

  const getDepartmentBudgetStatus = (departmentId) => {
    return budgetStatus.filter(status => status.department_id === departmentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Policies</h1>
          <p className="text-gray-600 mt-1">Manage department weekly fuel budget allocations</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
            disabled={resetting}
          >
            <RotateCcw className="h-4 w-4" />
            {resetting ? 'Resetting...' : 'Force Weekly Reset (Demo)'}
          </Button>
          <Button variant="outline" onClick={fetchAllData} className="flex items-center gap-2" disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Budget Policy
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Budget Allocation</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(policies.reduce((sum, p) => sum + parseFloat(p.default_weekly_allocation || 0), 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Weekly across all departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Departments with Policies</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length} / {departments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Departments configured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Weekly Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(policies.length > 0 
                ? policies.reduce((sum, p) => sum + parseFloat(p.default_weekly_allocation || 0), 0) / policies.length 
                : 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per department</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Policies Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Department Budget Policies
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No budget policies found</p>
              <Button variant="link" onClick={openCreateModal} className="mt-2">
                Create your first budget policy
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekly Allocation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Estimate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yearly Estimate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPolicies.map((policy) => {
                    const department = departments.find(d => d.department_id === policy.department_id);
                    const monthlyEstimate = parseFloat(policy.default_weekly_allocation || 0) * 4;
                    const yearlyEstimate = monthlyEstimate * 12;
                    const departmentStatus = getDepartmentBudgetStatus(policy.department_id);
                    const hasActivePeriod = departmentStatus.length > 0;
                    
                    return (
                      <tr key={policy.department_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{department?.department_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{department?.department_code || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(policy.default_weekly_allocation)}
                          </span>
                          <p className="text-xs text-gray-500">per week</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">{formatCurrency(monthlyEstimate)}</span>
                          <p className="text-xs text-gray-500">per month</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">{formatCurrency(yearlyEstimate)}</span>
                          <p className="text-xs text-gray-500">per year</p>
                        </td>
                        <td className="px-4 py-3">
                          {hasActivePeriod ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Info className="h-3 w-3 mr-1" />
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
                                className="border-green-500 text-green-600 hover:bg-green-50 text-xs h-7"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewBudgetStatus(department)}
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="View Budget Status"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(policy)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Policy"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(policy)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Budget Reset Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Automated Weekly Reset</p>
                <p className="text-sm text-blue-600 mt-1">
                  Budget periods are automatically reset every <strong>Monday at midnight</strong>. 
                  New budget periods are created using each department's default weekly allocation.
                </p>
                <div className="mt-3 flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogsModal(true)}
                    className="bg-white"
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

      {/* Reset Confirmation Modal - DEMONSTRATION */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Force Weekly Budget Reset
            </DialogTitle>
            <DialogDescription>
              This will close all active budget periods and create new ones based on department policies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What will happen:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>All active budget periods will be closed</li>
                <li>New budget periods will be created for each department</li>
                <li>New periods will use the department's weekly allocation amount</li>
                <li>The reset will be logged in the event logs</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleForceReset} 
              disabled={resetting}
              className="bg-orange-600 hover:bg-orange-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Activate Budget Period</h2>
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to activate the budget for <strong>{showActivateConfirm.name}</strong>?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>A new budget period will be created for this department</li>
                  <li>The period will start today and end on the next Sunday</li>
                  <li>Allocation amount: {formatCurrency(showActivateConfirm.amount)}</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleActivateBudget(showActivateConfirm.id, showActivateConfirm.name)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
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
                  className="flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingPolicy ? 'Edit Budget Policy' : 'Add Budget Policy'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <Label htmlFor="department_id" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department *
                </Label>
                <select
                  id="department_id"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  disabled={!!editingPolicy}
                  className={`w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.department_id ? 'border-red-500' : 'border-gray-300'} ${editingPolicy ? 'bg-gray-100' : ''}`}
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
                <Label htmlFor="default_weekly_allocation" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Weekly Allocation (₱) *
                </Label>
                <Input
                  id="default_weekly_allocation"
                  type="number"
                  step="0.01"
                  value={formData.default_weekly_allocation}
                  onChange={(e) => setFormData({ ...formData, default_weekly_allocation: e.target.value })}
                  placeholder="e.g., 5000.00"
                  className={`mt-1 ${formErrors.default_weekly_allocation ? 'border-red-500' : ''}`}
                />
                {formErrors.default_weekly_allocation && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.default_weekly_allocation}</p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  Amount allocated to this department every week (Monday-Friday)
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Estimated monthly budget:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(parseFloat(formData.default_weekly_allocation || 0) * 4)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editingPolicy ? 'Update Policy' : 'Create Policy')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Budget Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center mb-4">
                <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-lg">{selectedDepartment.department_name}</h3>
                <p className="text-gray-500">{selectedDepartment.department_code}</p>
              </div>
              
              {(() => {
                const departmentStatus = budgetStatus.filter(s => s.department_id === selectedDepartment.department_id);
                
                if (departmentStatus.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Info className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-gray-600">No active budget period found</p>
                      <p className="text-sm text-gray-500 mt-2">
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
                        <span className="text-gray-600">Weekly Allocation:</span>
                        <span className="font-semibold">{formatCurrency(status.allocated_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent:</span>
                        <span className="font-semibold">{formatCurrency(status.spent_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remaining:</span>
                        <span className={`font-semibold ${getStatusColor(percentage)}`}>
                          {formatCurrency(status.remaining_amount)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Utilization</span>
                          <span className={getStatusColor(percentage)}>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-red-600' : percentage >= 50 ? 'bg-yellow-500' : 'bg-green-600'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Period: {status.week_start} to {status.week_end}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Weekly Reset Event Logs</h2>
              <button onClick={() => setShowLogsModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {eventLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No event logs available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    The weekly budget reset runs every Monday at midnight.
                    <br />Logs will appear here after the first reset.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventLogs.map((log, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.event_name || 'Budget Reset'}</p>
                          <p className="text-xs text-gray-500">{log.run_at || log.created_at}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' :
                          log.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status || 'completed'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Periods closed: {log.periods_closed || 0}</p>
                        <p>Periods created: {log.periods_created || 0}</p>
                        {log.error_message && (
                          <p className="text-red-600 text-xs mt-1">{log.error_message}</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Delete Budget Policy</h2>
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete the budget policy for <strong>
                  {getDepartmentName(showDeleteConfirm.department_id)}
                </strong>?
              </p>
              <p className="text-sm text-red-600 text-center mb-6">
                Warning: This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(showDeleteConfirm.department_id)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
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