import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { tripTicketAPI } from "../../services/api";
import { toast } from "react-hot-toast";
import {
  FileText,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Calendar,
  MapPin,
  Loader2,
  Plus,
  Search,
  Car,
  User,
  DollarSign,
  Edit,
  RotateCcw,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await tripTicketAPI.getMyRequests();
      let ticketsData = response.data?.data || response.data || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load trip tickets");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
    toast.success("Tickets refreshed");
  };

  // Handle edit/resubmit - redirect to create page with ticket data
  const handleEditAndResubmit = (ticket) => {
    // Store ticket data in sessionStorage to pre-fill the form
    sessionStorage.setItem("edit_ticket_data", JSON.stringify({
      id: ticket.id || ticket.trip_ticket_id,
      driver_id: ticket.driver_id,
      vehicle_id: ticket.vehicle_id,
      trip_date: ticket.trip_date,
      destination: ticket.destination,
      purpose: ticket.purpose,
      charge_to: ticket.charge_to,
      passenger_name: ticket.passenger_name,
      estimated_fuel_liters: ticket.estimated_fuel_liters,
      estimated_distance_km: ticket.estimated_distance_km,
      is_resubmit: true,
      original_status: ticket.status,
    }));
    
    // Navigate to create page with edit mode
    navigate("/department/create?mode=edit&id=" + (ticket.id || ticket.trip_ticket_id));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "bg-gray-500", icon: Clock, label: "Draft" },
      pending_head_approval: {
        color: "bg-purple-500",
        icon: Clock,
        label: "Pending Head",
      },
      pending_gso_review: {
        color: "bg-yellow-500",
        icon: Clock,
        label: "Pending GSO",
      },
      returned_for_revision: {
        color: "bg-red-500",
        icon: AlertCircle,
        label: "Returned",
      },
      with_mayors_office: {
        color: "bg-purple-500",
        icon: Clock,
        label: "With Mayor",
      },
      pending_mayors_office: {
        color: "bg-purple-500",
        icon: Clock,
        label: "Pending Mayor",
      },
      funds_issued: {
        color: "bg-green-500",
        icon: CheckCircle,
        label: "Funds Issued",
      },
      acknowledged: {
        color: "bg-blue-500",
        icon: CheckCircle,
        label: "Acknowledged",
      },
      in_transit: { color: "bg-indigo-500", icon: Truck, label: "In Transit" },
      pending_reconciliation: {
        color: "bg-orange-500",
        icon: Clock,
        label: "Reconciling",
      },
      closed: { color: "bg-emerald-600", icon: CheckCircle, label: "Closed" },
      cancelled: { color: "bg-red-700", icon: XCircle, label: "Cancelled" },
      rejected: { color: "bg-red-600", icon: XCircle, label: "Rejected" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-500",
      icon: Clock,
      label: status.replace(/_/g, " "),
    };
    const Icon = config.icon;

    return (
      <Badge
        className={`${config.color} text-white flex items-center gap-1 w-fit px-2 py-1`}
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
    );
  };

  // Check if ticket can be edited/resubmitted (returned/rejected/draft statuses)
  const canEdit = (status) => {
    return ["returned_for_revision", "rejected", "draft"].includes(status);
  };

  // Status categories
  const pendingStatuses = [
    "pending_head_approval",
    "pending_gso_review",
    "pending_mayors_office",
    "with_mayors_office",
    "pending_reconciliation",
  ];

  const approvedStatuses = ["funds_issued", "acknowledged"];
  const inTransitStatuses = ["in_transit"];
  const completedStatuses = ["closed"];
  const draftStatuses = ["draft"];
  const returnedStatuses = ["returned_for_revision", "rejected", "cancelled"];

  const filteredTickets = tickets.filter((ticket) => {
    // Filter by tab
    if (activeTab === "pending") {
      if (!pendingStatuses.includes(ticket.status)) return false;
    } else if (activeTab === "drafts") {
      if (!draftStatuses.includes(ticket.status)) return false;
    } else if (activeTab === "approved") {
      if (!approvedStatuses.includes(ticket.status)) return false;
    } else if (activeTab === "in_transit") {
      if (!inTransitStatuses.includes(ticket.status)) return false;
    } else if (activeTab === "completed") {
      if (!completedStatuses.includes(ticket.status)) return false;
    } else if (activeTab === "returned") {
      if (!returnedStatuses.includes(ticket.status)) return false;
    }

    // Filter by search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (ticket.trip_ticket_number &&
          ticket.trip_ticket_number.toLowerCase().includes(searchLower)) ||
        (ticket.destination &&
          ticket.destination.toLowerCase().includes(searchLower)) ||
        (ticket.vehicle?.plate_number &&
          ticket.vehicle.plate_number.toLowerCase().includes(searchLower)) ||
        (ticket.driver?.user?.full_name &&
          ticket.driver.user.full_name.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const getStats = () => {
    return {
      total: tickets.length,
      pending: tickets.filter((t) => pendingStatuses.includes(t.status)).length,
      drafts: tickets.filter((t) => draftStatuses.includes(t.status)).length,
      approved: tickets.filter((t) => approvedStatuses.includes(t.status))
        .length,
      inTransit: tickets.filter((t) => inTransitStatuses.includes(t.status))
        .length,
      completed: tickets.filter((t) => completedStatuses.includes(t.status))
        .length,
      returned: tickets.filter((t) => returnedStatuses.includes(t.status))
        .length,
    };
  };

  const stats = getStats();

  const formatCurrency = (amount) => {
    if (!amount) return "₱0.00";
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your trip tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                  {user?.department_name || "Department"}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  Trip Requests
                </Badge>
              </div>
              <h1 className="text-3xl font-bold">My Trip Tickets</h1>
              <p className="text-slate-300 mt-1">
                View and manage all your trip ticket requests
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={() => navigate("/department/create")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trip Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </span>
              </div>
              <p className="text-xs text-gray-500">Total</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </span>
              </div>
              <p className="text-xs text-gray-500">Pending</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold text-gray-500">
                  {stats.drafts}
                </span>
              </div>
              <p className="text-xs text-gray-500">Drafts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </span>
              </div>
              <p className="text-xs text-gray-500">Approved</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Truck className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold text-indigo-600">
                  {stats.inTransit}
                </span>
              </div>
              <p className="text-xs text-gray-500">In Transit</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-600">
                  {stats.completed}
                </span>
              </div>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {stats.returned}
                </span>
              </div>
              <p className="text-xs text-gray-500">Returned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Trip Tickets
                <Badge variant="secondary" className="ml-2">
                  {filteredTickets.length} of {tickets.length}
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 bg-gray-100 p-1 flex flex-wrap">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white"
                >
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-white"
                >
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger
                  value="drafts"
                  className="data-[state=active]:bg-white"
                >
                  Drafts ({stats.drafts})
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-white"
                >
                  Approved ({stats.approved})
                </TabsTrigger>
                <TabsTrigger
                  value="in_transit"
                  className="data-[state=active]:bg-white"
                >
                  In Transit ({stats.inTransit})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-white"
                >
                  Completed ({stats.completed})
                </TabsTrigger>
                <TabsTrigger
                  value="returned"
                  className="data-[state=active]:bg-white"
                >
                  Returned ({stats.returned})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      No trip tickets found
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm
                        ? "Try a different search term"
                        : "Create your first trip ticket to get started"}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => navigate("/department/create")}
                        className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Trip Ticket
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Ticket #
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Date
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Destination
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Vehicle
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Driver
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Amount
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase">
                            Status
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-gray-500 uppercase text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.map((ticket) => (
                          <TableRow
                            key={ticket.trip_ticket_id || ticket.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-mono font-medium text-gray-800">
                              {ticket.trip_ticket_number || "Draft"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {new Date(
                                    ticket.trip_date,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-sm truncate max-w-[150px]">
                                  {ticket.destination}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Car className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {ticket.vehicle?.plate_number || "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">
                                  {ticket.driver?.user?.full_name ||
                                    ticket.driver?.full_name ||
                                    "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(
                                  ticket.amount_released ||
                                    ticket.funds_released ||
                                    ticket.released_amount ||
                                    ticket.estimated_fuel_cost ||
                                    ticket.estimated_cost ||
                                    0,
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(ticket.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/department/requests/${ticket.trip_ticket_id || ticket.id}`,
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canEdit(ticket.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditAndResubmit(ticket)}
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    title="Edit & Resubmit"
                                  >
                                    <Edit className="h-4 w-4" />
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyRequests;