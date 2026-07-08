// src/pages/mayor/MayorReceiptVerification.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mayorsOfficeAPI } from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Receipt,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  Image as ImageIcon,
  Calendar,
  User,
  Truck,
  Fuel,
  DollarSign,
  MapPin,
  XCircle,
  AlertCircle,
  Clock,
  Building2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const MayorReceiptVerification = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch receipts for verification
  const { data: receipts = [], isLoading, refetch } = useQuery({
    queryKey: ["mayor-receipt-verification"],
    queryFn: async () => {
      const response = await mayorsOfficeAPI.getReceiptsForVerification();
      return response.data?.data || [];
    },
  });

  // Verify receipt mutation
  const verifyMutation = useMutation({
    mutationFn: async (receiptId) => {
      const response = await mayorsOfficeAPI.verifyReceipt(receiptId);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Receipt verified successfully!");
      queryClient.invalidateQueries({ queryKey: ["mayor-receipt-verification"] });
      setShowReceiptModal(false);
      setSelectedReceipt(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to verify receipt");
    },
  });

  const handleRefresh = () => {
    refetch();
    toast.success("Receipts refreshed");
  };

  const openReceiptModal = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
  };

  const handleVerify = (receiptId) => {
    verifyMutation.mutate(receiptId);
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const search = searchTerm.toLowerCase();
    return (
      receipt.ticket_number?.toLowerCase().includes(search) ||
      receipt.driver_name?.toLowerCase().includes(search) ||
      receipt.plate_number?.toLowerCase().includes(search) ||
      receipt.department_name?.toLowerCase().includes(search)
    );
  });

  const pendingCount = receipts.filter(r => r.status !== "verified").length;
  const verifiedCount = receipts.filter(r => r.status === "verified").length;

  const getStatusBadge = (status) => {
    if (status === "verified") {
      return <Badge className="bg-green-500 text-white">Verified</Badge>;
    }
    if (status === "discrepancy") {
      return <Badge className="bg-red-500 text-white">Discrepancy</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM dd, yyyy hh:mm a");
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

  if (isLoading) {
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
            Receipt Verification
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Verify driver uploaded fuel receipts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Receipts</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{receipts.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verified</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{verifiedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by ticket number, driver, plate, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        />
      </div>

      {/* Receipts Table */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
        <CardHeader className="border-b dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Receipt className="h-5 w-5 text-green-500" />
            Fuel Receipts for Verification
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({filteredReceipts.length} {filteredReceipts.length === 1 ? 'receipt' : 'receipts'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No receipts found</p>
              {searchTerm && (
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt, index) => (
                    <TableRow 
                      key={receipt.id || receipt.fuel_log_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-mono font-semibold text-slate-900 dark:text-white">
                        {receipt.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{receipt.driver_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{receipt.plate_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{receipt.department_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {receipt.liters} L
                      </TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReceiptModal(receipt)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {receipt.status !== "verified" && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(receipt.id || receipt.fuel_log_id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={verifyMutation.isPending}
                            >
                              {verifyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              Verify
                            </Button>
                          )}
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

      {/* Receipt Detail Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Receipt className="h-5 w-5 text-green-600" />
              Fuel Receipt Details
            </DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              {/* Receipt Image */}
              {selectedReceipt.receipt_url ? (
                <div className="border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                  <img
                    src={selectedReceipt.receipt_url}
                    alt="Fuel Receipt"
                    className="w-full max-h-64 object-contain"
                    onError={(e) => {
                      e.target.src = "/placeholder-receipt.png";
                      e.target.alt = "Receipt image not available";
                    }}
                  />
                </div>
              ) : (
                <div className="border rounded-xl p-8 text-center bg-slate-50 dark:bg-slate-900/50">
                  <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No receipt image uploaded</p>
                </div>
              )}

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ticket Number</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.ticket_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Driver</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.driver_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.plate_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.department_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Trip Date</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedReceipt.trip_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded At</p>
                  <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedReceipt.uploaded_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fuel Type</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.fuel_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Liters</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.liters} L</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Amount</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(selectedReceipt.amount)}</p>
                </div>
              </div>

              {/* Distance Details */}
              {(selectedReceipt.odometer_start || selectedReceipt.odometer_end || selectedReceipt.gps_distance_km) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Distance Details</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Method</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedReceipt.distance_calculation_method || "N/A"}
                      </p>
                    </div>
                    {selectedReceipt.odometer_start && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Odometer Start</p>
                        <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.odometer_start} km</p>
                      </div>
                    )}
                    {selectedReceipt.odometer_end && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Odometer End</p>
                        <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.odometer_end} km</p>
                      </div>
                    )}
                    {selectedReceipt.gps_distance_km && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">GPS Distance</p>
                        <p className="font-medium text-slate-900 dark:text-white">{selectedReceipt.gps_distance_km} km</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status & Actions */}
              <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status:</p>
                  {getStatusBadge(selectedReceipt.status)}
                </div>
                {selectedReceipt.status !== "verified" && (
                  <Button
                    onClick={() => handleVerify(selectedReceipt.id || selectedReceipt.fuel_log_id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Receipt
                      </>
                    )}
                  </Button>
                )}
                {selectedReceipt.status === "verified" && (
                  <Button variant="outline" disabled className="dark:border-slate-700 dark:text-slate-400">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Already Verified
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MayorReceiptVerification;