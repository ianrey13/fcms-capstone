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
  ChevronRight,
  ChevronDown,
  ChevronUp
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

  const departmentName = user?.department_name?.replace('Philippine National Police - ', '').replace('PNP - ', '') || 'General Services Office';

  useEffect(() => {
    fetchAllData();
  }, []);

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

        console.log("selectedTicket:", selectedTicket);  // ← Add this
    console.log("rejectionNote:", rejectionNote);     // ← Add this

    if (!selectedTicket) return;
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await gsoAPI.rejectTicket(selectedTicket.trip_ticket_id || selectedTicket.id, rejectionNote);
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
      pending_mayors_office: { color: 'bg-emerald-500', label: 'Ready for MO', icon: Send },
      with_mayors_office: { color: 'bg-blue-500', label: 'With Mayor\'s Office', icon: Building2 },
      funds_issued: { color: 'bg-purple-500', label: 'Funds Issued', icon: CheckCircle },
      in_transit: { color: 'bg-indigo-500', label: 'In Transit', icon: Truck },
      pending_reconciliation: { color: 'bg-orange-500', label: 'Pending Reconciliation', icon: FileCheck },
      returned_for_revision: { color: 'bg-red-500', label: 'Returned', icon: XCircle },
      rejected: { color: 'bg-red-600', label: 'Rejected', icon: XCircle },
    };
    const c = config[status] || { color: 'bg-slate-500', label: status?.replace(/_/g, ' ') || 'Unknown', icon: AlertCircle };
    const IconComponent = c.icon;
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg`}>
        <IconComponent className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Ticket Table Component
  const TicketTable = ({ tickets, showForwardButton = false, onForward, onView, onVerify, onReject, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading tickets...</p>
          </div>
        </div>
      );
    }
    
    if (tickets.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No tickets found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tickets will appear here once available</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Ticket #</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Date</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Destination</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Department</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, index) => (
              <TableRow key={ticket.id || ticket.trip_ticket_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                <TableCell className="font-medium">
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white">
                    {ticket.ticket_number || ticket.trip_ticket_number}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(ticket.trip_date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{ticket.destination}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{ticket.department_name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(ticket.id || ticket.trip_ticket_id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {showForwardButton && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 px-3"
                        onClick={() => onForward(ticket.id || ticket.trip_ticket_id)}
                        disabled={submitting}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Forward
                      </Button>
                    )}
                    {!showForwardButton && onVerify && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 px-3"
                          onClick={() => onVerify(ticket)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 h-8 px-3"
                          onClick={() => onReject(ticket)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
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
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header Section - Premium Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-full px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                GSO Staff
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-3 py-1">
                {departmentName}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">GSO Dashboard</h1>
            <p className="text-slate-300 mt-1">
              Review and verify trip tickets forwarded by Department Heads
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => fetchAllData(true)} 
              disabled={refreshing}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
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
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingTickets.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Awaiting verification</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-950/50 rounded-2xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ready to Forward</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{forwardableTickets.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Verified tickets</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">With Mayor's Office</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{withMayorsOffice}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Awaiting fund release</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Returned</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{returnedCount}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Needs revision</p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by ticket number, destination, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Send className="h-4 w-4 mr-2" />
            Ready ({forwardableTickets.length})
          </TabsTrigger>
          <TabsTrigger value="forwarded" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Printer className="h-4 w-4 mr-2" />
            Forwarded ({forwardedTickets.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <Clock className="h-5 w-5 text-yellow-500" />
                Trip Tickets Awaiting Review
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
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
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <Send className="h-5 w-5 text-emerald-500" />
                Ready to Forward to Mayor's Office
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
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
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <Printer className="h-5 w-5 text-blue-500" />
                Forwarded to Mayor's Office
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
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
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              Verify Trip Ticket
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Are you sure you want to verify this trip ticket? 
              It will be marked as verified and ready for Mayor's Office approval.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-4 space-y-2 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Ticket Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-600 dark:text-slate-400">Number:</span> <span className="font-mono font-semibold dark:text-white">{selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}</span></p>
              <p><span className="text-slate-600 dark:text-slate-400">Destination:</span> <span className="dark:text-white">{selectedTicket?.destination}</span></p>
              <p><span className="text-slate-600 dark:text-slate-400">Department:</span> <span className="dark:text-white">{selectedTicket?.department_name}</span></p>
              <p><span className="text-slate-600 dark:text-slate-400">Est. Fuel:</span> <span className="dark:text-white">{selectedTicket?.estimated_fuel_liters || 'N/A'} L</span></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={handleApprove} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Verify Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Trip Ticket
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Please provide a reason for rejection. This will be sent back to the department.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-4 space-y-2 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Ticket Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-600 dark:text-slate-400">Number:</span> <span className="font-mono font-semibold dark:text-white">{selectedTicket?.ticket_number || selectedTicket?.trip_ticket_number}</span></p>
              <p><span className="text-slate-600 dark:text-slate-400">Destination:</span> <span className="dark:text-white">{selectedTicket?.destination}</span></p>
              <p><span className="text-slate-600 dark:text-slate-400">Department:</span> <span className="dark:text-white">{selectedTicket?.department_name}</span></p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejection Reason</label>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">This reason will be visible to the department staff</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm" onClick={handleReject} disabled={submitting}>
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