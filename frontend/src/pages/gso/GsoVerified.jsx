// src/pages/gso/GsoVerified.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsoAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Send, RefreshCw, Loader2, Eye, Calendar, MapPin, Printer } from 'lucide-react';
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
      <DialogContent className="max-w-[550px] p-0 overflow-hidden rounded-none">
        <div className="bg-white">
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
          <div className="bg-[#d4c5b5] border-b-2 border-gray-800 text-center py-2"><h1 className="text-2xl font-bold tracking-widest text-gray-800">GAS SLIP</h1></div>
          <div className="px-6 py-5 font-serif">
            <div className="flex items-end mb-4 gap-3"><span className="text-sm font-bold text-gray-800 min-w-[120px]">Driver</span><div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">{ticket.driver?.full_name || ticket.driver_name || 'N/A'}</div></div>
            <div className="flex gap-6 mb-4"><div className="flex-1 flex items-end gap-2"><span className="text-sm font-bold text-gray-800 whitespace-nowrap">Vehicle/Plate #</span><div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">{ticket.vehicle?.plate_number || 'N/A'} - {ticket.vehicle?.vehicle_model || ''}</div></div><div className="flex-1 flex items-end gap-2"><span className="text-sm font-bold text-gray-800">Date</span><div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">{new Date(ticket.trip_date).toLocaleDateString()}</div></div></div>
            <div className="mb-4"><span className="text-sm font-bold text-gray-800">Purpose</span><div className="w-full border-b border-gray-800 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">{ticket.purpose || 'N/A'}</div></div>
            <div className="mb-5"><span className="text-sm font-bold text-gray-800">Destination</span><div className="w-full border-b border-gray-800 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">{ticket.destination || 'N/A'}</div></div>
            <div className="mb-4"><div className="flex text-center mb-2"><div className="flex-1 text-sm font-bold uppercase tracking-wide">FUEL</div><div className="flex-1 text-sm font-bold uppercase tracking-wide">LITERS</div><div className="flex-1 text-sm font-bold uppercase tracking-wide">AMOUNT</div></div>
            <div className="flex items-center mb-2"><div className="flex-1 text-sm italic">Diesel</div><div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5">{ticket.fuel_liters || '_____'}</div><div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5 text-green-700">₱{ticket.amount_released?.toLocaleString() || '0'}</div></div>
            <div className="flex items-center mb-2"><div className="flex-1 text-sm italic">Engine Oil</div><div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5">-</div><div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5"></div></div>
            <div className="flex items-center"><div className="flex-1 text-sm italic">Brake Fluid</div><div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5">-</div><div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5"></div></div></div>
            <div className="flex items-center gap-3 mt-5"><span className="text-sm font-bold text-gray-800">Control No.</span><div className="flex-1 border-b border-gray-800 text-center text-sm font-bold tracking-wider pb-0.5">{ticket.trip_ticket_number || ticket.ticket_number}</div></div>
          </div>
          <div className="text-center pt-6 pb-8 px-8"><div className="border-t border-gray-800 w-64 mx-auto pt-3 mb-2"></div><div className="text-sm font-bold uppercase tracking-wide text-gray-800">HON. AMY. ROY I. MACUA</div><div className="text-xs italic text-gray-600 mt-1">Municipal Mayor</div></div>
        </div>
        <div className="flex gap-3 p-4 border-t bg-gray-50 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1 gap-2 bg-[#2d5a3f] hover:bg-[#1e3d2a]"><Printer className="h-4 w-4" />Print Gas Slip</Button>
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

    useEffect(() => {
        fetchAllTickets();
    }, []);

 // Update fetchAllTickets function
const fetchAllTickets = async () => {
    setLoading(true);
    try {
        // Fetch ALL tickets that have GSO verification (approved)
        const response = await gsoAPI.getVerifiedTickets();
        let allTickets = response.data?.data || response.data || [];
        allTickets = Array.isArray(allTickets) ? allTickets : [];
        
        // Separate by whether they've been forwarded to MO
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
            
            // Find the ticket being forwarded
            const forwardedTicket = pendingTickets.find(ticket => 
                (ticket.trip_ticket_id || ticket.id) === ticketId
            );
            
            if (forwardedTicket) {
                // Add to forwarded list with updated status
                const updatedTicket = { 
                    ...forwardedTicket, 
                    status: 'with_mayors_office',
                    forwarded_at: new Date().toISOString()
                };
                setForwardedTickets(prev => [updatedTicket, ...prev]);
                
                // Remove from pending list
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
            return <Badge className="bg-blue-500 text-white">Forwarded to MO</Badge>;
        }
        return <Badge className="bg-green-500 text-white">Verified - Ready for MO</Badge>;
    };

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
                    <h1 className="text-2xl font-bold">Verified Tickets</h1>
                    <p className="text-gray-500">Manage and forward verified tickets to Mayor's Office</p>
                </div>
                <Button variant="outline" onClick={fetchAllTickets}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'pending'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Ready to Forward ({pendingTickets.length})
                </button>
                <button
                    onClick={() => setActiveTab('forwarded')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeTab === 'forwarded'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Forwarded to MO ({forwardedTickets.length})
                </button>
            </div>

            {/* Ready to Forward Tab */}
            {activeTab === 'pending' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Ready to Forward ({pendingTickets.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingTickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No tickets ready to forward</div>
                        ) : (
                            <div className="overflow-x-auto">
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
                                        {pendingTickets.map((ticket) => (
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
                                                <TableCell>{getStatusBadge(ticket.status, false)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                                                            title="View Trip Ticket"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewGasSlip(ticket)}
                                                            title="View Gas Slip"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                            onClick={() => handleForwardToMO(ticket.trip_ticket_id || ticket.id)}
                                                            disabled={submitting}
                                                        >
                                                            <Send className="h-4 w-4 mr-1" />
                                                            Forward to MO
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

            {/* Forwarded Tab - View Only, No Forward Button */}
            {activeTab === 'forwarded' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Printer className="h-5 w-5 text-blue-500" />
                            Forwarded to Mayor's Office ({forwardedTickets.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {forwardedTickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No forwarded tickets found in database</div>
                        ) : (
                            <div className="overflow-x-auto">
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
                                        {forwardedTickets.map((ticket) => (
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
                                                <TableCell>{getStatusBadge(ticket.status, true)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/gso/tickets/${ticket.trip_ticket_id || ticket.id}`)}
                                                            title="View Trip Ticket"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewGasSlip(ticket)}
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