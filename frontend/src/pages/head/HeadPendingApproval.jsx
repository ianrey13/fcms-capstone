// src/pages/head/HeadPendingApproval.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { headOfficeAPI } from '../../services/api';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Truck,
  User,
  Loader2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Building2,
  FileText
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const HeadPendingApproval = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    setLoading(true);
    try {
      const response = await headOfficeAPI.getPendingTickets();
      const ticketsData = response.data?.data?.tickets || response.data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setDepartment(response.data?.data?.department || response.data?.department);
    } catch (error) {
      console.error('Failed to fetch pending tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTicket) return;
    
    setSubmitting(true);
    try {
      await headOfficeAPI.approveTicket(selectedTicket.trip_ticket_id || selectedTicket.id, null);
      setShowApproveDialog(false);
      setSelectedTicket(null);
      fetchPendingTickets();
    } catch (error) {
      console.error('Failed to approve ticket:', error);
      alert(error.response?.data?.message || 'Failed to approve ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) return;
    if (!rejectionNote.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await headOfficeAPI.rejectTicket(
        selectedTicket.trip_ticket_id || selectedTicket.id,
        rejectionNote
      );
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote('');
      fetchPendingTickets();
    } catch (error) {
      console.error('Failed to reject ticket:', error);
      alert(error.response?.data?.message || 'Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg">
        <Clock className="h-3 w-3" />
        Pending Your Approval
      </Badge>
    );
  };

  const getSortTickets = (ticketsList) => {
    const sorted = [...ticketsList];
    switch (sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date));
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.trip_date) - new Date(b.trip_date));
      case 'destination_asc':
        return sorted.sort((a, b) => (a.destination || '').localeCompare(b.destination || ''));
      case 'destination_desc':
        return sorted.sort((a, b) => (b.destination || '').localeCompare(a.destination || ''));
      default:
        return sorted;
    }
  };

  const filteredTickets = () => {
    let filtered = tickets.filter(ticket => {
      const search = searchTerm.toLowerCase();
      return (
        (ticket.trip_ticket_number || ticket.ticket_number)?.toLowerCase().includes(search) ||
        ticket.destination?.toLowerCase().includes(search) ||
        ticket.submitted_by_user?.full_name?.toLowerCase().includes(search) ||
        ticket.requester?.full_name?.toLowerCase().includes(search) ||
        ticket.driver?.full_name?.toLowerCase().includes(search) ||
        ticket.vehicle?.plate_number?.toLowerCase().includes(search)
      );
    });
    return getSortTickets(filtered);
  };

  const displayTickets = filteredTickets();
  const hasActiveFilters = searchTerm !== '';

  const clearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-500" />
            Pending Approval
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {department?.name} ({department?.code}) - Trip tickets awaiting your decision
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchPendingTickets} 
          className="flex items-center gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{tickets.length}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Department</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{department?.name || 'N/A'}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tickets.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Card */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div 
          className="px-6 py-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Search & Filters</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search by ticket #, destination, driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="date_desc">Sort by: Newest First</option>
                <option value="date_asc">Sort by: Oldest First</option>
                <option value="destination_asc">Sort by: Destination (A-Z)</option>
                <option value="destination_desc">Sort by: Destination (Z-A)</option>
              </select>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Tickets Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-amber-500" />
            Trip Tickets Awaiting Your Approval
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({displayTickets.length} {displayTickets.length === 1 ? 'ticket' : 'tickets'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-emerald-300 dark:text-emerald-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No pending tickets</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">All trip tickets have been reviewed</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear search filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ticket #</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Destination</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Vehicle</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Driver</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Requester</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTickets.map((ticket, index) => (
                    <TableRow 
                      key={ticket.trip_ticket_id || ticket.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {ticket.trip_ticket_number || ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(ticket.trip_date).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {ticket.destination}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm font-mono">
                            {ticket.vehicle?.plate_number || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {ticket.driver?.full_name || ticket.driver_name || 'Not Assigned'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {ticket.submitted_by_user?.full_name || ticket.requester?.full_name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/head/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowApproveDialog(true);
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowRejectDialog(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
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

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Approve Trip Ticket</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Are you sure you want to approve this trip ticket? 
              It will be forwarded to GSO for further review.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
              <strong>Destination:</strong> {selectedTicket?.destination}<br />
              <strong>Driver:</strong> {selectedTicket?.driver?.full_name || selectedTicket?.driver_name || 'Not Assigned'}<br />
              <strong>Requester:</strong> {selectedTicket?.submitted_by_user?.full_name || selectedTicket?.requester?.full_name}<br />
              <strong>Trip Date:</strong> {selectedTicket?.trip_date && new Date(selectedTicket.trip_date).toLocaleDateString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Approve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Reject Trip Ticket</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Please provide a reason for rejection. This will be sent back to the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
                <strong>Destination:</strong> {selectedTicket?.destination}<br />
                <strong>Driver:</strong> {selectedTicket?.driver?.full_name || selectedTicket?.driver_name || 'Not Assigned'}<br />
                <strong>Requester:</strong> {selectedTicket?.submitted_by_user?.full_name || selectedTicket?.requester?.full_name}
              </p>
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={submitting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeadPendingApproval;