// src/pages/mayor/MayorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mayorsOfficeAPI } from '../../services/api';
import BudgetAssistanceWidget from './BudgetAssistanceWidget';
import { toast } from 'react-hot-toast';

import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  RefreshCw,
  Loader2,
  Eye,
  Calendar,
  MapPin,
  Truck,
  User,
  Building2,
  AlertCircle,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

const MayorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingTickets, setPendingTickets] = useState([]);
  const [approvedTickets, setApprovedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showBudgetErrorModal, setShowBudgetErrorModal] = useState(false);
  const [budgetErrorData, setBudgetErrorData] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [amountReleased, setAmountReleased] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingTickets(),
        fetchApprovedTickets(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPendingTickets = async () => {
    try {
      const response = await mayorsOfficeAPI.getPendingTickets();
      const ticketsData = response.data?.data || response.data || [];
      setPendingTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error('Failed to fetch pending tickets:', error);
      setPendingTickets([]);
    }
  };

  const fetchApprovedTickets = async () => {
    try {
      const response = await mayorsOfficeAPI.getApprovedTickets();
      const ticketsData = response.data?.data || response.data || [];
      setApprovedTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error('Failed to fetch approved tickets:', error);
      setApprovedTickets([]);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
    toast.success('Dashboard refreshed');
  };

  // ✅ UPDATED: Handle approve with budget validation
  const handleApprove = async () => {
    if (!selectedTicket) return;
    if (!amountReleased || parseFloat(amountReleased) <= 0) {
      toast.error('Please enter a valid amount to release');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await mayorsOfficeAPI.approveTicket(
        selectedTicket.id || selectedTicket.trip_ticket_id,
        parseFloat(amountReleased),
        null
      );
      
      if (response.data.success) {
        setShowApproveDialog(false);
        setSelectedTicket(null);
        setAmountReleased('');
        fetchAllData();
        toast.success(response.data.message || 'Funds released successfully!');
      }
    } catch (error) {
      console.error('Failed to approve ticket:', error);
      
      // ✅ Check if it's a budget error
      if (error.response?.status === 422 && error.response?.data?.budget_info) {
        const budgetData = error.response.data;
        setBudgetErrorData(budgetData);
        setShowBudgetErrorModal(true);
        
        // Also show toast
        toast.error(
          `${budgetData.message}\n\n` +
          `Remaining: ₱${budgetData.budget_info.remaining.toLocaleString()}\n` +
          `Requested: ₱${budgetData.budget_info.requested.toLocaleString()}\n` +
          `Shortage: ₱${budgetData.budget_info.shortage.toLocaleString()}`
        );
      } else {
        toast.error(error.response?.data?.message || 'Failed to release funds');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) return;
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await mayorsOfficeAPI.rejectTicket(
        selectedTicket.id || selectedTicket.trip_ticket_id,
        rejectionNote
      );
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote('');
      fetchAllData();
      toast.success('Ticket rejected and returned to department');
    } catch (error) {
      console.error('Failed to reject ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Budget Error Modal Component
  const BudgetErrorModal = () => (
    <Dialog open={showBudgetErrorModal} onOpenChange={setShowBudgetErrorModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Insufficient Budget
          </DialogTitle>
          <DialogDescription>
            The department does not have enough budget for this trip.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Budget Details */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Allocated Budget:</span>
                <span className="font-semibold">
                  ₱{budgetErrorData?.budget_info?.allocated?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Spent So Far:</span>
                <span className="font-semibold text-orange-600">
                  ₱{budgetErrorData?.budget_info?.spent?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-red-200">
                <span className="text-gray-600">Remaining Budget:</span>
                <span className="font-semibold text-red-600">
                  ₱{budgetErrorData?.budget_info?.remaining?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Requested Amount:</span>
                <span className="font-semibold">
                  ₱{budgetErrorData?.budget_info?.requested?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-red-200">
                <span className="text-gray-600">Shortage:</span>
                <span className="font-semibold text-red-600">
                  ₱{budgetErrorData?.budget_info?.shortage?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Budget Utilization</span>
              <span className="text-red-600">
                {Math.round((budgetErrorData?.budget_info?.spent / budgetErrorData?.budget_info?.allocated) * 100)}%
              </span>
            </div>
            <Progress 
              value={(budgetErrorData?.budget_info?.spent / budgetErrorData?.budget_info?.allocated) * 100} 
              className="h-2"
            />
          </div>

          {/* Suggestions */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium mb-2">Suggestions:</p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Reduce the amount to ₱{budgetErrorData?.budget_info?.remaining?.toLocaleString()}</li>
              <li>Use MO Emergency Fund (create MO-funded ticket)</li>
              <li>Request department to reduce trip cost</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => setShowBudgetErrorModal(false)}>
            Close
          </Button>
          <Button 
            onClick={() => {
              setShowBudgetErrorModal(false);
              navigate('/mo/budget-assistance');
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Budget Assistance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const getStatusBadge = (status) => {
    const config = {
      with_mayors_office: { color: 'bg-yellow-500', label: 'Pending Fund Release', icon: '💰' },
      funds_issued: { color: 'bg-green-500', label: 'Funds Issued', icon: '✅' },
      in_transit: { color: 'bg-blue-500', label: 'In Transit', icon: '🚗' },
      closed: { color: 'bg-green-700', label: 'Closed', icon: '🏁' },
      rejected: { color: 'bg-red-500', label: 'Rejected', icon: '❌' }
    };
    const c = config[status] || { color: 'bg-gray-500', label: status?.replace(/_/g, ' ') || 'Unknown', icon: '📋' };
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1 w-fit px-2 py-1`}>
        <span>{c.icon}</span>
        {c.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

const formatCurrency = (amount) => {
    // Convert to number and validate
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
        return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2
    }).format(numAmount);
};

const totalAmountReleased = approvedTickets.reduce((sum, t) => {
    let amount = 0;
    if (t.amount_released) {
        amount = parseFloat(t.amount_released);
    } else if (t.gas_slip?.amount_released) {
        amount = parseFloat(t.gas_slip.amount_released);
    }
    // Ensure it's a valid number
    return sum + (isNaN(amount) ? 0 : amount);
}, 0);




  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                Mayor's Office
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">Mayor's Office Dashboard</h1>
            <p className="text-slate-300 mt-1">Review and release funds for verified trip tickets</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <Badge variant="outline" className="text-yellow-600">Awaiting</Badge>
            </div>
            <p className="text-2xl font-bold">{pendingTickets.length}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Fund Release</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="outline" className="text-green-600">Released</Badge>
            </div>
            <p className="text-2xl font-bold">{approvedTickets.length}</p>
            <p className="text-sm text-gray-500 mt-1">Funds Released</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-blue-600">Total</Badge>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalAmountReleased)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Amount Released</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-purple-600">Utilization</Badge>
            </div>
            <p className="text-2xl font-bold">65%</p>
            <p className="text-sm text-gray-500 mt-1">Budget Utilization</p>
            <Progress value={65} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Budget Assistance Widget */}
      <BudgetAssistanceWidget />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Released ({approvedTickets.length})
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'pending' && pendingTickets.length > 0 && (
            <div className="relative">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Pending Fund Release Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Trip Tickets Awaiting Fund Release
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTickets.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No pending tickets</p>
                  <p className="text-sm text-gray-400">All tickets have been processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTickets.map((ticket) => (
                        <TableRow key={ticket.id || ticket.trip_ticket_id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {ticket.ticket_number || ticket.trip_ticket_number}
                          </TableCell>
                          <TableCell>{formatDate(ticket.trip_date)}</TableCell>
                          <TableCell>{ticket.destination}</TableCell>
                          <TableCell>{ticket.department_name}</TableCell>
                          <TableCell>{ticket.vehicle?.plate_number || 'N/A'}</TableCell>
                          <TableCell>{ticket.driver?.full_name || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/mo/tickets/${ticket.id || ticket.trip_ticket_id}`)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setAmountReleased(ticket.estimated_cost?.toString() || '');
                                  setShowApproveDialog(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Release
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tickets Tab */}
        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Funds Released Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedTickets.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No funds released yet</p>
                  <p className="text-sm text-gray-400">Approved tickets will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Amount Released</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedTickets.map((ticket) => (
                        <TableRow key={ticket.id || ticket.trip_ticket_id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {ticket.ticket_number || ticket.trip_ticket_number}
                          </TableCell>
                          <TableCell>{formatDate(ticket.trip_date)}</TableCell>
                          <TableCell>{ticket.destination}</TableCell>
                          <TableCell>{ticket.department_name}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(ticket.amount_released)}
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/mo/tickets/${ticket.id || ticket.trip_ticket_id}`)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Fund Release Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Release Funds
            </DialogTitle>
            <DialogDescription>
              Enter the amount to release for this trip. A gas slip will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Ticket Number</p>
                  <p className="font-semibold">{selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Department</p>
                  <p className="font-semibold">{selectedTicket?.department_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Destination</p>
                  <p className="font-semibold">{selectedTicket?.destination}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Driver</p>
                  <p className="font-semibold">{selectedTicket?.driver?.full_name || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount to Release (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amountReleased}
                onChange={(e) => setAmountReleased(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This amount will be recorded in the gas slip and fund issuance.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Release Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent back to the department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">
                <strong>Ticket:</strong> {selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}<br />
                <strong>Department:</strong> {selectedTicket?.department_name}<br />
                <strong>Destination:</strong> {selectedTicket?.destination}
              </p>
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Error Modal */}
      <BudgetErrorModal />
    </div>
  );
};

export default MayorDashboard;