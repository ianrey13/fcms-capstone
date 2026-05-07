// src/pages/mayor/MayorPending.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { mayorsOfficeAPI } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  MapPin,
  Truck,
  User,
  XCircle,
  Printer,
  Info,
  AlertCircle,
  Building2,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

// Gas Slip Modal Component
const GasSlipModal = ({ isOpen, onClose, gasSlipData }) => {
  if (!isOpen || !gasSlipData) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gas Slip - ${gasSlipData.control_number}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', 'Georgia', serif;
              background: white;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              padding: 20px;
            }
            .gas-slip-container {
              width: 500px;
              background: white;
              border: 1px solid #333;
            }
            .header-banner {
              background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 50%, #4a7c59 100%);
              padding: 12px 15px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #333;
            }
            .logo-left, .logo-right {
              width: 55px;
              height: 55px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              text-align: center;
              border: 2px solid #ffd700;
            }
            .header-text {
              text-align: center;
              flex: 1;
              color: white;
            }
            .republic { font-size: 9px; letter-spacing: 1px; margin-bottom: 2px; }
            .province { font-size: 10px; font-weight: bold; margin-bottom: 1px; }
            .municipality { font-size: 11px; font-weight: bold; margin-bottom: 1px; }
            .office { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
            .title-box {
              background: #d4c5b5;
              border-bottom: 2px solid #333;
              text-align: center;
              padding: 8px;
            }
            .title-box h1 {
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 3px;
              color: #333;
              margin: 0;
            }
            .form-content { padding: 20px 25px; }
            .form-row { display: flex; align-items: flex-end; margin-bottom: 15px; gap: 10px; }
            .form-row.full { flex-direction: column; align-items: flex-start; }
            .form-label { font-size: 12px; font-weight: bold; color: #333; min-width: 120px; }
            .form-line { flex: 1; border-bottom: 1px solid #333; min-height: 18px; font-size: 12px; padding: 0 5px; text-align: center; font-weight: 600; }
            .form-line.full-width { width: 100%; margin-top: 5px; text-align: left; padding-left: 10px; }
            .two-col { display: flex; gap: 20px; width: 100%; }
            .two-col .col { flex: 1; display: flex; align-items: flex-end; gap: 8px; }
            .fuel-section { margin: 20px 0; }
            .fuel-header { display: flex; text-align: center; margin-bottom: 8px; }
            .fuel-header-col { flex: 1; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .fuel-row { display: flex; align-items: center; margin-bottom: 8px; }
            .fuel-type { flex: 1; font-size: 11px; font-style: italic; }
            .fuel-liters, .fuel-amount { flex: 1; border-bottom: 1px solid #333; text-align: center; font-size: 11px; font-weight: 600; }
            .control-row { display: flex; align-items: center; margin-top: 15px; gap: 10px; }
            .control-number-box { flex: 1; border-bottom: 1px solid #333; text-align: center; font-size: 12px; font-weight: bold; }
            .signature-section { margin-top: 30px; text-align: center; padding: 0 20px; }
            .signature-line { border-top: 1px solid #333; width: 250px; margin: 0 auto 8px auto; padding-top: 8px; }
            .mayor-name { font-size: 13px; font-weight: bold; text-transform: uppercase; }
            .mayor-title { font-size: 11px; font-style: italic; margin-top: 3px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
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
                <div class="fuel-row"><div class="fuel-type">Premium/UNLEADED</div><div class="fuel-liters">${gasSlipData.fuel_type === "Premium" || gasSlipData.fuel_type === "UNLEADED" ? gasSlipData.liters : ""}</div><div class="fuel-amount">${gasSlipData.fuel_type === "Premium" || gasSlipData.fuel_type === "UNLEADED" ? "₱" + gasSlipData.amount.toLocaleString() : ""}</div></div>
                <div class="fuel-row"><div class="fuel-type">Diesel</div><div class="fuel-liters">${gasSlipData.fuel_type === "Diesel" ? gasSlipData.liters : ""}</div><div class="fuel-amount">${gasSlipData.fuel_type === "Diesel" ? "₱" + gasSlipData.amount.toLocaleString() : ""}</div></div>
                <div class="fuel-row"><div class="fuel-type">Engine Oil</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
                <div class="fuel-row"><div class="fuel-type">Brake Fluid</div><div class="fuel-liters">-</div><div class="fuel-amount"></div></div>
              </div>
              <div class="control-row"><span class="form-label">Control No.</span><div class="control-number-box">${gasSlipData.control_number}</div></div>
            </div>
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="mayor-name">${gasSlipData.mayor_name}</div>
              <div class="mayor-title">Municipal Mayor</div>
            </div>
          </div>
          <div class="no-print" style="text-align:center; margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 25px; font-size:14px; cursor:pointer; background:#4a7c59; color:white; border:none; border-radius:4px;">Print Gas Slip</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden">
        <div id="gas-slip-print-content" className="bg-white">
          <div className="bg-gradient-to-r from-[#4a7c59] via-[#6b9b7a] to-[#4a7c59] px-4 py-3 flex items-center justify-between border-b-2 border-gray-800">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-yellow-500 text-[8px] text-center font-bold text-gray-600">
              MUN
              <br />
              LOGO
            </div>
            <div className="text-center flex-1 text-white">
              <div className="text-[9px] tracking-wider mb-0.5">
                REPUBLIC OF THE PHILIPPINES
              </div>
              <div className="text-[10px] font-bold">
                PROVINCE OF MISAMIS ORIENTAL
              </div>
              <div className="text-[11px] font-bold">
                MUNICIPALITY OF LAGUINDINGAN
              </div>
              <div className="text-[10px] font-bold tracking-wider">
                GENERAL SERVICES OFFICE
              </div>
            </div>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-yellow-500 text-[8px] text-center font-bold text-gray-600">
              GSO
              <br />
              LOGO
            </div>
          </div>
          <div className="bg-[#d4c5b5] border-b-2 border-gray-800 text-center py-2">
            <h1 className="text-2xl font-bold tracking-widest text-gray-800">
              GAS SLIP
            </h1>
          </div>
          <div className="px-6 py-5 font-serif">
            <div className="flex items-end mb-4 gap-3">
              <span className="text-sm font-bold text-gray-800 min-w-[120px]">
                Driver
              </span>
              <div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">
                {gasSlipData.driver_name}
              </div>
            </div>
            <div className="flex gap-6 mb-4">
              <div className="flex-1 flex items-end gap-2">
                <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                  Vehicle/Plate #
                </span>
                <div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">
                  {gasSlipData.vehicle_plate}
                </div>
              </div>
              <div className="flex-1 flex items-end gap-2">
                <span className="text-sm font-bold text-gray-800">Date</span>
                <div className="flex-1 border-b border-gray-800 text-sm font-semibold text-center pb-0.5">
                  {gasSlipData.date}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-sm font-bold text-gray-800">Purpose</span>
              <div className="w-full border-b border-gray-800 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">
                {gasSlipData.purpose}
              </div>
            </div>
            <div className="mb-5">
              <span className="text-sm font-bold text-gray-800">
                Destination
              </span>
              <div className="w-full border-b border-gray-800 text-sm font-semibold uppercase mt-1 pb-0.5 pl-2">
                {gasSlipData.destination}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex text-center mb-2">
                <div className="flex-1 text-sm font-bold uppercase tracking-wide">
                  FUEL
                </div>
                <div className="flex-1 text-sm font-bold uppercase tracking-wide">
                  LITERS
                </div>
                <div className="flex-1 text-sm font-bold uppercase tracking-wide">
                  AMOUNT
                </div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic">Premium/UNLEADED</div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5">
                  {gasSlipData.fuel_type === "Premium" ||
                  gasSlipData.fuel_type === "UNLEADED"
                    ? gasSlipData.liters
                    : ""}
                </div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5 text-green-700">
                  {gasSlipData.fuel_type === "Premium" ||
                  gasSlipData.fuel_type === "UNLEADED"
                    ? `₱${gasSlipData.amount.toLocaleString()}`
                    : ""}
                </div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic">Diesel</div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5">
                  {gasSlipData.fuel_type === "Diesel" ? gasSlipData.liters : ""}
                </div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm font-semibold pb-0.5 text-green-700">
                  {gasSlipData.fuel_type === "Diesel"
                    ? `₱${gasSlipData.amount.toLocaleString()}`
                    : ""}
                </div>
              </div>
              <div className="flex items-center mb-2">
                <div className="flex-1 text-sm italic">Engine Oil</div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5">
                  -
                </div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5"></div>
              </div>
              <div className="flex items-center">
                <div className="flex-1 text-sm italic">Brake Fluid</div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5">
                  -
                </div>
                <div className="flex-1 border-b border-gray-800 text-center text-sm pb-0.5"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <span className="text-sm font-bold text-gray-800">
                Control No.
              </span>
              <div className="flex-1 border-b border-gray-800 text-center text-sm font-bold tracking-wider pb-0.5">
                {gasSlipData.control_number}
              </div>
            </div>
          </div>
          <div className="text-center pt-6 pb-8 px-8">
            <div className="border-t border-gray-800 w-64 mx-auto pt-3 mb-2"></div>
            <div className="text-sm font-bold uppercase tracking-wide text-gray-800">
              {gasSlipData.mayor_name}
            </div>
            <div className="text-xs italic text-gray-600 mt-1">
              Municipal Mayor
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t bg-gray-50 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 gap-2 bg-[#4a7c59] hover:bg-[#3d6549]"
          >
            <Printer className="h-4 w-4" />
            Print Gas Slip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MayorPending = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showGasSlipModal, setShowGasSlipModal] = useState(false);
  const [gasSlipData, setGasSlipData] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [amountReleased, setAmountReleased] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Department Selector State
  const [chargeToDepartmentId, setChargeToDepartmentId] = useState("");
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await mayorsOfficeAPI.getPendingTickets();
      const ticketsData = response.data?.data || response.data || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
    toast.success("Tickets refreshed");
  };

  // Fetch all departments for the selector
  const fetchAllDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    try {
      const response = await mayorsOfficeAPI.getAllDepartmentsForSelector();
      const depts = response.data?.data || response.data || [];
      setAvailableDepartments(depts);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      toast.error("Could not load departments list");
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

 // Open approve dialog with department selector (conditional)
const openApproveDialog = async (ticket) => {
  console.log("Opening approve dialog for ticket:", ticket);
  setSelectedTicket(ticket);
  setAmountReleased(ticket.estimated_cost?.toString() || "");

  // ✅ Get the department ID from multiple possible sources
  const requestingDeptId = ticket.department_id?.toString() || 
                           ticket.department?.id?.toString() || 
                           ticket.department?.department_id?.toString();
  
  console.log("Requesting department ID:", requestingDeptId);
  
  // ✅ ALWAYS set the chargeToDepartmentId
  if (!ticket.has_insufficient_budget) {
    // Budget sufficient - force to requesting department
    setChargeToDepartmentId(requestingDeptId || "");
    setAvailableDepartments([]);
    console.log("Budget sufficient, set chargeToDepartmentId to:", requestingDeptId);
  } else {
    // Budget insufficient - allow selection
    setChargeToDepartmentId(requestingDeptId || "");
    await fetchAllDepartments();
    console.log("Budget insufficient, fetching departments, chargeToDepartmentId set to:", requestingDeptId);
  }

  setShowApproveDialog(true);
};

 const handleApprove = async () => {

  if (!selectedTicket) {
    console.log("ERROR: No selectedTicket");
    toast.error("No ticket selected");
    return;
  }

  if (!amountReleased || parseFloat(amountReleased) <= 0) {
    console.log("ERROR: Invalid amount", amountReleased);
    toast.error("Please enter a valid amount to release");
    return;
  }

  // ✅ Get the requesting department ID
  const requestingDeptId = selectedTicket.department_id?.toString() || 
                           selectedTicket.department?.id?.toString();
  
  // ✅ If chargeToDepartmentId is empty, set it to requesting department
  let finalChargeDeptId = chargeToDepartmentId;
  if (!finalChargeDeptId && requestingDeptId) {
    finalChargeDeptId = requestingDeptId;
    setChargeToDepartmentId(finalChargeDeptId);
    console.log("Auto-set chargeToDepartmentId to:", finalChargeDeptId);
  }

  if (!finalChargeDeptId) {
    console.log("ERROR: No chargeToDepartmentId and no requesting department ID");
    toast.error("Please select which department to charge");
    setSubmitting(false);
    return;
  }

  // If budget is sufficient, force charge to requesting department
  if (!selectedTicket.has_insufficient_budget) {
    if (finalChargeDeptId !== requestingDeptId) {
      console.log("ERROR: Cannot change department when budget sufficient");
      toast.error("Your department has sufficient budget. You cannot charge another department.");
      setChargeToDepartmentId(requestingDeptId);
      setSubmitting(false);
      return;
    }
  }

  setSubmitting(true);
  console.log("Calling API with:", {
    ticket_id: selectedTicket.id || selectedTicket.trip_ticket_id,
    amount_released: parseFloat(amountReleased),
    charge_to_department_id: parseInt(finalChargeDeptId),
  });

  try {
    const response = await mayorsOfficeAPI.approveTicket(
      selectedTicket.id || selectedTicket.trip_ticket_id,
      {
        amount_released: parseFloat(amountReleased),
        charge_to_department_id: parseInt(finalChargeDeptId),
      },
    );
    console.log("API Response:", response.data);

    if (response.data.success) {
      toast.success(response.data.message || "Funds released successfully!");
      setShowApproveDialog(false);
      setSelectedTicket(null);
      setAmountReleased("");
      setChargeToDepartmentId("");
      fetchTickets();
    }
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error response:", error.response?.data);
    toast.error(error.response?.data?.message || "Failed to release funds");
  } finally {
    setSubmitting(false);
  }
};

  const handleReject = async () => {
    if (!selectedTicket) return;
    if (!rejectionNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setSubmitting(true);
    try {
      await mayorsOfficeAPI.rejectTicket(
        selectedTicket.id || selectedTicket.trip_ticket_id,
        rejectionNote,
      );
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote("");
      fetchTickets();
      toast.success("Ticket rejected and returned to department");
    } catch (error) {
      console.error("Failed to reject ticket:", error);
      toast.error(error.response?.data?.message || "Failed to reject ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (hasInsufficientBudget) => {
    if (hasInsufficientBudget) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          ⚠️ Insufficient Budget
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500 text-white">Pending Fund Release</Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(numAmount);
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
          <h1 className="text-2xl font-bold">Pending Fund Release</h1>
          <p className="text-gray-500">
            Review and approve trip tickets awaiting fund release
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
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
            <div className="text-center py-8 text-gray-500">
              No pending tickets
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id || ticket.trip_ticket_id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        {ticket.ticket_number || ticket.trip_ticket_number}
                      </TableCell>
                      <TableCell>{formatDate(ticket.trip_date)}</TableCell>
                      <TableCell>{ticket.destination}</TableCell>
                      <TableCell>{ticket.department_name}</TableCell>
                      <TableCell>
                        {ticket.vehicle?.plate_number || "N/A"}
                      </TableCell>
                      <TableCell>{ticket.driver?.full_name || "N/A"}</TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.has_insufficient_budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/mo/tickets/${ticket.id || ticket.trip_ticket_id}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openApproveDialog(ticket)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Release
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
                            <XCircle className="h-4 w-4 mr-1" />
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

      {/* Approve/Fund Release Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Release Funds
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.has_insufficient_budget
                ? "Select which department's budget to charge. The requesting department has insufficient budget."
                : "Your department has sufficient budget. Funds will be deducted from your department."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p>
                    Funds will be deducted from the{" "}
                    <strong>SELECTED department's budget</strong>.
                  </p>
                  <p className="mt-1">
                    The requesting department's budget will NOT be affected.
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Warning */}
            {selectedTicket?.has_insufficient_budget && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Insufficient Budget Notice</p>
                    <p className="text-xs mt-1">
                      Shortage:{" "}
                      <strong>
                        ₱{selectedTicket?.budget_shortage?.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Ticket #</p>
                  <p className="font-semibold text-sm">
                    {selectedTicket?.ticket_number ||
                      selectedTicket?.trip_ticket_number}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Requesting Dept</p>
                  <p className="font-semibold text-sm">
                    {selectedTicket?.department_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Destination</p>
                  <p className="text-sm">{selectedTicket?.destination}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Driver</p>
                  <p className="text-sm">
                    {selectedTicket?.driver?.full_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Department Selector */}
            <div>
              <Label
                htmlFor="charge_to_department"
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Charge To Department <span className="text-red-500">*</span>
              </Label>
              <select
                id="charge_to_department"
                value={
                  chargeToDepartmentId ||
                  selectedTicket?.department_id?.toString() ||
                  ""
                }
                onChange={(e) => setChargeToDepartmentId(e.target.value)}
                className={`w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 ${
                  !selectedTicket?.has_insufficient_budget
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
                disabled={
                  !selectedTicket?.has_insufficient_budget || loadingDepartments
                }
              >
                {loadingDepartments ? (
                  <option>Loading departments...</option>
                ) : (
                  <>
                    <option value={selectedTicket?.department_id}>
                      📍 {selectedTicket?.department_name} (Requesting)
                    </option>
                    {selectedTicket?.has_insufficient_budget &&
                      availableDepartments
                        .filter(
                          (dept) =>
                            dept.department_id !==
                            selectedTicket?.department_id,
                        )
                        .map((dept) => (
                          <option
                            key={dept.department_id}
                            value={dept.department_id}
                          >
                            🏛️ {dept.department_name}
                          </option>
                        ))}
                  </>
                )}
              </select>

              {/* Helper Text - Conditional */}
              {!selectedTicket?.has_insufficient_budget ? (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Your department has sufficient budget. Funds will be deducted
                  from: <strong>{selectedTicket?.department_name}</strong>
                </p>
              ) : (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Your department has insufficient budget. Select which
                  department to charge.
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="amount">Amount to Release (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amountReleased}
                onChange={(e) => setAmountReleased(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Release Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent back to
              the department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm">
                <strong>Ticket:</strong>{" "}
                {selectedTicket?.ticket_number ||
                  selectedTicket?.trip_ticket_number}
                <br />
                <strong>Department:</strong> {selectedTicket?.department_name}
                <br />
                <strong>Destination:</strong> {selectedTicket?.destination}
              </p>
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gas Slip Modal */}
      <GasSlipModal
        isOpen={showGasSlipModal}
        onClose={() => setShowGasSlipModal(false)}
        gasSlipData={gasSlipData}
      />
    </div>
  );
};

export default MayorPending;
