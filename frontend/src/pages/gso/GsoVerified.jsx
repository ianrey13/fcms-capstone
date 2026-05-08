// src/pages/gso/GsoVerified.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Send, RefreshCw, Loader2, Eye, Calendar, MapPin, Printer, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Gas Slip Modal Component for viewing
const GasSlipViewModal = ({ isOpen, onClose, ticket }) => {
  if (!isOpen || !ticket) return null;

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gas Slip - ${ticket.trip_ticket_number || ticket.ticket_number}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: portrait; margin: 0.5in; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', 'Georgia', 'Serif';
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .gas-slip-container {
              width: 100%;
              max-width: 550px;
              background: white;
              margin: 0 auto;
              border: 1px solid #333;
            }
            .header-banner {
              background: linear-gradient(135deg, #2d5a3f 0%, #4a7c59 50%, #2d5a3f 100%);
              padding: 12px 15px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #1a1a1a;
            }
            .logo-left, .logo-right {
              width: 55px;
              height: 55px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              text-align: center;
              font-weight: bold;
              border: 2px solid #ffd700;
            }
            .header-text { text-align: center; flex: 1; color: white; }
            .header-text .republic { font-size: 9px; letter-spacing: 1px; margin-bottom: 2px; }
            .header-text .province { font-size: 10px; font-weight: bold; margin-bottom: 1px; }
            .header-text .municipality { font-size: 11px; font-weight: bold; margin-bottom: 1px; }
            .header-text .office { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
            .title-box { background: #d4c5b5; border-bottom: 2px solid #1a1a1a; text-align: center; padding: 8px; }
            .title-box h1 { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #1a1a1a; margin: 0; }
            .form-content { padding: 20px 25px; }
            .row { display: flex; margin-bottom: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
            .label { font-weight: bold; font-size: 11px; min-width: 120px; text-transform: uppercase; }
            .value { flex: 1; font-size: 12px; font-weight: 500; }
            .fuel-section { margin: 15px 0; }
            .fuel-header { display: flex; text-align: center; margin-bottom: 8px; }
            .fuel-header-col { flex: 1; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .fuel-row { display: flex; align-items: center; margin-bottom: 6px; }
            .fuel-type { flex: 1; font-size: 11px; font-style: italic; }
            .fuel-liters, .fuel-amount { flex: 1; border-bottom: 1px solid #333; text-align: center; font-size: 11px; font-weight: 600; }
            .control-row { display: flex; align-items: center; margin-top: 15px; gap: 10px; }
            .control-number-box { flex: 1; border-bottom: 1px solid #333; text-align: center; font-size: 12px; font-weight: bold; }
            .signature-section { margin-top: 30px; text-align: center; }
            .signature-line { border-top: 1px solid #333; width: 250px; margin: 0 auto 8px auto; padding-top: 8px; }
            .mayor-name { font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .mayor-title { font-size: 10px; font-style: italic; margin-top: 3px; }
            @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="gas-slip-container">
            <div class="header-banner">
              <div class="logo-left">MUN<br/>LOGO</div>
              <div class="header-text">
                <div class="republic">REPUBLIC OF THE PHILIPPINES</div>
                <div class="province">PROVINCE OF MISAMIS ORIENTAL</div>
                <div class="municipality">MUNICIPALITY OF LAGUINDINGAN</div>
                <div class="office">GENERAL SERVICES OFFICE</div>
              </div>
              <div class="logo-right">GSO<br/>LOGO</div>
            </div>
            <div class="title-box"><h1>GAS SLIP</h1></div>
            <div class="form-content">
              <div class="row"><div class="label">Driver</div><div class="value">${ticket.driver?.full_name || ticket.driver_name || 'N/A'}</div></div>
              <div class="row"><div class="label">Vehicle/Plate #</div><div class="value">${ticket.vehicle?.plate_number || 'N/A'} - ${ticket.vehicle?.vehicle_model || ''}</div></div>
              <div class="row"><div class="label">Date</div><div class="value">${new Date(ticket.trip_date).toLocaleDateString()}</div></div>
              <div class="row"><div class="label">Purpose</div><div class="value">${ticket.purpose || 'N/A'}</div></div>
              <div class="row"><div class="label">Destination</div><div class="value">${ticket.destination || 'N/A'}</div></div>
              <div class="fuel-section">
                <div class="fuel-header"><div class="fuel-header-col">FUEL</div><div class="fuel-header-col">LITERS</div><div class="fuel-header-col">AMOUNT</div></div>
                <div class="fuel-row"><div class="fuel-type">Diesel</div><div class="fuel-liters">${ticket.fuel_liters || '_____'}</div><div class="fuel-amount">₱${ticket.amount_released?.toLocaleString() || '0'}</div></div>
                <div class="fuel-row"><div class="fuel-type">Engine Oil</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
                <div class="fuel-row"><div class="fuel-type">Brake Fluid</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
              </div>
              <div class="control-row"><div class="label">Control No.</div><div class="control-number-box">${ticket.trip_ticket_number || ticket.ticket_number}</div></div>
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="mayor-name">HON. AMY. ROY I. MACUA</div>
              <div class="mayor-title">Municipal Mayor</div>
            </div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-2xl dark:bg-slate-800">
        <div className="bg-white dark:bg-slate-800">
          <div className="bg-gradient-to-r from-[#2d5a3f] via-[#4a7c59] to-[#2d5a3f] px-4 py-3 flex items-center justify-between border-b-2 border-gray-800">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-yellow-500 text-[8px] text-center font-bold text-[#2d5a3f]">MUN<br/>LOGO</div>
            <div className="text-center flex-1 text-white">
              <div className="text-[9px] tracking-wider mb-0.5">REPUBLIC OF THE PHILIPPINES</div>
              <div className="text-[10px] font-bold">PROVINCE OF MISAMIS ORIENTAL</div>
              <div className="text-[11px] font-bold">MUNICIPALITY OF LAGUINDINGAN</div>
              <div className="text-[10px] font-bold tracking-wider">GENERAL SERVICES OFFICE</div>
            </div>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-yellow-500 text-[8px] text-center font-bold text-[#2d5a3f]">GSO<br/>LOGO</div>
          </div>
          <div className="bg-[#d4c5b5] dark:bg-amber-900/50 border-b-2 border-gray-800 text-center py-2"><h1 className="text-2xl font-bold tracking-widest text-gray-800 dark:text-white">GAS SLIP</h1></div>
          <div className="px-6 py-5 font-serif">
            <div className="flex items-end mb-4 gap-3"><span className="text-sm font-bold text-gray-800 dark:text-gray-300 min-w-[120px]">Driver</span><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-sm font-semibold text-center pb-0.5 dark:text-white">{ticket.driver?.full_name || ticket.driver_name || 'N/A'}</div></div>
            <div className="flex gap-6 mb-4"><div className="flex-1 flex items-end gap-2"><span className="text-sm font-bold text-gray-800 dark:text-gray-300 whitespace-nowrap">Vehicle/Plate #</span><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-sm font-semibold text-center pb-0.5 dark:text-white">{ticket.vehicle?.plate_number || 'N/A'} - {ticket.vehicle?.vehicle_model || ''}</div></div><div className="flex-1 flex items-end gap-2"><span className="text-sm font-bold text-gray-800 dark:text-gray-300">Date</span><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-sm font-semibold text-center pb-0.5 dark:text-white">{new Date(ticket.trip_date).toLocaleDateString()}</div></div></div>
            <div className="mb-4"><span className="text-sm font-bold text-gray-800 dark:text-gray-300">Purpose</span><div className="w-full border-b border-gray-800 dark:border-gray-600 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2 dark:text-white">{ticket.purpose || 'N/A'}</div></div>
            <div className="mb-5"><span className="text-sm font-bold text-gray-800 dark:text-gray-300">Destination</span><div className="w-full border-b border-gray-800 dark:border-gray-600 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2 dark:text-white">{ticket.destination || 'N/A'}</div></div>
            <div className="mb-4"><div className="flex text-center mb-2"><div className="flex-1 text-sm font-bold uppercase tracking-wide dark:text-gray-300">FUEL</div><div className="flex-1 text-sm font-bold uppercase tracking-wide dark:text-gray-300">LITERS</div><div className="flex-1 text-sm font-bold uppercase tracking-wide dark:text-gray-300">AMOUNT</div></div>
            <div className="flex items-center mb-2"><div className="flex-1 text-sm italic dark:text-gray-400">Diesel</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm font-semibold pb-0.5 dark:text-white">{ticket.fuel_liters || '_____'}</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm font-semibold pb-0.5 text-green-700 dark:text-green-400">₱{ticket.amount_released?.toLocaleString() || '0'}</div></div>
            <div className="flex items-center mb-2"><div className="flex-1 text-sm italic dark:text-gray-400">Engine Oil</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm pb-0.5">-</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm pb-0.5"></div></div>
            <div className="flex items-center"><div className="flex-1 text-sm italic dark:text-gray-400">Brake Fluid</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm pb-0.5">-</div><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm pb-0.5"></div></div></div>
            <div className="flex items-center gap-3 mt-5"><span className="text-sm font-bold text-gray-800 dark:text-gray-300">Control No.</span><div className="flex-1 border-b border-gray-800 dark:border-gray-600 text-center text-sm font-bold tracking-wider pb-0.5 dark:text-white">{ticket.trip_ticket_number || ticket.ticket_number}</div></div>
          </div>
          <div className="text-center pt-6 pb-8 px-8"><div className="border-t border-gray-800 dark:border-gray-600 w-64 mx-auto pt-3 mb-2"></div><div className="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-white">HON. AMY. ROY I. MACUA</div><div className="text-xs italic text-gray-600 dark:text-gray-400 mt-1">Municipal Mayor</div></div>
        </div>
        <div className="flex gap-3 p-4 border-t bg-gray-50 dark:bg-slate-900 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1 dark:border-slate-700 dark:text-slate-300">Close</Button>
          <Button onClick={handlePrint} className="flex-1 gap-2 bg-[#2d5a3f] hover:bg-[#1e3d2a] dark:bg-emerald-700 dark:hover:bg-emerald-800"><Printer className="h-4 w-4" />Print Gas Slip</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GsoVerified = () => {
  const navigate = useNavigate();
  const [pendingTickets, setPendingTickets] = useState([]);
  const [forwardedTickets, setForwardedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showGasSlipModal, setShowGasSlipModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const response = await gsoAPI.getVerifiedTickets();
      let allTickets = response.data?.data || response.data || [];
      allTickets = Array.isArray(allTickets) ? allTickets : [];
      
      const pending = allTickets.filter(t => 
        t.status === 'pending_mayors_office' || 
        t.status === 'gso_verified_pending'
      );
      
      const forwarded = allTickets.filter(t => 
        t.status === 'with_mayors_office' ||
        t.status === 'funds_issued' ||
        t.status === 'in_transit' ||
        t.status === 'pending_reconciliation'
      );
      
      setPendingTickets(pending);
      setForwardedTickets(forwarded);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToMO = async (ticketId) => {
    setSubmitting(true);
    try {
      await gsoAPI.forwardToMO([ticketId]);
      
      const forwardedTicket = pendingTickets.find(ticket => 
        (ticket.trip_ticket_id || ticket.id) === ticketId
      );
      
      if (forwardedTicket) {
        const updatedTicket = { 
          ...forwardedTicket, 
          status: 'with_mayors_office',
          forwarded_at: new Date().toISOString()
        };
        setForwardedTickets(prev => [updatedTicket, ...prev]);
        setPendingTickets(prev => prev.filter(ticket => 
          (ticket.trip_ticket_id || ticket.id) !== ticketId
        ));
      }
      
      alert('Ticket forwarded to Mayor\'s Office successfully');
    } catch (error) {
      console.error('Failed to forward ticket:', error);
      alert(error.response?.data?.message || 'Failed to forward ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewGasSlip = (ticket) => {
    const gasSlipData = {
      ...ticket,
      fuel_liters: ticket.estimated_fuel_liters || '_____',
      amount_released: ticket.amount_released || 0,
    };
    setSelectedTicket(gasSlipData);
    setShowGasSlipModal(true);
  };

  const getStatusBadge = (status, isForwarded = false) => {
    if (isForwarded || status === 'with_mayors_office' || status === 'forwarded_to_mo') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Forwarded to MO</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Verified - Ready for MO</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getUniqueDepartments = () => {
    const allTickets = [...pendingTickets, ...forwardedTickets];
    const depts = new Set();
    allTickets.forEach(ticket => {
      const deptName = ticket.department?.department_name || ticket.department_name;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts);
  };

  const filteredByDepartment = (tickets) => {
    if (departmentFilter === 'all') return tickets;
    return tickets.filter(ticket => 
      (ticket.department?.department_name || ticket.department_name) === departmentFilter
    );
  };

  const filteredPending = filteredByDepartment(pendingTickets);
  const filteredForwarded = filteredByDepartment(forwardedTickets);
  const departments = getUniqueDepartments();
  const hasActiveFilters = departmentFilter !== 'all';
  
  const clearFilters = () => {
    setDepartmentFilter('all');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Verified Tickets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and forward verified tickets to Mayor's Office
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchAllTickets}
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
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="flex gap-2">
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
          </div>
        )}
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b dark:border-slate-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium text-sm transition-all duration-200 ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Ready to Forward ({filteredPending.length})
        </button>
        <button
          onClick={() => setActiveTab('forwarded')}
          className={`px-4 py-2 font-medium text-sm transition-all duration-200 ${
            activeTab === 'forwarded'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Forwarded to MO ({filteredForwarded.length})
        </button>
      </div>

      {/* Ready to Forward Tab */}
      {activeTab === 'pending' && (
        <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
          <CardHeader className="border-b dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ready to Forward
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({filteredPending.length} {filteredPending.length === 1 ? 'ticket' : 'tickets'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPending.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No tickets ready to forward</p>
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
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Ticket #</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Destination</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Department</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((ticket, index) => (
                      <TableRow 
                        key={ticket.trip_ticket_id || ticket.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {ticket.trip_ticket_number || ticket.ticket_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">{formatDate(ticket.trip_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">{ticket.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {ticket.department?.department_name || ticket.department_name || 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status, false)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                              title="View Trip Ticket"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGasSlip(ticket)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/30 h-8 w-8 p-0"
                              title="View Gas Slip"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              onClick={() => handleForwardToMO(ticket.trip_ticket_id || ticket.id)}
                              disabled={submitting}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Forward
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
      )}

      {/* Forwarded Tab - View Only */}
      {activeTab === 'forwarded' && (
        <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
          <CardHeader className="border-b dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Printer className="h-5 w-5 text-blue-500" />
              Forwarded to Mayor's Office
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({filteredForwarded.length} {filteredForwarded.length === 1 ? 'ticket' : 'tickets'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredForwarded.length === 0 ? (
              <div className="text-center py-16">
                <Send className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No forwarded tickets found</p>
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
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Ticket #</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Destination</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Department</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForwarded.map((ticket, index) => (
                      <TableRow 
                        key={ticket.trip_ticket_id || ticket.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {ticket.trip_ticket_number || ticket.ticket_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">{formatDate(ticket.trip_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">{ticket.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {ticket.department?.department_name || ticket.department_name || 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status, true)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                              title="View Trip Ticket"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGasSlip(ticket)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/30 h-8 w-8 p-0"
                              title="View Gas Slip"
                            >
                              <Printer className="h-4 w-4" />
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
      )}

      {/* Gas Slip Modal */}
      <GasSlipViewModal
        isOpen={showGasSlipModal}
        onClose={() => setShowGasSlipModal(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default GsoVerified;