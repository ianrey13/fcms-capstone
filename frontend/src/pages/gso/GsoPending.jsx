// src/pages/gso/GsoPending.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  Eye, 
  Check, 
  X, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const GsoPending = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchTerm, departmentFilter, tickets]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await gsoAPI.getPendingTickets();
      const ticketsData = response.data?.tickets || response.data?.data || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      // Extract unique departments from tickets or fetch from API
      const response = await gsoAPI.getPendingTickets();
      const ticketsData = response.data?.tickets || response.data?.data || [];
      const uniqueDepts = [...new Set(ticketsData.map(t => t.department?.department_name || t.department_name).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        (ticket.trip_ticket_number || ticket.ticket_number)?.toLowerCase().includes(search) ||
        ticket.destination?.toLowerCase().includes(search) ||
        (ticket.department?.department_name || ticket.department_name)?.toLowerCase().includes(search)
      );
    }
    
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        (ticket.department?.department_name || ticket.department_name) === departmentFilter
      );
    }
    
    setFilteredTickets(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || departmentFilter !== 'all';

  const handleApprove = async () => {
    if (!selectedTicket) return;
    
    setSubmitting(true);
    try {
      await gsoAPI.approveTicket(selectedTicket.trip_ticket_id || selectedTicket.id);
      setShowApproveDialog(false);
      setSelectedTicket(null);
      fetchTickets();
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
      await gsoAPI.rejectTicket(selectedTicket.trip_ticket_id || selectedTicket.id, { gso_note: rejectionNote });
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote('');
      fetchTickets();
    } catch (error) {
      console.error('Failed to reject ticket:', error);
      alert(error.response?.data?.message || 'Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => (
    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 px-2.5 py-1 rounded-lg">
      <Clock className="h-3 w-3 mr-1" />
      Pending Review
    </Badge>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalCount = filteredTickets.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Pending Review
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Trip tickets awaiting GSO verification
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchTickets}
          className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending Tickets</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Departments</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{departments.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Awaiting Action</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalCount}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ticket #, destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <X className="h-4 w-4 mr-2" />
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
            Pending Tickets
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({totalCount} {totalCount === 1 ? 'ticket' : 'tickets'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No pending tickets</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">All tickets have been processed</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No matching tickets found</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Ticket #</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Date</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Destination</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Department</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">Status</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket, index) => (
                    <TableRow 
                      key={ticket.trip_ticket_id || ticket.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">#{String(index + 1).padStart(3, '0')}</span>
                          </div>
                          {ticket.trip_ticket_number || ticket.ticket_number}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{formatDate(ticket.trip_date)}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300 font-medium">{ticket.destination}</TableCell>
                      <TableCell>
                        <span className="text-slate-600 dark:text-slate-400">
                          {ticket.department?.department_name || ticket.department_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
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
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md h-8 px-3"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowRejectDialog(true);
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 h-8 px-3"
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
            <DialogTitle className="dark:text-white">Verify Trip Ticket</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Are you sure you want to verify this trip ticket? 
              It will be marked as verified and ready for Mayor's Office approval.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
              <strong>Destination:</strong> {selectedTicket?.destination}<br />
              <strong>Department:</strong> {selectedTicket?.department?.department_name || selectedTicket?.department_name}
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
              Verify Ticket
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
              Please provide a reason for rejection. This will be sent back to the department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
                <strong>Destination:</strong> {selectedTicket?.destination}
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

export default GsoPending;