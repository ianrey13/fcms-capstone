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
import { Send, RefreshCw, Loader2, CheckSquare, Square, Building2, Calendar, MapPin, Hash } from 'lucide-react';

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
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
      Ready for MO
    </Badge>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Forward to Mayor's Office
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Select verified tickets to forward for fund release
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchTickets} 
            disabled={submitting}
            className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ready to Forward</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tickets.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selected</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedTickets.length}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Departments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {new Set(tickets.map(t => t.department?.department_name || t.department_name)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Send className="h-5 w-5" />
            Verified Tickets Ready for Forwarding
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <Send className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No tickets ready for forwarding</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Tickets that are verified will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="p-0 h-8 w-8 hover:bg-transparent"
                      >
                        {selectedTickets.length === tickets.length && tickets.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Ticket #
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Destination
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Department
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket, index) => (
                    <TableRow 
                      key={ticket.trip_ticket_id || ticket.id}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()} className="w-12">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleSelect(ticket.trip_ticket_id || ticket.id, e)}
                          className="p-0 h-8 w-8 hover:bg-transparent"
                        >
                          {selectedTickets.includes(ticket.trip_ticket_id || ticket.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono font-medium text-slate-900 dark:text-white">
                        {ticket.trip_ticket_number || ticket.ticket_number}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {formatDate(ticket.trip_date)}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {ticket.destination}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {ticket.department?.department_name || ticket.department_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      {tickets.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">📋 Forwarding Information</p>
                <ul className="space-y-0.5 text-xs">
                  <li>• Selected tickets will be sent to Mayor's Office for fund release</li>
                  <li>• Mayor's Office will review and release funds for the trips</li>
                  <li>• Once forwarded, tickets will appear in Mayor's Office pending list</li>
                  <li className="text-blue-600 dark:text-blue-400 mt-1">
                    ⚠️ Please verify all trip details before forwarding
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GsoForward;