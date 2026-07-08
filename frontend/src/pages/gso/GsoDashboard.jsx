// src/pages/gso/GsoDashboard.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gsoAPI, userAPI, vehicleAPI, departmentAPI } from '../../services/api';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Truck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Check,
  X,
  Search,
  Building2,
  FileCheck,
  PlusCircle,
  Users,
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Fuel,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';

// ============================================
// CONSTANTS & HELPERS
// ============================================

// Status configuration for workflow
const getStatusConfig = (status) => {
  const configs = {
    'pending_mayors_office': {
      color: 'bg-yellow-500',
      label: 'Pending MO',
      icon: Clock,
    },
    'funds_issued': {
      color: 'bg-blue-500',
      label: 'Funds Issued',
      icon: DollarSign,
    },
    'acknowledged': {
      color: 'bg-cyan-500',
      label: 'Acknowledged',
      icon: CheckCircle,
    },
    'in_transit': {
      color: 'bg-indigo-500',
      label: 'In Transit',
      icon: Truck,
    },
    'pending_reconciliation': {
      color: 'bg-orange-500',
      label: 'Pending Reconciliation',
      icon: FileCheck,
    },
    'closed': {
      color: 'bg-green-600',
      label: 'Closed',
      icon: CheckCircle,
    },
    'rejected': {
      color: 'bg-red-500',
      label: 'Rejected',
      icon: XCircle,
    },
    'cancelled': {
      color: 'bg-slate-500',
      label: 'Cancelled',
      icon: XCircle,
    },
    'returned_for_revision': {
      color: 'bg-purple-500',
      label: 'Returned',
      icon: AlertCircle,
    },
    'draft': {
      color: 'bg-slate-400',
      label: 'Draft',
      icon: AlertCircle,
    },
  };
  return configs[status] || { color: 'bg-slate-500', label: status || 'Unknown', icon: Clock };
};

const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return 'N/A';
  }
};

const getTicketId = (ticket) => {
  return ticket?.trip_ticket_id || ticket?.id || ticket?.ticket_id;
};

const getTicketNumber = (ticket) => {
  return ticket?.trip_ticket_number || ticket?.ticket_number || 'N/A';
};

// ============================================
// COMPONENT
// ============================================

const GsoDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const departmentName = user?.department_name?.replace('Philippine National Police - ', '').replace('PNP - ', '') || 'General Services Office';

  // ============================================
  // QUERIES
  // ============================================

  // Trip Queries
  const { data: pendingTickets = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['gso-pending-mo'],
    queryFn: async () => {
      try {
        const response = await gsoAPI.getPendingMO();
        // ✅ Handle different response structures
        const data = response?.data?.data || response?.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching pending tickets:', error);
        return [];
      }
    },
  });

  const { data: returnedTickets = [], isLoading: returnedLoading, refetch: refetchReturned } = useQuery({
    queryKey: ['gso-returned'],
    queryFn: async () => {
      try {
        const response = await gsoAPI.getReturnedTickets();
        const data = response?.data?.data || response?.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching returned tickets:', error);
        return [];
      }
    },
  });

  const { data: reconciliationTickets = [], isLoading: reconciliationLoading, refetch: refetchReconciliation } = useQuery({
    queryKey: ['gso-reconciliation'],
    queryFn: async () => {
      try {
        const response = await gsoAPI.getPendingReconciliation();
        const data = response?.data?.data || response?.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching reconciliation tickets:', error);
        return [];
      }
    },
  });

  const { data: allTrips = [], isLoading: allTripsLoading, refetch: refetchAllTrips } = useQuery({
    queryKey: ['gso-all-trips'],
    queryFn: async () => {
      try {
        const response = await gsoAPI.getAllTrips();
        const data = response?.data?.data || response?.data || [];
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching all trips:', error);
        return [];
      }
    },
  });

  // Admin Stats Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      try {
        const response = await userAPI.getAll();
        return response?.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['admin-vehicles-stats'],
    queryFn: async () => {
      try {
        const response = await vehicleAPI.getAll();
        return response?.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['admin-departments-stats'],
    queryFn: async () => {
      try {
        const response = await departmentAPI.getAll();
        return response?.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const reconcileMutation = useMutation({
    mutationFn: async ({ ticketId, data }) => {
      const response = await gsoAPI.reconcileTrip(ticketId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Trip reconciled successfully!');
      queryClient.invalidateQueries({ queryKey: ['gso-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['gso-all-trips'] });
      setShowReconcileDialog(false);
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to reconcile trip');
    },
  });

  // ============================================
  // COMPUTED STATS
  // ============================================

  const stats = useMemo(() => {
    const totalUsers = Array.isArray(users) ? users.length : 0;
    const activeUsers = Array.isArray(users) ? users.filter(u => u?.status === 'active').length : 0;
    const totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;
    const activeVehicles = Array.isArray(vehicles) ? vehicles.filter(v => v?.status === 'active').length : 0;
    const totalDepartments = Array.isArray(departments) ? departments.length : 0;

    return [
      {
        title: 'Total Trips',
        value: allTrips.length,
        icon: Truck,
        gradient: 'from-blue-500 to-blue-600',
        subtitle: 'All time',
        onClick: () => setActiveTab('all'),
      },
      {
        title: 'Pending MO',
        value: pendingTickets.length,
        icon: Clock,
        gradient: 'from-yellow-500 to-yellow-600',
        subtitle: 'Awaiting fund release',
        onClick: () => setActiveTab('pending'),
      },
      {
        title: 'Users',
        value: activeUsers,
        icon: Users,
        gradient: 'from-purple-500 to-purple-600',
        subtitle: `${totalUsers} total users`,
        onClick: () => navigate('/admin/users'),
      },
      {
        title: 'Vehicles',
        value: activeVehicles,
        icon: Car,
        gradient: 'from-emerald-500 to-emerald-600',
        subtitle: `${totalVehicles} total vehicles`,
        onClick: () => navigate('/admin/vehicles'),
      },
      {
        title: 'Departments',
        value: totalDepartments,
        icon: Building2,
        gradient: 'from-cyan-500 to-cyan-600',
        subtitle: 'Active departments',
        onClick: () => navigate('/admin/departments'),
      },
    ];
  }, [allTrips, pendingTickets, users, vehicles, departments, navigate]);

  // ============================================
  // FILTER FUNCTIONS
  // ============================================

  const filterTickets = (tickets) => {
    if (!searchQuery || !Array.isArray(tickets)) return tickets || [];
    const query = searchQuery.toLowerCase();
    return tickets.filter(ticket =>
      (getTicketNumber(ticket) || '').toLowerCase().includes(query) ||
      (ticket?.destination || '').toLowerCase().includes(query) ||
      (ticket?.department_name || '').toLowerCase().includes(query) ||
      (ticket?.vehicle?.plate_number || '').toLowerCase().includes(query)
    );
  };

  const filteredPending = useMemo(() => filterTickets(pendingTickets), [pendingTickets, searchQuery]);
  const filteredReturned = useMemo(() => filterTickets(returnedTickets), [returnedTickets, searchQuery]);
  const filteredReconciliation = useMemo(() => filterTickets(reconciliationTickets), [reconciliationTickets, searchQuery]);
  const filteredAllTrips = useMemo(() => filterTickets(allTrips), [allTrips, searchQuery]);

  // ============================================
  // CHART DATA
  // ============================================

  const chartData = useMemo(() => {
    if (!Array.isArray(allTrips) || allTrips.length === 0) {
      return [
        { month: 'Jan', trips: 0 },
        { month: 'Feb', trips: 0 },
        { month: 'Mar', trips: 0 },
        { month: 'Apr', trips: 0 },
        { month: 'May', trips: 0 },
        { month: 'Jun', trips: 0 },
      ];
    }

    const monthlyMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach(m => monthlyMap.set(m, 0));

    allTrips.forEach(trip => {
      if (trip?.trip_date) {
        try {
          const date = new Date(trip.trip_date);
          const monthKey = months[date.getMonth()];
          if (monthKey) {
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
          }
        } catch {
          // Skip invalid dates
        }
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, trips]) => ({ month, trips }))
      .slice(-6);
  }, [allTrips]);

  // ============================================
  // COMPONENTS
  // ============================================

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const TicketTable = ({ 
    tickets, 
    showReconcile = false, 
    onView, 
    onReconcile, 
    isLoading: tableLoading,
    showActions = true,
  }) => {
    if (tableLoading) {
      return (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Loading tickets...</p>
          </div>
        </div>
      );
    }

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No tickets found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tickets will appear here once available</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Ticket #</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Date</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Destination</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Department</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
              {showActions && (
                <TableHead className="font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket, index) => {
              const ticketId = getTicketId(ticket);
              return (
                <TableRow 
                  key={ticketId || index} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white">
                      {getTicketNumber(ticket)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDateShort(ticket?.trip_date)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                        {ticket?.destination || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {ticket?.department_name || ticket?.department?.name || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket?.status} />
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(ticketId)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {showReconcile && ticket?.status === 'pending_reconciliation' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8 px-3"
                            onClick={() => onReconcile?.(ticket)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Reconcile
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================

  const isLoading = pendingLoading || returnedLoading || reconciliationLoading || allTripsLoading;

  if (isLoading && allTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 rounded-full px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                GSO Office
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-full px-3 py-1">
                {departmentName}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 rounded-full px-3 py-1">
                Super Admin
              </Badge>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              GSO Dashboard
            </h1>
            <p className="text-slate-300 mt-1">
              Manage trip tickets, users, departments, and vehicles
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => navigate('/gso/create-trip')}
              className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                refetchPending();
                refetchReturned();
                refetchReconciliation();
                refetchAllTrips();
                queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] });
                queryClient.invalidateQueries({ queryKey: ['admin-vehicles-stats'] });
                queryClient.invalidateQueries({ queryKey: ['admin-departments-stats'] });
                toast.success('Dashboard refreshed');
              }}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            onClick={stat.onClick}
          >
            <Card className="relative overflow-hidden group dark:bg-slate-800/80 dark:border-slate-700">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Trip Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">Trip Trends</CardTitle>
            <CardDescription className="dark:text-slate-400">Monthly trip activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="month" stroke="#9ca3af" className="dark:stroke-slate-500" />
                <YAxis stroke="#9ca3af" className="dark:stroke-slate-500" />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area type="monotone" dataKey="trips" stroke="#3b82f6" fill="url(#colorTrips)" name="Trips" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-slate-800/80 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="dark:text-slate-400">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Users', icon: Users, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30', href: '/admin/users' },
                { title: 'Departments', icon: Building2, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30', href: '/admin/departments' },
                { title: 'Vehicles', icon: Car, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30', href: '/admin/vehicles' },
                { title: 'Reports', icon: FileCheck, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30', href: '/gso/reports' },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.href)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${action.color} hover:shadow-md transform hover:scale-105`}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{action.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by ticket number, destination, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 mr-2" />
            Pending MO ({pendingTickets.length})
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <FileCheck className="h-4 w-4 mr-2" />
            Reconcile ({reconciliationTickets.length})
          </TabsTrigger>
          <TabsTrigger value="returned" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Returned ({returnedTickets.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
            <Truck className="h-4 w-4 mr-2" />
            All Trips ({allTrips.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending MO Tab - NO REJECT BUTTON */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <Clock className="h-5 w-5 text-yellow-500" />
                Trip Tickets Awaiting Fund Release
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                These trips are pending approval from Mayor's Office
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredPending}
                onView={(id) => navigate(`/gso/trip/${id}`)}
                isLoading={pendingLoading}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <FileCheck className="h-5 w-5 text-orange-500" />
                Pending Reconciliation
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                These trips are completed and need to be closed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredReconciliation}
                showReconcile={true}
                onView={(id) => navigate(`/gso/trip/${id}`)}
                onReconcile={(ticket) => {
                  setSelectedTicket(ticket);
                  setShowReconcileDialog(true);
                }}
                isLoading={reconciliationLoading}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returned Tab */}
        <TabsContent value="returned" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <AlertCircle className="h-5 w-5 text-purple-500" />
                Returned for Revision
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                These trips were rejected and need revision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredReturned}
                onView={(id) => navigate(`/gso/trip/${id}`)}
                isLoading={returnedLoading}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Trips Tab - ✅ FIXED NAVIGATION */}
        <TabsContent value="all" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                <Truck className="h-5 w-5 text-blue-500" />
                All Trip Tickets
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Complete history of all trips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketTable
                tickets={filteredAllTrips}
                onView={(id) => {
                  // ✅ FIXED: Proper navigation with fallback
                  if (id) {
                    navigate(`/gso/trip/${id}`);
                  } else {
                    toast.error('Invalid ticket ID');
                  }
                }}
                isLoading={allTripsLoading}
                showActions={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              Reconcile Trip
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Confirm that this trip is complete and ready to be closed.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 space-y-2 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Trip Details</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-slate-600 dark:text-slate-400">Number:</span> 
                <span className="font-mono font-semibold dark:text-white ml-2">
                  {getTicketNumber(selectedTicket)}
                </span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Destination:</span> 
                <span className="dark:text-white ml-2">{selectedTicket?.destination || 'N/A'}</span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Department:</span> 
                <span className="dark:text-white ml-2">{selectedTicket?.department_name || 'N/A'}</span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Amount Released:</span> 
                <span className="font-semibold dark:text-white ml-2">
                  ₱{selectedTicket?.amount_released || selectedTicket?.gas_slip?.amount_released || 0}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReconcileDialog(false);
                setSelectedTicket(null);
              }} 
              className="dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => {
                const ticketId = getTicketId(selectedTicket);
                if (!ticketId) {
                  toast.error('Invalid ticket');
                  return;
                }
                reconcileMutation.mutate({
                  ticketId: ticketId,
                  data: { status: 'closed' },
                });
              }}
              disabled={reconcileMutation.isPending}
            >
              {reconcileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Reconcile & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GsoDashboard;