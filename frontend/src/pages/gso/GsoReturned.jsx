// src/pages/gso/GsoReturned.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, RefreshCw, Loader2, Eye, Calendar, MapPin, Truck } from 'lucide-react';

const GsoReturned = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await gsoAPI.getReturnedTickets();
            // Handle response structure - response.data.data
            const ticketsData = response.data?.data || response.data || [];
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => (
        <Badge className="bg-red-500 text-white">Returned for Revision</Badge>
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
                    <h1 className="text-2xl font-bold">Returned Tickets</h1>
                    <p className="text-gray-500">Tickets returned to departments for revision</p>
                </div>
                <Button variant="outline" onClick={fetchTickets}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Returned Tickets ({tickets.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No returned tickets</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ticket #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map((ticket) => (
                                        <TableRow key={ticket.trip_ticket_id || ticket.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">
                                                {ticket.trip_ticket_number || ticket.ticket_number}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    {formatDate(ticket.trip_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-gray-400" />
                                                    {ticket.destination}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {ticket.department?.department_name || ticket.department_name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-red-600">
                                                    {ticket.return_reason || ticket.rejection_reason || 'Revision required'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStatusBadge()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                                                    title="View Details"
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
        </div>
    );
};

export default GsoReturned;