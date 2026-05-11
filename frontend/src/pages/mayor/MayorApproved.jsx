// src/pages/mayor/MayorApproved.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mayorsOfficeAPI } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import municipalLogo from '../../assets/img/465557735_866766092283213_5502511239926698684_n.svg';
import bagongPilipinasLogo from '../../assets/img/Bagong_Pilipinas_Logo.svg.png';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  DollarSign,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  MapPin,
  Printer,
  Fuel,
  Truck,
  User,
  Building2,
} from "lucide-react";

// Helper function to safely convert amount to number
const safeAmount = (amount) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount) || 0;
  return 0;
};

// Gas Slip Component
const GasSlipView = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const driverName = 
    ticket.driver?.full_name || 
    ticket.driver?.user?.first_name + " " + ticket.driver?.user?.last_name ||
    ticket.driver_name || 
    ticket.driver?.user?.full_name ||
    "N/A";
    

  const fuelType = (ticket.vehicle?.fuel_type || "Diesel").toUpperCase();
  const amount = safeAmount(ticket.amount_released);
  const liters = amount > 0 ? (amount / 58).toFixed(2) : "0.00";


  const gasSlipData = {
    control_number: ticket.ticket_number || ticket.trip_ticket_number || "2025-01-0074",
    driver_name: driverName, 
    vehicle_plate: ticket.vehicle?.plate_number || ticket.vehicle_plate || "N/A",
    vehicle_model: ticket.vehicle?.vehicle_model || "",
    date: new Date(ticket.created_at || ticket.trip_date || Date.now()).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    purpose: (ticket.purpose || "Official Trip").toUpperCase(),
    destination: (ticket.destination || "N/A").toUpperCase(),
    fuel_type: fuelType,
    liters: liters + " L",
    amount: amount,
    mayor_name: "HON. ROY I. MACUA",
    department: ticket.department_name || "N/A",
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gas Slip - ${gasSlipData.control_number}</title>
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
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
              overflow: hidden;
              border: 2px solid #ffd700;
            }
            .logo-left img, .logo-right img { width: 100%; height: 100%; object-fit: contain; }
            .header-text { text-align: center; flex: 1; color: white; }
            .header-text .republic { font-size: 9px; letter-spacing: 1px; margin-bottom: 2px; }
            .header-text .province { font-size: 10px; font-weight: bold; margin-bottom: 1px; }
            .header-text .municipality { font-size: 11px; font-weight: bold; margin-bottom: 1px; }
            .header-text .office { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
            .title-box { background: #d4c5b5; border-bottom: 2px solid #1a1a1a; text-align: center; padding: 8px; }
            .title-box h1 { font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a; margin: 0; }
            .form-content { padding: 20px 25px; }
            .form-row { display: flex; align-items: flex-end; margin-bottom: 15px; gap: 10px; }
            .form-row.full { flex-direction: column; align-items: flex-start; }
            .form-label { font-size: 12px; font-weight: bold; color: #1a1a1a; min-width: 120px; text-transform: capitalize; }
            .form-line { flex: 1; border-bottom: 1px solid #1a1a1a; min-height: 20px; font-size: 12px; padding: 0 5px; text-align: center; font-weight: 600; }
            .form-line.full-width { width: 100%; margin-top: 5px; text-align: left; padding-left: 10px; }
            .two-col { display: flex; gap: 20px; width: 100%; }
            .two-col .col { flex: 1; display: flex; align-items: flex-end; gap: 8px; }
            .fuel-section { margin: 20px 0; }
            .fuel-header { display: flex; text-align: center; margin-bottom: 8px; }
            .fuel-header-col { flex: 1; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .fuel-row { display: flex; align-items: center; margin-bottom: 8px; }
            .fuel-type { flex: 1; font-size: 11px; font-style: italic; }
            .fuel-liters, .fuel-amount { flex: 1; border-bottom: 1px solid #1a1a1a; min-height: 18px; text-align: center; font-size: 11px; font-weight: 600; }
            .control-row { display: flex; align-items: center; margin-top: 15px; gap: 10px; }
            .control-number-box { flex: 1; border-bottom: 1px solid #1a1a1a; text-align: center; font-size: 12px; font-weight: bold; letter-spacing: 1px; padding: 2px 0; }
            .signature-section { margin-top: 30px; text-align: center; padding: 0 20px; }
            .signature-line { border-top: 1px solid #1a1a1a; width: 250px; margin: 0 auto 8px auto; padding-top: 8px; }
            .mayor-name { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
            .mayor-title { font-size: 11px; font-style: italic; margin-top: 3px; }
            @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="gas-slip-container">
            <div class="header-banner">
              <div class="logo-left"><img src="${municipalLogo}" alt="Municipal Logo" /></div>
              <div class="header-text">
                <div class="republic">REPUBLIC OF THE PHILIPPINES</div>
                <div class="province">PROVINCE OF MISAMIS ORIENTAL</div>
                <div class="municipality">MUNICIPALITY OF LAGUINDINGAN</div>
                <div class="office">GENERAL SERVICES OFFICE</div>
              </div>
              <div class="logo-right"><img src="${bagongPilipinasLogo}" alt="Bagong Pilipinas Logo" /></div>
            </div>
            <div class="title-box"><h1>GAS SLIP</h1></div>
            <div class="form-content">
              <div class="form-row"><span class="form-label">Driver</span><div class="form-line">${gasSlipData.driver_name}</div></div>
              <div class="form-row">
                <div class="two-col">
                  <div class="col"><span class="form-label">Vehicle/Plate #</span><div class="form-line">${gasSlipData.vehicle_plate}</div></div>
                  <div class="col"><span class="form-label">Date</span><div class="form-line">${gasSlipData.date}</div></div>
                </div>
              </div>
              <div class="form-row full"><span class="form-label">Purpose</span><div class="form-line full-width">${gasSlipData.purpose}</div></div>
              <div class="form-row full"><span class="form-label">Destination</span><div class="form-line full-width">${gasSlipData.destination}</div></div>
              <div class="fuel-section">
                <div class="fuel-header"><div class="fuel-header-col">FUEL</div><div class="fuel-header-col">LITERS</div><div class="fuel-header-col">AMOUNT</div></div>
                <div class="fuel-row"><div class="fuel-type">Premium/UNLEADED</div><div class="fuel-liters">${gasSlipData.fuel_type === 'PREMIUM' || gasSlipData.fuel_type === 'UNLEADED' ? gasSlipData.liters : ''}</div><div class="fuel-amount">${gasSlipData.fuel_type === 'PREMIUM' || gasSlipData.fuel_type === 'UNLEADED' ? '₱' + gasSlipData.amount.toLocaleString() : ''}</div></div>
                <div class="fuel-row"><div class="fuel-type">Diesel</div><div class="fuel-liters">${gasSlipData.fuel_type === 'DIESEL' ? gasSlipData.liters : ''}</div><div class="fuel-amount">${gasSlipData.fuel_type === 'DIESEL' ? '₱' + gasSlipData.amount.toLocaleString() : ''}</div></div>
                <div class="fuel-row"><div class="fuel-type">Engine Oil</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
                <div class="fuel-row"><div class="fuel-type">Brake Fluid</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
              </div>
              <div class="control-row"><span class="form-label">Control No.</span><div class="control-number-box">${gasSlipData.control_number}</div></div>
            </div>
            <div class="signature-section"><div class="signature-line"></div><div class="mayor-name">${gasSlipData.mayor_name}</div><div class="mayor-title">Municipal Mayor</div></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-[550px] w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2d5a3f] via-[#4a7c59] to-[#2d5a3f] px-4 py-3 flex items-center justify-between border-b-2 border-gray-800">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-500 shadow-md">
              <img src={municipalLogo} alt="Municipal Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div className="text-center flex-1 text-white">
              <div className="text-[9px] tracking-wider mb-0.5">REPUBLIC OF THE PHILIPPINES</div>
              <div className="text-[10px] font-bold">PROVINCE OF MISAMIS ORIENTAL</div>
              <div className="text-[11px] font-bold">MUNICIPALITY OF LAGUINDINGAN</div>
              <div className="text-[10px] font-bold tracking-wider">GENERAL SERVICES OFFICE</div>
            </div>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-500 shadow-md">
              <img src={bagongPilipinasLogo} alt="Bagong Pilipinas Logo" className="w-full h-full object-contain p-1" />
            </div>
          </div>

          {/* Title */}
          <div className="bg-[#d4c5b5] dark:bg-amber-800/50 border-b-2 border-gray-800 text-center py-2">
            <h1 className="text-2xl font-bold tracking-widest text-gray-800 dark:text-white">GAS SLIP</h1>
          </div>

          {/* Content */}
          <div className="px-6 py-5 font-serif dark:text-slate-200">
            <div className="flex items-end mb-4 gap-3">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-300 min-w-[120px]">Driver</span>
              <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-sm font-semibold text-center pb-0.5">
                {gasSlipData.driver_name}
              </div>
            </div>
            <div className="flex gap-6 mb-4">
              <div className="flex-1 flex items-end gap-2">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-300 whitespace-nowrap">Vehicle/Plate #</span>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-sm font-semibold text-center pb-0.5">
                  {gasSlipData.vehicle_plate}
                </div>
              </div>
              <div className="flex-1 flex items-end gap-2">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-300">Date</span>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-sm font-semibold text-center pb-0.5">
                  {gasSlipData.date}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-300">Purpose</span>
              <div className="w-full border-b border-gray-800 dark:border-slate-600 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">
                {gasSlipData.purpose}
              </div>
            </div>
            <div className="mb-5">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-300">Destination</span>
              <div className="w-full border-b border-gray-800 dark:border-slate-600 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">
                {gasSlipData.destination}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex text-center mb-2">
                <div className="flex-1 text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-slate-300">FUEL</div>
                <div className="flex-1 text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-slate-300">LITERS</div>
                <div className="flex-1 text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-slate-300">AMOUNT</div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic text-gray-600 dark:text-slate-400">Premium/UNLEADED</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm font-semibold pb-0.5">
                  {(gasSlipData.fuel_type === 'PREMIUM' || gasSlipData.fuel_type === 'UNLEADED') ? gasSlipData.liters : ''}
                </div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm font-semibold pb-0.5 text-green-700 dark:text-green-400">
                  {(gasSlipData.fuel_type === 'PREMIUM' || gasSlipData.fuel_type === 'UNLEADED') ? `₱${gasSlipData.amount.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic text-gray-600 dark:text-slate-400">Diesel</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm font-semibold pb-0.5">
                  {gasSlipData.fuel_type === 'DIESEL' ? gasSlipData.liters : ''}
                </div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm font-semibold pb-0.5 text-green-700 dark:text-green-400">
                  {gasSlipData.fuel_type === 'DIESEL' ? `₱${gasSlipData.amount.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic text-gray-600 dark:text-slate-400">Engine Oil</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm pb-0.5">-</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm pb-0.5"></div>
              </div>
              <div className="flex items-center">
                <div className="flex-1 text-sm italic text-gray-600 dark:text-slate-400">Brake Fluid</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm pb-0.5">-</div>
                <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm pb-0.5"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-300">Control No.</span>
              <div className="flex-1 border-b border-gray-800 dark:border-slate-600 text-center text-sm font-bold tracking-wider pb-0.5">
                {gasSlipData.control_number}
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="text-center pt-6 pb-8 px-8">
            <div className="border-t border-gray-800 dark:border-slate-600 w-64 mx-auto pt-3 mb-2"></div>
            <div className="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-white">{gasSlipData.mayor_name}</div>
            <div className="text-xs italic text-gray-600 dark:text-slate-400 mt-1">Municipal Mayor</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <Button variant="outline" onClick={onClose} className="flex-1 dark:border-slate-700 dark:text-slate-300">
            Close
          </Button>
          <Button 
            onClick={handlePrint} 
            className="flex-1 gap-2 bg-gradient-to-r from-[#2d5a3f] to-[#1e3d2a] hover:from-[#1e3d2a] hover:to-[#142a1d] text-white shadow-md"
          >
            <Printer className="h-4 w-4" /> Print Gas Slip
          </Button>
        </div>
      </div>
    </div>
  );
};

const MayorApproved = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGasSlip, setShowGasSlip] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await mayorsOfficeAPI.getApprovedTickets();
      const ticketsData = response.data?.data || response.data || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGasSlip = (ticket) => {
    setSelectedTicket(ticket);
    setShowGasSlip(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      funds_issued: { color: "bg-emerald-500", label: "Funds Issued" },
              acknowledged: { color: "bg-blue-500", label: "Acknowledged" },
      in_transit: { color: "bg-blue-500", label: "In Transit" },
      closed: { color: "bg-slate-500", label: "Closed" },
      pending_reconciliation: { color: "bg-amber-500", label: "Pending Reconciliation" },
    };
    const c = config[status] || {
      color: "bg-slate-500",
      label: status?.replace(/_/g, " ") || "Unknown",
    };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ FIXED: Safely convert amount to number
  const safeAmount = (amount) => {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') return parseFloat(amount) || 0;
    return 0;
  };

  const formatCurrency = (amount) => {
    const numAmount = safeAmount(amount);
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  // ✅ FIXED: Calculate total amount with proper number conversion
  const totalAmount = tickets.reduce((sum, ticket) => {
    return sum + safeAmount(ticket.amount_released);
  }, 0);

  const avgAmount = tickets.length > 0 ? totalAmount / tickets.length : 0;
  const inTransitCount = tickets.filter(t => t.status === 'in_transit').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Funds Released
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Trip tickets with released funds
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

      {/* Stats Cards - FIXED */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Released</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tickets.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Amount</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(avgAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">In Transit</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inTransitCount}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Released Tickets
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No funds released tickets</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="font-semibold">Ticket #</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Destination</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Amount Released</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket, index) => (
                    <TableRow 
                      key={ticket.id || ticket.trip_ticket_id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        {ticket.ticket_number || ticket.trip_ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.trip_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {ticket.destination}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {ticket.department_name}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ticket.amount_released)}
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/mo/tickets/${ticket.id || ticket.trip_ticket_id}`)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewGasSlip(ticket)}
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            title="View & Print Gas Slip"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Gas Slip
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

      {/* Gas Slip View */}
      {showGasSlip && selectedTicket && (
        <GasSlipView ticket={selectedTicket} onClose={() => setShowGasSlip(false)} />
      )}
    </div>
  );
};

export default MayorApproved;