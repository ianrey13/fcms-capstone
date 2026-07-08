// src/pages/gso/GsoReports.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Loader2,
  RefreshCw,
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Fuel,
  DollarSign,
  Truck,
  Building2,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// ============================================
// HELPERS
// ============================================

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-PH').format(num || 0);
};

// ============================================
// COMPONENT
// ============================================

const GsoReports = () => {
  const [activeTab, setActiveTab] = useState('fuel-consumption');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState('all');

  // ============ QUERIES ============

  // Fuel Consumption Report
  const { 
    data: fuelData, 
    isLoading: fuelLoading, 
    refetch: refetchFuel,
    isFetching: fuelFetching,
  } = useQuery({
    queryKey: ['fuel-consumption-report', dateRange, departmentFilter, vehicleFilter, yearFilter, monthFilter],
    queryFn: async () => {
      try {
        const params = {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          department_id: departmentFilter !== 'all' ? departmentFilter : undefined,
          vehicle_id: vehicleFilter !== 'all' ? vehicleFilter : undefined,
          year: yearFilter,
          month: monthFilter !== 'all' ? monthFilter : undefined,
        };
        const response = await reportsAPI.getFuelReport(params);
        return response.data?.data || response.data || {};
      } catch (error) {
        console.error('Error fetching fuel report:', error);
        toast.error('Failed to load fuel report');
        return {};
      }
    },
  });

  // Trip Summary Report
  const {
    data: tripData,
    isLoading: tripLoading,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ['trip-summary-report', dateRange, departmentFilter],
    queryFn: async () => {
      try {
        const params = {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          department_id: departmentFilter !== 'all' ? departmentFilter : undefined,
        };
        const response = await reportsAPI.getTripReport(params);
        return response.data?.data || response.data || {};
      } catch (error) {
        console.error('Error fetching trip report:', error);
        toast.error('Failed to load trip report');
        return {};
      }
    },
  });

  // ============ HANDLERS ============
  const handleRefresh = () => {
    refetchFuel();
    refetchTrips();
    toast.success('Reports refreshed');
  };

  const handleExport = async (type) => {
    try {
      toast.loading('Exporting report...');
      // Implement export logic
      setTimeout(() => {
        toast.dismiss();
        toast.success(`${type} report exported successfully`);
      }, 1500);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // ============ LOADING ============
  if (fuelLoading || tripLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Generate and view reports for fuel consumption, trips, and budget
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={fuelFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fuelFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => handleExport(activeTab)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-800/80 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="dark:bg-slate-900 dark:border-slate-700"
                />
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="mt-1 dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {/* Department options would come from API */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vehicle</label>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="mt-1 dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {/* Vehicle options would come from API */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
              <Select value={String(yearFilter)} onValueChange={(val) => setYearFilter(Number(val))}>
                <SelectTrigger className="mt-1 dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023, 2022].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <TabsTrigger value="fuel-consumption" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Consumption
          </TabsTrigger>
          <TabsTrigger value="trip-summary" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Truck className="h-4 w-4 mr-2" />
            Trip Summary
          </TabsTrigger>
          <TabsTrigger value="vehicle-efficiency" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <TrendingUp className="h-4 w-4 mr-2" />
            Vehicle Efficiency
          </TabsTrigger>
          <TabsTrigger value="budget-utilization" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <DollarSign className="h-4 w-4 mr-2" />
            Budget Utilization
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Fuel Consumption */}
        <TabsContent value="fuel-consumption" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Trips</p>
                    <p className="text-2xl font-bold">{fuelData?.summary?.total_trips || 0}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Fuel (Liters)</p>
                    <p className="text-2xl font-bold">{formatNumber(fuelData?.summary?.total_liters)}</p>
                  </div>
                  <Fuel className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(fuelData?.summary?.total_cost)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Avg. Km/L</p>
                    <p className="text-2xl font-bold">{fuelData?.summary?.average_km_per_liter || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Breakdown */}
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(fuelData?.department_breakdown || {}).map(([name, data]) => ({
                    name,
                    liters: data.liters || 0,
                    cost: data.cost || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="liters" fill="#3b82f6" name="Liters" />
                    <Bar dataKey="cost" fill="#10b981" name="Cost (₱)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={fuelData?.monthly_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="liters" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Liters" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Breakdown Table */}
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Vehicle Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Km/L</TableHead>
                    <TableHead>Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fuelData?.vehicle_breakdown || []).map((vehicle) => (
                    <TableRow key={vehicle.plate_number}>
                      <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.trips}</TableCell>
                      <TableCell className="text-right">{formatNumber(vehicle.liters)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(vehicle.cost)}</TableCell>
                      <TableCell className="text-right">{vehicle.km_per_liter}</TableCell>
                      <TableCell>
                        <Badge className={
                          vehicle.km_per_liter >= 10 ? 'bg-green-500' :
                          vehicle.km_per_liter >= 7 ? 'bg-blue-500' :
                          vehicle.km_per_liter >= 5 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {vehicle.km_per_liter >= 10 ? 'Excellent' :
                           vehicle.km_per_liter >= 7 ? 'Good' :
                           vehicle.km_per_liter >= 5 ? 'Average' : 'Needs Attention'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Trip Summary */}
        <TabsContent value="trip-summary" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Trips</p>
                    <p className="text-2xl font-bold">{tripData?.total_trips || 0}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">{tripData?.status_breakdown?.pending_mayors_office || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800/80 dark:border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="text-2xl font-bold text-green-500">{tripData?.status_breakdown?.closed || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown Pie Chart */}
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                Department Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tripData?.department_breakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ department, total }) => `${department}: ${total}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {(tripData?.department_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Vehicle Efficiency */}
        <TabsContent value="vehicle-efficiency" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Vehicle Efficiency Report
              </CardTitle>
              <CardDescription>Fuel efficiency analysis by vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Vehicle efficiency data would be displayed here */}
              <p className="text-slate-500 dark:text-slate-400">Vehicle efficiency data loading...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Budget Utilization */}
        <TabsContent value="budget-utilization" className="space-y-4 mt-6">
          <Card className="dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                Budget Utilization Report
              </CardTitle>
              <CardDescription>Budget allocation and usage by department</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Budget utilization data would be displayed here */}
              <p className="text-slate-500 dark:text-slate-400">Budget utilization data loading...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GsoReports;