// src/pages/gso/GsoPending.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Eye, Check, X, RefreshCw, Loader2 } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
    setLoading(true);
    try {
        const response = await gsoAPI.getPendingTickets();
        // Controller returns { success, pending_count, tickets }
        const ticketsData = response.data?.tickets || response.data?.data || [];
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
    } finally {
        setLoading(false);
    }
};

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
        <Badge className="bg-yellow-500 text-white">Pending GSO Review</Badge>
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pending Review</h1>
                    <p className="text-gray-500">Trip tickets awaiting GSO verification</p>
                </div>
                <Button variant="outline" onClick={fetchTickets}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Pending Tickets ({tickets.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No pending tickets</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.trip_ticket_id || ticket.id}>
                                        <TableCell className="font-medium">
                                            {ticket.trip_ticket_number || ticket.ticket_number}
                                        </TableCell>
                                        <TableCell>{formatDate(ticket.trip_date)}</TableCell>
                                        <TableCell>{ticket.destination}</TableCell>
                                        <TableCell>{ticket.department?.department_name || ticket.department_name || 'N/A'}</TableCell>
                                        <TableCell>{getStatusBadge()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
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
                    )}
                </CardContent>
            </Card>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Trip Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to verify this trip ticket? 
                            It will be marked as verified and ready for Mayor's Office approval.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
                            <strong>Destination:</strong> {selectedTicket?.destination}<br />
                            <strong>Department:</strong> {selectedTicket?.department?.department_name || selectedTicket?.department_name}
                        </p>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Trip Ticket</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. This will be sent back to the department.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Ticket:</strong> {selectedTicket?.trip_ticket_number || selectedTicket?.ticket_number}<br />
                                <strong>Destination:</strong> {selectedTicket?.destination}
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

export default GsoPending;