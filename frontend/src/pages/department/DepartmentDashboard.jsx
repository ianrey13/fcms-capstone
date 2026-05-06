// src/pages/department/DepartmentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tripTicketAPI, departmentStaffAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Plus,
  Eye,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Loader2,
  BarChart3,
  Wallet,
  Zap,
  ArrowRight,
  Building2,
  Fuel
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    returned: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const ticketsRes = await tripTicketAPI.getMyRequests();
      let tickets = ticketsRes.data?.data || ticketsRes.data || [];
      tickets = Array.isArray(tickets) ? tickets : [];
      
      const pendingStatuses = ['pending_head_approval', 'pending_gso_review', 'pending_mayors_office', 'with_mayors_office'];
      const approvedStatuses = ['funds_issued'];
      const inTransitStatuses = ['in_transit'];
      const completedStatuses = ['closed'];
      const returnedStatuses = ['returned_for_revision', 'rejected'];
      
      setStats({
        total: tickets.length,
        pending: tickets.filter(t => pendingStatuses.includes(t.status)).length,
        approved: tickets.filter(t => approvedStatuses.includes(t.status)).length,
        inTransit: tickets.filter(t => inTransitStatuses.includes(t.status)).length,
        completed: tickets.filter(t => completedStatuses.includes(t.status)).length,
        returned: tickets.filter(t => returnedStatuses.includes(t.status)).length
      });
      
      setRecentTickets(tickets.slice(0, 5));
      
      try {
        const budgetRes = await departmentStaffAPI.getDepartmentBudget();
        const budgetData = budgetRes.data?.data || budgetRes.data;
        if (budgetData) {
          const remaining = budgetData.remaining_amount || budgetData.remaining_budget || 0;
          const allocated = budgetData.allocated_amount || 0;
          const spent = budgetData.spent_amount || 0;
          const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
          
          setBudget({
            remaining_budget: remaining,
            allocated_amount: allocated,
            spent_amount: spent,
            period_start: budgetData.week_start || budgetData.period_start,
            period_end: budgetData.week_end || budgetData.period_end,
            utilization_percentage: budgetData.utilization_percentage || utilization.toFixed(1),
            isLow: remaining < allocated * 0.2,
            isCritical: remaining < allocated * 0.1
          });
        }
      } catch (error) {
        console.error('Error fetching budget:', error);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-500', label: 'Draft', icon: '📝' },
      pending_head_approval: { color: 'bg-yellow-500', label: 'Pending Head', icon: '⏳' },
      pending_gso_review: { color: 'bg-orange-500', label: 'Pending GSO', icon: '📋' },
      returned_for_revision: { color: 'bg-red-500', label: 'Returned', icon: '↩️' },
      with_mayors_office: { color: 'bg-purple-500', label: 'With Mayor', icon: '🏛️' },
      pending_mayors_office: { color: 'bg-purple-500', label: 'Pending Mayor', icon: '🏛️' },
      funds_issued: { color: 'bg-green-500', label: 'Funds Issued', icon: '💰' },
      in_transit: { color: 'bg-indigo-500', label: 'In Transit', icon: '🚗' },
      closed: { color: 'bg-emerald-600', label: 'Closed', icon: '✅' },
      rejected: { color: 'bg-red-600', label: 'Rejected', icon: '❌' },
      cancelled: { color: 'bg-gray-600', label: 'Cancelled', icon: '🚫' }
    };
    const c = config[status] || { color: 'bg-gray-500', label: status.replace(/_/g, ' '), icon: '📄' };
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1 w-fit`}>
        <span>{c.icon}</span>
        {c.label}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBudgetStatusColor = () => {
    if (!budget) return 'text-green-600';
    if (budget.isCritical) return 'text-red-600';
    if (budget.isLow) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetProgressColor = () => {
    if (!budget) return 'bg-green-500';
    if (budget.utilization_percentage >= 90) return 'bg-red-500';
    if (budget.utilization_percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                  {user?.department_name || 'Department'}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Building2 className="h-3 w-3 mr-1" />
                  Staff Portal
                </Badge>
              </div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.first_name}!</h1>
              <p className="text-slate-300 mt-1">Manage your trip requests and track budget utilization</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Loader2 className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button 
                onClick={() => navigate('/department/create')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trip Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total Requests</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-xs text-yellow-600">{stats.pending}</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500 mt-1">Pending Approval</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs text-green-600">{stats.approved}</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-500 mt-1">Approved / Funded</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-xs text-emerald-600">{stats.completed}</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              <p className="text-sm text-gray-500 mt-1">Completed Trips</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-xs text-red-600">{stats.returned}</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.returned}</p>
              <p className="text-sm text-gray-500 mt-1">Returned/Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Card */}
        {budget && (
          <Card className="mb-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${budget.isCritical ? 'bg-red-100' : budget.isLow ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    <Wallet className={`h-6 w-6 ${getBudgetStatusColor()}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weekly Budget Remaining</p>
                    <p className={`text-3xl font-bold ${getBudgetStatusColor()}`}>
                      {formatCurrency(budget.remaining_budget)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Allocated: {formatCurrency(budget.allocated_amount)}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Spent: {formatCurrency(budget.spent_amount)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Budget Utilization</span>
                    <span className={budget.utilization_percentage >= 90 ? 'text-red-600 font-semibold' : budget.utilization_percentage >= 70 ? 'text-yellow-600' : 'text-green-600'}>
                      {budget.utilization_percentage}%
                    </span>
                  </div>
                  <Progress value={budget.utilization_percentage} className="h-2.5" />
                  {budget.isLow && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Low budget warning: Less than 20% remaining
                    </p>
                  )}
                  {budget.isCritical && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Critical: Budget almost exhausted. Consider requesting MO assistance.
                    </p>
                  )}
                </div>
                
                {budget.period_start && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Period</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(budget.period_start).toLocaleDateString()} - {new Date(budget.period_end).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Trip Tickets
            </CardTitle>
            {recentTickets.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/department/requests')}
                className="text-blue-600"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No trip tickets yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first trip ticket to get started</p>
                <Button 
                  onClick={() => navigate('/department/create')}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trip Ticket
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 rounded-lg">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket #</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentTickets.map((ticket, idx) => (
                      <tr key={ticket.trip_ticket_id || ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700">
                            {new Date(ticket.trip_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono font-medium text-gray-800">
                            {ticket.ticket_number || ticket.trip_ticket_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 max-w-[200px] truncate block">
                            {ticket.destination}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(ticket.amount_released || ticket.estimated_cost || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/department/requests/${ticket.trip_ticket_id || ticket.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Fuel className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">Fuel Management</p>
                  <p className="text-xs text-blue-600">Use estimated fuel liters for better budget planning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Submit Early</p>
                  <p className="text-xs text-green-600">Submit requests at least 3 days before travel</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-800">Budget Assistance</p>
                  <p className="text-xs text-purple-600">Contact MO if budget is insufficient</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;