// src/pages/mayor/MayorReports.jsx - Fully Functional
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, Loader2, TrendingUp, Fuel, DollarSign, Building2, 
  Calendar, Download, Printer, AlertCircle, BarChart3, LineChart,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart,
  CheckCircle, TrendingDown
} from 'lucide-react';
import { mayorsOfficeAPI, reportsAPI } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  BarChart, Bar, Legend, ComposedChart, Line as ReLine
} from 'recharts';
import { toast } from 'react-hot-toast';

// Color palette
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
  indigo: '#6366f1',
  gray: '#6b7280'
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.indigo];

const MayorReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewType] = useState('month');
  const [reportData, setReportData] = useState({
    departments: [],
    fuelUsage: [],
    budgetAllocation: [],
    budgetSpent: [],
    utilizationRates: [],
    weeklyData: [],
    monthlyData: [],
    departmentTrends: [],
    weeklyBudgetComparison: [],
    summary: {
      totalFuelUsed: 0,
      totalBudgetAllocated: 0,
      totalBudgetSpent: 0,
      averageUtilization: 0,
      totalTrips: 0,
      activeTrips: 0,
      completedTrips: 0,
      overBudgetDepts: 0
    }
  });

  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const budgetResponse = await mayorsOfficeAPI.getBudgetOverview();
      const budgetData = budgetResponse.data?.data || budgetResponse.data || [];
      
      const tripReportResponse = await reportsAPI.getTripReport({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      const tripData = tripReportResponse.data?.data || tripReportResponse.data || [];
      
      const departments = budgetData.map(item => item.department_name);
      const budgetAllocation = budgetData.map(item => parseFloat(item.allocated_amount) || 0);
      const budgetSpent = budgetData.map(item => parseFloat(item.spent_amount) || 0);
      const utilizationRates = budgetData.map(item => parseFloat(item.utilization_percentage) || 0);
      
      const fuelPricePerLiter = 58;
      const fuelUsage = budgetSpent.map(spent => (spent / fuelPricePerLiter).toFixed(1));
      
      const monthlyData = generateMonthlyData(tripData);
      const weeklyData = generateWeeklyData(tripData);
      
      const departmentTrends = budgetData.map(dept => {
        const deptTrips = tripData.filter(t => t.department_id === dept.department_id);
        const totalSpent = deptTrips.reduce((sum, t) => sum + (parseFloat(t.amount_released) || 0), 0);
        const allocated = parseFloat(dept.allocated_amount) || 0;
        return {
          name: dept.department_name,
          allocated: allocated,
          spent: totalSpent,
          utilization: allocated > 0 ? (totalSpent / allocated) * 100 : 0,
          trips: deptTrips.length,
          variance: totalSpent - allocated,
          variancePercent: allocated > 0 ? ((totalSpent - allocated) / allocated) * 100 : 0
        };
      });
      
      const weeklyBudgetComparison = generateWeeklyBudgetComparison(budgetData, tripData);
      
      const totalBudgetAllocated = budgetAllocation.reduce((sum, val) => sum + val, 0);
      const totalBudgetSpent = budgetSpent.reduce((sum, val) => sum + val, 0);
      const averageUtilization = totalBudgetAllocated > 0 ? ((totalBudgetSpent / totalBudgetAllocated) * 100).toFixed(1) : 0;
      const totalTrips = tripData.length;
      const activeTrips = tripData.filter(t => ['funds_issued', 'in_transit'].includes(t.status)).length;
      const completedTrips = tripData.filter(t => t.status === 'closed').length;
      const overBudgetDepts = utilizationRates.filter(r => r >= 80).length;
      
      setReportData({
        departments,
        fuelUsage,
        budgetAllocation,
        budgetSpent,
        utilizationRates,
        weeklyData,
        monthlyData,
        departmentTrends,
        weeklyBudgetComparison,
        summary: {
          totalFuelUsed: (totalBudgetSpent / fuelPricePerLiter).toFixed(1),
          totalBudgetAllocated,
          totalBudgetSpent,
          averageUtilization,
          totalTrips,
          activeTrips,
          completedTrips,
          overBudgetDepts
        }
      });
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setError('Failed to load report data. Please try again later.');
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = (tripData) => {
    const weeks = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTrips = tripData.filter(t => {
        const tripDate = new Date(t.trip_date);
        return tripDate >= weekStart && tripDate <= weekEnd;
      });
      
      const budgetSpent = weekTrips.reduce((sum, t) => sum + (parseFloat(t.amount_released) || 0), 0);
      const trips = weekTrips.length;
      
      weeks.push({
        week: `Week ${4 - i}`,
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: weekEnd.toLocaleDateString(),
        budgetSpent: Math.round(budgetSpent),
        trips: trips
      });
    }
    return weeks;
  };

  const generateMonthlyData = (tripData) => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today);
      monthDate.setMonth(today.getMonth() - i);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTrips = tripData.filter(t => {
        const tripDate = new Date(t.trip_date);
        return tripDate.getMonth() === monthDate.getMonth() && 
               tripDate.getFullYear() === monthDate.getFullYear();
      });
      
      const budgetSpent = monthTrips.reduce((sum, t) => sum + (parseFloat(t.amount_released) || 0), 0);
      const trips = monthTrips.length;
      
      months.push({
        month: monthName,
        budgetSpent: Math.round(budgetSpent),
        trips: trips
      });
    }
    return months;
  };

  const generateWeeklyBudgetComparison = (budgetData, tripData) => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTrips = tripData.filter(t => {
        const tripDate = new Date(t.trip_date);
        return tripDate >= weekStart && tripDate <= weekEnd;
      });
      
      const totalSpent = weekTrips.reduce((sum, t) => sum + (parseFloat(t.amount_released) || 0), 0);
      const weeklyAllocation = budgetData.reduce((sum, d) => sum + (parseFloat(d.allocated_amount) || 0), 0) / 4;
      
      weeks.push({
        week: `Week ${i + 1}`,
        allocated: Math.round(weeklyAllocation),
        spent: Math.round(totalSpent),
        variance: Math.round(totalSpent - weeklyAllocation),
        variancePercent: weeklyAllocation > 0 ? ((totalSpent - weeklyAllocation) / weeklyAllocation) * 100 : 0
      });
    }
    
    return weeks;
  };

  const handleRefresh = () => {
    fetchReportData();
    toast.success('Dashboard refreshed');
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    toast.loading('Exporting report...');
    try {
      await reportsAPI.exportTripReport('csv', {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const comparisonChartData = reportData.departmentTrends.map(d => ({
    name: d.name,
    allocated: d.allocated,
    spent: d.spent,
    utilization: d.utilization,
    variance: d.variance,
    isOverBudget: d.variance > 0
  })).sort((a, b) => b.allocated - a.allocated);

  const weeklyBudgetData = reportData.weeklyBudgetComparison;

  // Budget Pie Chart Data
  const budgetPieData = reportData.departments.map((dept, i) => ({
    name: dept,
    value: reportData.budgetAllocation[i]
  })).filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <p className="text-red-600 text-lg mb-2">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                Live Data
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Mayor's Office
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">Budget vs Actual Reports</h1>
            <p className="text-slate-300 mt-1">Amount used per department with dynamic comparison</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-300" />
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="bg-transparent text-white text-sm border-none focus:outline-none w-28"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="bg-transparent text-white text-sm border-none focus:outline-none w-28"
              />
            </div>
            <Button onClick={handleRefresh} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handlePrint} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Overview
        </button>
        <button onClick={() => setActiveTab('comparison')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'comparison' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Budget vs Actual
        </button>
        <button onClick={() => setActiveTab('departments')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'departments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          Departments
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10"><Fuel className="h-5 w-5 text-blue-600" /></div>
                  <Badge variant="outline" className="text-green-600">Total</Badge>
                </div>
                <p className="text-2xl font-bold">{reportData.summary.totalFuelUsed} L</p>
                <p className="text-sm text-gray-500 mt-1">Total Fuel Consumed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-green-500/10"><DollarSign className="h-5 w-5 text-green-600" /></div>
                  <Badge variant="outline">{reportData.summary.averageUtilization}%</Badge>
                </div>
                <p className="text-2xl font-bold">₱{reportData.summary.totalBudgetSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">Total Budget Spent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-purple-500/10"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
                  <Badge variant="outline">{reportData.summary.totalTrips} trips</Badge>
                </div>
                <p className="text-2xl font-bold">{reportData.summary.activeTrips}</p>
                <p className="text-sm text-gray-500 mt-1">Active Trips</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-orange-500/10"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
                  <Badge variant="outline" className="text-red-600">Alert</Badge>
                </div>
                <p className="text-2xl font-bold">{reportData.summary.overBudgetDepts}</p>
                <p className="text-sm text-gray-500 mt-1">Departments &gt;80% Utilization</p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Allocation Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Budget Allocation by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RePieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {budgetPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-600" />
                Monthly Spending Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlyData}>
                  <defs>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="budgetSpent" stroke="#10b981" fill="url(#colorBudget)" name="Budget Spent (₱)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* BUDGET VS ACTUAL TAB */}
      {activeTab === 'comparison' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Amount Used vs Budget Allocated by Department
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Compare actual spending against allocated budget per department</p>
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">All Departments</option>
                  {reportData.departmentTrends.map(dept => (
                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(400, comparisonChartData.length * 50)}>
                <BarChart data={comparisonChartData} layout="vertical" margin={{ left: 100, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#3b82f6" name="Budget Allocated (₱)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="spent" fill="#10b981" name="Amount Used (₱)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Budget Allocated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Amount Used (Actual)</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-600">Over Budget</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Under Budget</p>
                    <p className="text-2xl font-bold text-green-700">
                      {reportData.departmentTrends.filter(d => d.variance < 0).length}
                    </p>
                    <p className="text-xs text-green-500">departments</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Within 10% of Budget</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {reportData.departmentTrends.filter(d => Math.abs(d.variancePercent) <= 10).length}
                    </p>
                    <p className="text-xs text-yellow-500">departments</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Over Budget</p>
                    <p className="text-2xl font-bold text-red-700">
                      {reportData.departmentTrends.filter(d => d.variance > 0).length}
                    </p>
                    <p className="text-xs text-red-500">departments</p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 gap-5">
          {reportData.departmentTrends.sort((a, b) => b.spent - a.spent).map((dept, index) => {
            const utilization = dept.utilization;
            const statusColor = utilization >= 80 ? 'text-red-600' : utilization >= 50 ? 'text-yellow-600' : 'text-green-600';
            const statusBg = utilization >= 80 ? 'bg-red-100' : utilization >= 50 ? 'bg-yellow-100' : 'bg-green-100';
            const statusText = utilization >= 80 ? 'Critical' : utilization >= 50 ? 'Warning' : 'Good';
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold">{dept.name}</h3>
                        <Badge className={`${statusBg} ${statusColor}`}>{statusText}</Badge>
                      </div>
                      
                      {/* Comparison Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Budget Allocated: ₱{dept.allocated.toLocaleString()}</span>
                          <span className={dept.spent > dept.allocated ? 'text-red-600' : 'text-green-600'}>
                            Amount Used: ₱{dept.spent.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-blue-500 flex items-center justify-end px-2 text-xs text-white font-medium"
                            style={{ width: `${Math.min((dept.allocated / Math.max(dept.allocated, dept.spent, 1)) * 100, 100)}%` }}
                          >
                            {dept.allocated > 0 && `₱${(dept.allocated / 1000).toFixed(0)}K`}
                          </div>
                          <div 
                            className="absolute left-0 top-0 h-full bg-green-500 flex items-center justify-end px-2 text-xs text-white font-medium"
                            style={{ 
                              width: `${Math.min((dept.spent / Math.max(dept.allocated, dept.spent, 1)) * 100, 100)}%`,
                              opacity: 0.85
                            }}
                          >
                            {dept.spent > 0 && `₱${(dept.spent / 1000).toFixed(0)}K`}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Utilization: {dept.utilization.toFixed(1)}%</span>
                          <span>Trips: {dept.trips}</span>
                          <span className={dept.variance > 0 ? 'text-red-500' : 'text-green-500'}>
                            Variance: {dept.variance > 0 ? '+' : ''}{dept.variance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-48">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{dept.trips}</div>
                        <p className="text-xs text-gray-500">Total Trips</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-4">
        Data from {new Date(dateRange.start_date).toLocaleDateString()} to {new Date(dateRange.end_date).toLocaleDateString()}
      </div>
    </div>
  );
};

export default MayorReports;