// src/pages/gso/GsoReturned.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Eye, 
  Calendar, 
  MapPin, 
  Truck,
  Building2,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  FileText,
  AlertTriangle
} from 'lucide-react';

const GsoReturned = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        filterTickets();
    }, [searchTerm, departmentFilter, tickets]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await gsoAPI.getReturnedTickets();
            const ticketsData = response.data?.data || response.data || [];
            setTickets(Array.isArray(ticketsData) ? ticketsData : []);
            
            // Extract unique departments for filter
            const uniqueDepts = [...new Set(ticketsData.map(t => t.department?.department_name || t.department_name || 'Unknown'))];
            setDepartments(uniqueDepts);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTickets = () => {
        let filtered = [...tickets];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(ticket => 
                (ticket.trip_ticket_number || ticket.ticket_number || '').toLowerCase().includes(term) ||
                (ticket.destination || '').toLowerCase().includes(term) ||
                (ticket.department?.department_name || ticket.department_name || '').toLowerCase().includes(term)
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

    const getStatusBadge = () => (
        <Badge className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Returned
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

    const getDepartmentName = (ticket) => {
        return ticket.department?.department_name || ticket.department_name || 'N/A';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-slate-500 dark:text-slate-400 mt-3">Loading returned tickets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Returned Tickets
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Tickets returned to departments for revision
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
                                {departments.map((dept, idx) => (
                                    <option key={idx} value={dept}>{dept}</option>
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
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        Returned Tickets
                        <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                            ({filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No returned tickets found</p>
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
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ticket #</TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Destination</TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Department</TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reason</TableHead>
                                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</TableHead>
                                        <TableHead className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.map((ticket, index) => (
                                        <TableRow 
                                            key={ticket.trip_ticket_id || ticket.id} 
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-slate-900 dark:text-white">
                                                        {ticket.trip_ticket_number || ticket.ticket_number}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                        {formatDate(ticket.trip_date)}
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
                                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                    <span className="text-slate-600 dark:text-slate-400 text-sm">
                                                        {getDepartmentName(ticket)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {ticket.return_reason || ticket.rejection_reason || 'Revision required'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
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

            {/* Info Card
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-300">
                            <p className="font-medium mb-1">Returned Tickets Information</p>
                            <ul className="space-y-0.5 text-xs">
                                <li>• Tickets returned by GSO require revision before resubmission</li>
                                <li>• Department staff can edit and resubmit returned tickets</li>
                                <li>• After resubmission, tickets will go through the approval process again</li>
                                <li>• Click "View Details" to see the complete revision notes</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
};

export default GsoReturned;