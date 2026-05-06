// src/pages/gso/GsoForward.jsx
import React, { useState, useEffect } from 'react';
import { gsoAPI } from '../../services/api';
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
import { Send, RefreshCw, Loader2, CheckSquare, Square } from 'lucide-react';

const GsoForward = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
        const response = await gsoAPI.getForwardQueue();
        const ticketsData = response.data?.tickets || response.data?.data || [];
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
        console.error('Failed to fetch tickets:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(t => t.trip_ticket_id || t.id));
    }
  };

  const handleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedTickets(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleForwardSelected = async () => {
    if (selectedTickets.length === 0) {
      alert('Please select tickets to forward');
      return;
    }
    setSubmitting(true);
    try {
      await gsoAPI.forwardToMO(selectedTickets);
      alert(`${selectedTickets.length} ticket(s) forwarded to Mayor's Office`);
      setSelectedTickets([]);
      await fetchTickets();
    } catch (error) {
      console.error('Failed to forward tickets:', error);
      alert(error.response?.data?.message || 'Failed to forward tickets');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => (
    <Badge className="bg-green-500 text-white">Ready for MO</Badge>
  );

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
          <h1 className="text-2xl font-bold">Forward to Mayor's Office</h1>
          <p className="text-gray-500">Select verified tickets to forward for fund release</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTickets} disabled={submitting}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleForwardSelected}
            disabled={submitting || selectedTickets.length === 0}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Forward Selected ({selectedTickets.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verified Tickets Ready for Forwarding ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tickets ready for forwarding
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="p-0 h-8 w-8"
                      >
                        {selectedTickets.length === tickets.length && tickets.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.trip_ticket_id || ticket.id}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleSelect(ticket.trip_ticket_id || ticket.id, e)}
                          className="p-0 h-8 w-8"
                        >
                          {selectedTickets.includes(ticket.trip_ticket_id || ticket.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {ticket.trip_ticket_number || ticket.ticket_number}
                      </TableCell>
                      <TableCell>{new Date(ticket.trip_date).toLocaleDateString()}</TableCell>
                      <TableCell>{ticket.destination}</TableCell>
                      <TableCell>{ticket.department?.department_name || ticket.department_name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge()}</TableCell>
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

export default GsoForward;