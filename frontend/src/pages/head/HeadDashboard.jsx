import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { headOfficeAPI } from "../../services/api";
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  Calendar,
  MapPin,
  Fuel,
  TrendingUp,
  Activity,
  Power,
  PowerOff,
  FileText,
  Users,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Search,
  User,
  Building2,
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

const HeadDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [fuelConsumption, setFuelConsumption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [oicStatus, setOicStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter pending tickets when search or filter changes
  useEffect(() => {
    let filtered = [...pendingTickets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          (ticket.trip_ticket_number || ticket.ticket_number || "")
            .toLowerCase()
            .includes(query) ||
          (ticket.destination || "").toLowerCase().includes(query) ||
          (ticket.vehicle?.plate_number || "").toLowerCase().includes(query) ||
          (ticket.driver?.full_name || "").toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [searchQuery, statusFilter, pendingTickets]);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      toast.loading("Refreshing dashboard...", { id: "refresh" });
    } else {
      setLoading(true);
    }

    try {
      await Promise.all([
        fetchDashboard(),
        fetchPendingTickets(),
        fetchActiveTrips(),
        fetchFuelConsumption(),
        fetchOICStatus(),
      ]);

      if (isRefresh) {
        toast.success("Dashboard refreshed successfully", { id: "refresh" });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (isRefresh) {
        toast.error("Failed to refresh dashboard", { id: "refresh" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await headOfficeAPI.getDashboard();
      const dashboardData = response.data?.data || response.data;
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  const fetchPendingTickets = async () => {
    try {
      const response = await headOfficeAPI.getPendingTickets();
      const ticketsData =
        response.data?.data?.tickets ||
        response.data?.tickets ||
        response.data?.data ||
        [];
      const tickets = Array.isArray(ticketsData) ? ticketsData : [];
      setPendingTickets(tickets);
      setFilteredTickets(tickets);
    } catch (error) {
      console.error("Failed to fetch pending tickets:", error);
    }
  };

  const fetchActiveTrips = async () => {
    try {
      const response = await headOfficeAPI.getActiveTrips();
      const tripsData = response.data?.data || response.data || [];
      setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
    } catch (error) {
      console.error("Failed to fetch active trips:", error);
    }
  };

  const fetchFuelConsumption = async () => {
    try {
      const response = await headOfficeAPI.getFuelConsumption();
      const fuelData = response.data?.data || response.data;
      setFuelConsumption(fuelData);
    } catch (error) {
      console.error("Failed to fetch fuel consumption:", error);
    }
  };

  const fetchOICStatus = async () => {
    try {
      const response = await headOfficeAPI.getOICStatus();
      const oicData = response.data?.data || response.data;
      setOicStatus(oicData);
    } catch (error) {
      console.error("Failed to fetch OIC status:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      await headOfficeAPI.approveTicket(
        selectedTicket.trip_ticket_id || selectedTicket.id,
        null,
      );
      setShowApproveDialog(false);
      setSelectedTicket(null);
      toast.success("Trip ticket approved successfully");
      fetchAllData(true);
    } catch (error) {
      console.error("Failed to approve ticket:", error);
      toast.error(error.response?.data?.message || "Failed to approve ticket");
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
      await headOfficeAPI.rejectTicket(
        selectedTicket.trip_ticket_id || selectedTicket.id,
        rejectionNote,
      );
      setShowRejectDialog(false);
      setSelectedTicket(null);
      setRejectionNote("");
      toast.success("Trip ticket rejected");
      fetchAllData(true);
    } catch (error) {
      console.error("Failed to reject ticket:", error);
      toast.error(error.response?.data?.message || "Failed to reject ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHeadStatus = async () => {
    const newStatus =
      dashboard?.head_status === "active" ? "inactive" : "active";
    setTogglingStatus(true);
    try {
      await headOfficeAPI.toggleHeadStatus({
        status: newStatus,
        reason: newStatus === "inactive" ? "Temporarily unavailable" : null,
      });
      toast.success(`Status changed to ${newStatus}`);
      fetchDashboard();
      fetchOICStatus();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      // Department statuses
      draft: { color: "bg-gray-500", label: "Draft", icon: FileText },
      pending_head_approval: {
        color: "bg-yellow-500",
        label: "Pending Approval",
        icon: Clock,
      },
      pending_gso_review: {
        color: "bg-blue-500",
        label: "GSO Review",
        icon: AlertCircle,
      },
      returned_for_revision: {
        color: "bg-red-500",
        label: "Returned",
        icon: AlertCircle,
      },

      // GSO statuses
      pending_mayors_office: {
        color: "bg-purple-500",
        label: "With Mayor",
        icon: Building2,
      },
      with_mayors_office: {
        color: "bg-purple-500",
        label: "With Mayor",
        icon: Building2,
      },

      // Mayor statuses
      funds_issued: {
        color: "bg-green-500",
        label: "Funds Issued",
        icon: DollarSign,
      },
      acknowledged: {
        color: "bg-cyan-500",
        label: "Acknowledged",
        icon: CheckCircle,
      },
      in_transit: { color: "bg-indigo-500", label: "In Transit", icon: Truck },
      pending_reconciliation: {
        color: "bg-orange-500",
        label: "Reconciling",
        icon: Clock,
      },

      // Final statuses
      closed: {
        color: "bg-emerald-600",
        label: "Completed",
        icon: CheckCircle,
      },
      completed: {
        color: "bg-emerald-600",
        label: "Completed",
        icon: CheckCircle,
      },
      cancelled: { color: "bg-red-700", label: "Cancelled", icon: XCircle },
      rejected: { color: "bg-red-600", label: "Rejected", icon: XCircle },
    };

    const c = config[status] || {
      color: "bg-gray-500",
      label: status ? status.replace(/_/g, " ") : "Pending",
      icon: AlertCircle,
    };

    const IconComponent = c.icon;
    return (
      <Badge
        className={`${c.color} text-white flex items-center gap-1 px-2 py-1`}
      >
        <IconComponent className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const getBudgetUtilizationColor = (percentage) => {
    if (percentage >= 80) return "text-red-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                {dashboard?.head_status === "active" ? "Active" : "Inactive"}
              </Badge>
              {oicStatus?.has_oic && dashboard?.head_status === "inactive" && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <UserCheck className="h-3 w-3 mr-1" />
                  OIC: {oicStatus.oic?.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">Head of Office Dashboard</h1>
            <p className="text-slate-300 mt-1">
              {dashboard?.department?.name ||
                user?.department_name ||
                "Department"}
              {dashboard?.department?.code && ` (${dashboard.department.code})`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant={
                dashboard?.head_status === "active" ? "outline" : "default"
              }
              onClick={toggleHeadStatus}
              disabled={togglingStatus}
              className={`flex items-center gap-2 transition-all ${
                dashboard?.head_status === "inactive"
                  ? "bg-green-600 hover:bg-green-700 text-white border-0"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20"
              }`}
            >
              {togglingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dashboard?.head_status === "active" ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Set Inactive
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Set Active
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate("/head/create-trip")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Trip Ticket
            </Button>

            <Button
              variant="outline"
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card
          className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
          onClick={() =>
            document.querySelector('[data-value="pending"]')?.click()
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Pending Approval
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {dashboard?.stats?.pending_approval ||
                    pendingTickets.length ||
                    0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Awaiting your action
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {dashboard?.stats?.approved || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">In Transit</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {dashboard?.stats?.in_transit || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Active trips</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Department Budget
                </p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  ₱{dashboard?.department_budget?.toLocaleString() || "0"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Current allocation</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="pending"
            data-value="pending"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Truck className="h-4 w-4 mr-2" />
            Active ({activeTrips.length})
          </TabsTrigger>
          <TabsTrigger
            value="fuel"
            className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Overview
          </TabsTrigger>
        </TabsList>

        {/* Pending Approval Tab */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Trip Tickets Awaiting Approval
                  </CardTitle>
                  <CardDescription>
                    Review and approve/reject department trip requests
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_head_approval">
                      Pending Approval
                    </option>
                    <option value="pending_gso_review">GSO Review</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No pending tickets
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    All tickets have been reviewed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.trip_ticket_id || ticket.id}
                      className="border rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:bg-gray-50/50"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="font-mono text-sm font-bold bg-gray-100 px-2 py-1 rounded">
                              #
                              {ticket.trip_ticket_number ||
                                ticket.ticket_number}
                            </span>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                {new Date(
                                  ticket.trip_date,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="truncate">
                                {ticket.destination}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Truck className="h-4 w-4 text-gray-400" />
                              <span>
                                {ticket.vehicle?.plate_number} -{" "}
                                {ticket.vehicle?.vehicle_model}
                              </span>
                            </div>
                            {/* ✅ ADDED DRIVER DISPLAY */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>
                                Driver:{" "}
                                {ticket.driver?.full_name ||
                                  ticket.driver_name ||
                                  "Not Assigned"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                Requester:{" "}
                                {ticket.submitted_by_user?.full_name ||
                                  ticket.requester?.full_name ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Fuel className="h-4 w-4 text-gray-400" />
                              <span>
                                Est. Fuel:{" "}
                                {ticket.estimated_fuel_liters || "N/A"} L
                              </span>
                            </div>
                            {ticket.purpose && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                  {ticket.purpose}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 shadow-sm"
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
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowRejectDialog(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Trips Tab */}
        <TabsContent value="active" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Currently Active Trips
              </CardTitle>
              <CardDescription>
                Real-time monitoring of ongoing trips
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTrips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No active trips</p>
                  <p className="text-sm text-gray-400 mt-1">
                    All trips are completed or none in progress
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTrips.map((trip) => (
                    <div
                      key={trip.trip_ticket_id || trip.id}
                      className="border rounded-xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          #{trip.trip_ticket_number || trip.ticket_number}
                        </span>
                        {getStatusBadge(trip.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            {trip.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            {trip.vehicle?.plate_number} -{" "}
                            {trip.vehicle?.vehicle_model}
                          </span>
                        </div>
                        {/* ✅ ADDED DRIVER DISPLAY FOR ACTIVE TRIPS */}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            Driver:{" "}
                            {trip.driver?.full_name ||
                              trip.driver_name ||
                              "Not Assigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Fuel className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            Fuel Used:{" "}
                            {trip.fuel_used ||
                              trip.estimated_fuel_liters ||
                              "N/A"}{" "}
                            L
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">
                            Started:{" "}
                            {trip.started_at
                              ? new Date(trip.started_at).toLocaleTimeString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/head/trips/${trip.trip_ticket_id || trip.id}/track`,
                          )
                        }
                        className="w-full mt-4 flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Track Live Location
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fuel Consumption Tab */}
        <TabsContent value="fuel" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Fuel Consumption Overview
              </CardTitle>
              <CardDescription>
                Monthly and yearly fuel usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fuelConsumption &&
              (fuelConsumption.monthly_total > 0 ||
                fuelConsumption.yearly_total > 0) ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">
                          Monthly Fuel Usage
                        </span>
                        <Fuel className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {fuelConsumption.monthly_total || 0} L
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ≈ ₱
                        {(fuelConsumption.monthly_cost || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">
                          Yearly Fuel Usage
                        </span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {fuelConsumption.yearly_total || 0} L
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ≈ ₱{(fuelConsumption.yearly_cost || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">
                          Average per Trip
                        </span>
                        <Truck className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {fuelConsumption.average_per_trip || 0} L
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Per trip average consumption
                      </p>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">
                          Budget Utilization
                        </span>
                        <DollarSign className="h-5 w-5 text-indigo-500" />
                      </div>
                      <p
                        className={`text-3xl font-bold ${getBudgetUtilizationColor(fuelConsumption.budget_utilization || 0)}`}
                      >
                        {fuelConsumption.budget_utilization || 0}%
                      </p>
                      <Progress
                        value={fuelConsumption.budget_utilization || 0}
                        className="mt-3 h-2"
                        indicatorClassName={
                          fuelConsumption.budget_utilization >= 80
                            ? "bg-red-500"
                            : fuelConsumption.budget_utilization >= 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {fuelConsumption.budget_utilization >= 80
                          ? "⚠️ High utilization - consider budget review"
                          : "Within normal range"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Fuel className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    No fuel consumption data available
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Data will appear once trips are completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this trip ticket? It will be
              forwarded to GSO for further review.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">
              Ticket Details
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Number:</span>{" "}
                <span className="font-mono">
                  {selectedTicket?.trip_ticket_number ||
                    selectedTicket?.ticket_number}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Destination:</span>{" "}
                {selectedTicket?.destination}
              </p>
              <p>
                <span className="text-gray-600">Driver:</span>{" "}
                {selectedTicket?.driver?.full_name ||
                  selectedTicket?.driver_name ||
                  "Not Assigned"}
              </p>
              <p>
                <span className="text-gray-600">Requester:</span>{" "}
                {selectedTicket?.submitted_by_user?.full_name ||
                  selectedTicket?.requester?.full_name}
              </p>
              <p>
                <span className="text-gray-600">Trip Date:</span>{" "}
                {selectedTicket?.trip_date &&
                  new Date(selectedTicket.trip_date).toLocaleDateString()}
              </p>
              <p>
                <span className="text-gray-600">Est. Fuel:</span>{" "}
                {selectedTicket?.estimated_fuel_liters || "N/A"} L
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end">
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
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Trip Ticket
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent back to
              the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">
              Ticket Details
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Number:</span>{" "}
                <span className="font-mono">
                  {selectedTicket?.trip_ticket_number ||
                    selectedTicket?.ticket_number}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Destination:</span>{" "}
                {selectedTicket?.destination}
              </p>
              <p>
                <span className="text-gray-600">Driver:</span>{" "}
                {selectedTicket?.driver?.full_name ||
                  selectedTicket?.driver_name ||
                  "Not Assigned"}
              </p>
              <p>
                <span className="text-gray-600">Requester:</span>{" "}
                {selectedTicket?.submitted_by_user?.full_name ||
                  selectedTicket?.requester?.full_name}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rejection-note">Rejection Reason</Label>
            <Textarea
              id="rejection-note"
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This reason will be visible to the requester
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end">
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
                <X className="h-4 w-4 mr-2" />
              )}
              Reject Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeadDashboard;
