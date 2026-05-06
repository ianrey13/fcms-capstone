// src/pages/gso/GsoDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { gsoAPI } from '../../services/api';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Truck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Check,
  X,
  Send,
  Printer,
  Search,
  Filter,
  Building2,
  FileCheck,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

const GsoDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingTickets, setPendingTickets] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [forwardableTickets, setForwardableTickets] = useState([]);
  const [filteredForwardable, setFilteredForwardable] = useState([]);
  const [forwardedTickets, setForwardedTickets] = useState([]);
  const [filteredForwarded, setFilteredForwarded] = useState([]);
  const [returnedCount, setReturnedCount] = useState(0);
  const [withMayorsOffice, setWithMayorsOffice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Department name for display (clean, no PNP)
  const departmentName = user?.department_name?.replace('Philippine National Police - ', '').replace('PNP - ', '') || 'General Services Office';

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter tickets when search changes
  useEffect(() => {
    filterTickets();
  }, [searchQuery, pendingTickets, forwardableTickets, forwardedTickets]);

  const filterTickets = () => {
    const query = searchQuery.toLowerCase();
    
    if (!query) {
      setFilteredPending(pendingTickets);
      setFilteredForwardable(forwardableTickets);
      setFilteredForwarded(forwardedTickets);
      return;
    }
    
    setFilteredPending(pendingTickets.filter(ticket => 
      (ticket.trip_ticket_number || ticket.ticket_number || '').toLowerCase().includes(query) ||
      (ticket.destination || '').toLowerCase().includes(query) ||
      (ticket.department_name || '').toLowerCase().includes(query) ||
      (ticket.vehicle?.plate_number || '').toLowerCase().includes(query)
    ));
    
    setFilteredForwardable(forwardableTickets.filter(ticket => 
      (ticket.trip_ticket_number || ticket.ticket_number || '').toLowerCase().includes(query) ||
      (ticket.destination || '').toLowerCase().includes(query) ||
      (ticket.department_name || '').toLowerCase().includes(query)
    ));
    
    setFilteredForwarded(forwardedTickets.filter(ticket => 
      (ticket.trip_ticket_number || ticket.ticket_number || '').toLowerCase().includes(query) ||
      (ticket.destination || '').toLowerCase().includes(query) ||
      (ticket.department_name || '').toLowerCase().includes(query)
    ));
  };

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      toast.loading('Refreshing dashboard...', { id: 'refresh' });
    } else {
      setLoading(true);
    }
    
    try {
      await Promise.all([
        fetchPendingTickets(),
        fetchForwardableTickets(),
        fetchForwardedTickets(),
        fetchStats(),
      ]);
      
      if (isRefresh) {
        toast.success('Dashboard refreshed successfully', { id: 'refresh' });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (isRefresh) {
        toast.error('Failed to refresh dashboard', { id: 'refresh' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await gsoAPI.getDashboard();
      const statsData = response.data?.data || response.data?.stats || {};
      setReturnedCount(statsData.returned || 0);
      setWithMayorsOffice(statsData.with_mayors_office || 0);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPendingTickets = async () => {
    try {
      const response = await gsoAPI.getPendingTickets();
      const ticketsData = response.data?.data || response.data?.tickets || [];
      const tickets = Array.isArray(ticketsData) ? ticketsData : [];
      setPendingTickets(tickets);
      setFilteredPending(tickets);
    } catch (error) {
      console.error('Failed to fetch pending tickets:', error);
      setPendingTickets([]);
      setFilteredPending([]);
    }
  };

  const fetchForwardableTickets = async () => {
    try {
      const response = await gsoAPI.getVerifiedTickets();
      let ticketsData = response.data?.data || response.data?.tickets || [];
      ticketsData = Array.isArray(ticketsData) ? ticketsData : [];
      
      const forwardable = ticketsData.filter(ticket => 
        ticket.status === 'pending_mayors_office'
      );
      
      setForwardableTickets(forwardable);
      setFilteredForwardable(forwardable);
    } catch (error) {
      console.error('Failed to fetch forwardable tickets:', error);
      setForwardableTickets([]);
      setFilteredForwardable([]);
    }
  };

  const fetchForwardedTickets = async () => {
    try {
      const response = await gsoAPI.getVerifiedTickets();
      let ticketsData = response.data?.data || response.data?.tickets || [];
      ticketsData = Array.isArray(ticketsData) ? ticketsData : [];
      
      const forwarded = ticketsData.filter(ticket => 
        ticket.status === 'with_mayors_office' ||
        ticket.status === 'funds_issued' ||
        ticket.status === 'in_transit' ||
        ticket.status === 'pending_reconciliation'
      );
      
      setForwardedTickets(forwarded);
      setFilteredForwarded(forwarded);
    } catch (error) {
      console.error('Failed to fetch forwarded tickets:', error);
      setForwardedTickets([]);
      setFilteredForwarded([]);
    }
  };

  const handleApprove = async () => {
    if (!selectedTicket) return;
    
    setSubmitting(true);
    try {
      await gsoAPI.approveTicket(selectedTicket.trip_ticket_id || selectedTicket.id);
      setShowApproveDialog(false);
      setSelectedTicket(null);
      toast.success('Ticket verified successfully');
      fetchAllData(true);
    } catch (error) {
      console.error('Failed to approve ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to approve ticket');
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
      await gsoAPI.rejectTicket(selectedTicket.trip_ticket_id || selectedTicket.id, { gso_note: rejectionNote });
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote('');
      toast.success('Ticket rejected and returned to department');
      fetchAllData(true);
    } catch (error) {
      console.error('Failed to reject ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForwardToMO = async (ticketId) => {
    setSubmitting(true);
    try {
      await gsoAPI.forwardToMO([ticketId]);
      
      const forwardedTicket = forwardableTickets.find(ticket => 
        (ticket.trip_ticket_id || ticket.id) === ticketId
      );
      
      if (forwardedTicket) {
        const updatedTicket = { ...forwardedTicket, status: 'with_mayors_office' };
        setForwardedTickets(prev => [updatedTicket, ...prev]);
        setFilteredForwarded(prev => [updatedTicket, ...prev]);
        setForwardableTickets(prev => prev.filter(ticket => 
          (ticket.trip_ticket_id || ticket.id) !== ticketId
        ));
        setFilteredForwardable(prev => prev.filter(ticket => 
          (ticket.trip_ticket_id || ticket.id) !== ticketId
        ));
      }
      
      toast.success('Ticket forwarded to Mayor\'s Office');
      fetchStats();
    } catch (error) {
      console.error('Failed to forward ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to forward ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending_gso_review: { color: 'bg-yellow-500', label: 'Pending GSO Review', icon: Clock },
      pending_mayors_office: { color: 'bg-green-500', label: 'Ready for MO', icon: Send },
      with_mayors_office: { color: 'bg-blue-500', label: 'With Mayor\'s Office', icon: Building2 },
      funds_issued: { color: 'bg-purple-500', label: 'Funds Issued', icon: CheckCircle },
      in_transit: { color: 'bg-indigo-500', label: 'In Transit', icon: Truck },
      pending_reconciliation: { color: 'bg-orange-500', label: 'Pending Reconciliation', icon: FileCheck },
      returned_for_revision: { color: 'bg-red-500', label: 'Returned', icon: XCircle },
      rejected: { color: 'bg-red-600', label: 'Rejected', icon: XCircle },
    };
    const c = config[status] || { color: 'bg-gray-500', label: status?.replace(/_/g, ' ') || 'Unknown', icon: AlertCircle };
    const IconComponent = c.icon;
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1 px-2 py-1`}>
        <IconComponent className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Ticket Table Component
  const TicketTable = ({ tickets, showForwardButton = false, onForward, onView, onVerify, onReject, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }
    
    if (tickets.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No tickets found</p>
          <p className="text-sm text-gray-400 mt-1">Tickets will appear here once available</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Ticket #</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Destination</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id || ticket.trip_ticket_id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="font-medium">
                  <span className="font-mono text-sm">
                    {ticket.ticket_number || ticket.trip_ticket_number}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{formatDate(ticket.trip_date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm truncate max-w-[200px]">{ticket.destination}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{ticket.department_name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(ticket.id || ticket.trip_ticket_id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {showForwardButton && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => onForward(ticket.id || ticket.trip_ticket_id)}
                        disabled={submitting}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Forward
                      </Button>
                    )}
                    {!showForwardButton && onVerify && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => onVerify(ticket)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => onReject(ticket)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading && !refreshing) {
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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                GSO Staff
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {departmentName}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">GSO Dashboard</h1>
            <p className="text-slate-300 mt-1">
              Review and verify trip tickets forwarded by Department Heads
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => fetchAllData(true)} 
              disabled={refreshing}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingTickets.length}</p>
                <p className="text-xs text-gray-400 mt-1">Awaiting verification</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Ready to Forward</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{forwardableTickets.length}</p>
                <p className="text-xs text-gray-400 mt-1">Verified tickets</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">With Mayor's Office</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{withMayorsOffice}</p>
                <p className="text-xs text-gray-400 mt-1">Awaiting fund release</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Returned</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{returnedCount}</p>
                <p className="text-xs text-gray-400 mt-1">Needs revision</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by ticket number, destination, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="pending" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="h-4 w-4 mr-2" />
            Ready ({forwardableTickets.length})
          </TabsTrigger>
          <TabsTrigger value="forwarded" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Printer className="h-4 w-4 mr-2" />
            Forwarded ({forwardedTickets.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Trip Tickets Awaiting Review
              </CardTitle>
              <CardDescription>
                Verify the details of each trip ticket before forwarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredPending}
                onView={(id) => navigate(`/gso/tickets/${id}`)}
                onVerify={(ticket) => {
                  setSelectedTicket(ticket);
                  setShowApproveDialog(true);
                }}
                onReject={(ticket) => {
                  setSelectedTicket(ticket);
                  setShowRejectDialog(true);
                }}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ready to Forward Tab */}
        <TabsContent value="ready" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-500" />
                Ready to Forward to Mayor's Office
              </CardTitle>
              <CardDescription>
                These tickets are verified and ready for fund release
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredForwardable}
                showForwardButton={true}
                onForward={handleForwardToMO}
                onView={(id) => navigate(`/gso/tickets/${id}`)}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forwarded Tab */}
        <TabsContent value="forwarded" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-500" />
                Forwarded to Mayor's Office
              </CardTitle>
              <CardDescription>
                Tickets awaiting fund release or in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredForwarded}
                onView={(id) => navigate(`/gso/tickets/${id}`)}
                isLoading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Verify Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this trip ticket? 
              It will be marked as verified and ready for Mayor's Office approval.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">Ticket Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Number:</span> <span className="font-mono">{selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}</span></p>
              <p><span className="text-gray-600">Destination:</span> {selectedTicket?.destination}</p>
              <p><span className="text-gray-600">Department:</span> {selectedTicket?.department_name}</p>
              <p><span className="text-gray-600">Est. Fuel:</span> {selectedTicket?.estimated_fuel_liters || 'N/A'} L</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Verify Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent back to the department.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">Ticket Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">Number:</span> <span className="font-mono">{selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}</span></p>
              <p><span className="text-gray-600">Destination:</span> {selectedTicket?.destination}</p>
              <p><span className="text-gray-600">Department:</span> {selectedTicket?.department_name}</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rejection Reason</label>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">This reason will be visible to the department staff</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GsoDashboard;