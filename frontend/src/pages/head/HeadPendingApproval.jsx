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
  X
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
      // Handle response structure - response.data.data.tickets
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
      <Badge className="bg-yellow-500 text-white flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" />
        Pending Your Approval
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" />
            Pending Approval
          </h1>
          <p className="text-gray-600 mt-1">
            {department?.name} ({department?.code}) - Trip tickets awaiting your decision
          </p>
        </div>
        <Button variant="outline" onClick={fetchPendingTickets} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{tickets.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Department</p>
                <p className="text-lg font-semibold text-gray-900">{department?.name || 'N/A'}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">{department?.code || '?'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Input
              placeholder="Search by ticket number, destination, driver, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Trip Tickets Awaiting Your Approval ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending tickets</p>
              <p className="text-sm text-gray-400">All trip tickets have been reviewed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.trip_ticket_id || ticket.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {ticket.trip_ticket_number || ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(ticket.trip_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {ticket.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3 text-gray-400" />
                          {ticket.vehicle?.plate_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {ticket.driver?.full_name || ticket.driver_name || 'Not Assigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {ticket.submitted_by_user?.full_name || ticket.requester?.full_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/head/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowApproveDialog(true);
                            }}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
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
                            <X className="h-4 w-4 mr-1" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Trip Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this trip ticket? 
              It will be forwarded to GSO for further review.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
              <strong>Destination:</strong> {selectedTicket?.destination}<br />
              <strong>Driver:</strong> {selectedTicket?.driver?.full_name || selectedTicket?.driver_name || 'Not Assigned'}<br />
              <strong>Requester:</strong> {selectedTicket?.submitted_by_user?.full_name || selectedTicket?.requester?.full_name}<br />
              <strong>Trip Date:</strong> {selectedTicket?.trip_date && new Date(selectedTicket.trip_date).toLocaleDateString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Approve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Trip Ticket</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent back to the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
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
            />
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

export default HeadPendingApproval;