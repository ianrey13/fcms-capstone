// src/pages/mayor/MayorReports.jsx - Professional Version with Functional Selector
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, Loader2, TrendingUp, Fuel, DollarSign, Building2, 
  Calendar, Download, Printer, AlertCircle, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle, TrendingDown,
  Eye, Info, Zap, Target, Award, Users, Activity, Filter
} from 'lucide-react';
import { mayorsOfficeAPI, reportsAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
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
  gray: '#6b7280',
  slate: '#64748b'
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan, COLORS.pink, COLORS.indigo];

const MayorReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
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
          department_id: dept.department_id,
          allocated: allocated,
          spent: totalSpent,
          utilization: allocated > 0 ? (totalSpent / allocated) * 100 : 0,
          trips: deptTrips.length,
          variance: totalSpent - allocated,
          variancePercent: allocated > 0 ? ((totalSpent - allocated) / allocated) * 100 : 0,
          remaining: allocated - totalSpent
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
    toast.success('Reports refreshed');
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

  const getUtilizationColor = (utilization) => {
    const percent = parseFloat(utilization);
    if (percent >= 80) return 'text-red-600';
    if (percent >= 60) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getProgressColor = (utilization) => {
    const percent = parseFloat(utilization);
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₱0';
    if (numAmount >= 1000000) return `₱${(numAmount / 1000000).toFixed(1)}M`;
    if (numAmount >= 1000) return `₱${(numAmount / 1000).toFixed(1)}K`;
    return `₱${numAmount.toLocaleString()}`;
  };

  const formatCompactCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '₱0';
    if (numAmount >= 1000000) return `₱${(numAmount / 1000000).toFixed(1)}M`;
    if (numAmount >= 1000) return `₱${(numAmount / 1000).toFixed(1)}K`;
    return `₱${numAmount.toLocaleString()}`;
  };

  // ============ FILTERED DATA FOR SELECTOR ============
  // Filter comparison chart data based on selected department
  const filteredComparisonData = useMemo(() => {
    if (selectedDepartment === 'all') {
      return reportData.departmentTrends
        .map(d => ({
          name: d.name,
          allocated: d.allocated,
          spent: d.spent,
          remaining: d.remaining,
          utilization: d.utilization,
          variance: d.variance
        }))
        .sort((a, b) => b.allocated - a.allocated);
    } else {
      const selected = reportData.departmentTrends.find(d => d.name === selectedDepartment);
      return selected ? [{
        name: selected.name,
        allocated: selected.allocated,
        spent: selected.spent,
        remaining: selected.remaining,
        utilization: selected.utilization,
        variance: selected.variance
      }] : [];
    }
  }, [selectedDepartment, reportData.departmentTrends]);

  // Filter department details based on selector
  const filteredDepartmentDetails = useMemo(() => {
    if (selectedDepartment === 'all') {
      return reportData.departmentTrends.sort((a, b) => b.spent - a.spent);
    } else {
      return reportData.departmentTrends.filter(d => d.name === selectedDepartment);
    }
  }, [selectedDepartment, reportData.departmentTrends]);

  const budgetPieData = reportData.departments
    .map((dept, i) => ({
      name: dept,
      value: reportData.budgetAllocation[i]
    }))
    .filter(d => d.value > 0);

  const monthlyComparisonData = reportData.monthlyData;

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
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="border-green-500/30 bg-green-500/20 text-green-300">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Data
              </Badge>
              <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-300">
                Mayor's Office
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Financial Reports</h1>
            <p className="mt-1 text-sm text-slate-300">Budget vs Actual analysis and department spending insights</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-300" />
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-28 bg-transparent text-sm text-white focus:outline-none"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-28 bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
            <Button onClick={handleRefresh} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleExportCSV} disabled={isExporting} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handlePrint} variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Fuel Consumed</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{reportData.summary.totalFuelUsed} L</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3">
                <Fuel className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Budget Spent</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCompactCurrency(reportData.summary.totalBudgetSpent)}</p>
                <p className="text-xs text-gray-400">{formatCurrency(reportData.summary.totalBudgetSpent)}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Budget Utilization</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{reportData.summary.averageUtilization}%</p>
                <Progress value={parseFloat(reportData.summary.averageUtilization)} className="mt-2 h-1.5" />
              </div>
              <div className="rounded-xl bg-purple-100 p-3">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Trips</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{reportData.summary.totalTrips}</p>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className="text-emerald-600">Active: {reportData.summary.activeTrips}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-blue-600">Completed: {reportData.summary.completedTrips}</span>
                </div>
              </div>
              <div className="rounded-xl bg-amber-100 p-3">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'comparison'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Budget vs Actual
          </div>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'departments'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Department Details
          </div>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Budget Allocation Pie Chart */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                Budget Allocation by Department
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {budgetPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {budgetPieData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
                {budgetPieData.length > 5 && (
                  <span className="text-xs text-gray-400">+{budgetPieData.length - 5} more</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Spending Bar Chart */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Monthly Spending
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(value) => formatCompactCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="budgetSpent" fill={COLORS.success} name="Spending" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Spending Bar Chart */}
          <Card className="border-0 shadow-sm overflow-hidden lg:col-span-2">
            <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Weekly Spending Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(value) => formatCompactCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="budgetSpent" fill={COLORS.primary} name="Weekly Spending" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BUDGET VS ACTUAL TAB - WITH FUNCTIONAL SELECTOR */}
      {activeTab === 'comparison' && (
        <>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Budget Allocation vs Actual Spending
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Compare budget allocated against actual spending by department</p>
                </div>
                
                {/* ✅ FUNCTIONAL DEPARTMENT SELECTOR */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                  >
                    <option value="all">📊 All Departments</option>
                    {reportData.departmentTrends.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        🏛️ {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Selected Department Info */}
              {selectedDepartment !== 'all' && filteredComparisonData.length === 1 && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Showing data for <strong>{selectedDepartment}</strong> only</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setSelectedDepartment('all')}
                      className="ml-auto text-blue-600"
                    >
                      View All Departments
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {filteredComparisonData.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-3 text-gray-500">No data available for the selected department</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(400, filteredComparisonData.length * 50)}>
                  <BarChart 
                    data={filteredComparisonData} 
                    layout="vertical" 
                    margin={{ left: 100, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(value)} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="allocated" fill={COLORS.primary} name="Budget Allocated" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" fill={COLORS.success} name="Actual Spent" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Variance Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600">Under Budget</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {reportData.departmentTrends.filter(d => d.variance < 0).length}
                    </p>
                    <p className="text-xs text-emerald-500">departments</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3">
                    <TrendingDown className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600">Within 10% of Budget</p>
                    <p className="text-3xl font-bold text-amber-700">
                      {reportData.departmentTrends.filter(d => Math.abs(d.variancePercent) <= 10).length}
                    </p>
                    <p className="text-xs text-amber-500">departments</p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3">
                    <CheckCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Over Budget</p>
                    <p className="text-3xl font-bold text-red-700">
                      {reportData.departmentTrends.filter(d => d.variance > 0).length}
                    </p>
                    <p className="text-xs text-red-500">departments</p>
                  </div>
                  <div className="rounded-full bg-red-100 p-3">
                    <ArrowUpRight className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Budget Comparison Bar Chart */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Weekly Budget Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportData.weeklyBudgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => formatCompactCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="allocated" fill={COLORS.primary} name="Budget Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill={COLORS.warning} name="Actual Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* DEPARTMENTS TAB - WITH FUNCTIONAL SELECTOR */}
      {activeTab === 'departments' && (
        <div>
          {/* Department Filter Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="all">🏛️ All Departments</option>
                {reportData.departmentTrends.map(dept => (
                  <option key={dept.name} value={dept.name}>
                    📍 {dept.name}
                  </option>
                ))}
              </select>
              {selectedDepartment !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedDepartment('all')}
                  className="text-blue-600"
                >
                  Clear Filter
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Showing {filteredDepartmentDetails.length} of {reportData.departmentTrends.length} departments
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredDepartmentDetails.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-3 text-gray-500">No department data available</p>
              </Card>
            ) : (
              filteredDepartmentDetails.map((dept, index) => {
                const utilization = dept.utilization;
                const statusColor = utilization >= 80 ? 'text-red-600' : utilization >= 50 ? 'text-amber-600' : 'text-emerald-600';
                const statusBg = utilization >= 80 ? 'bg-red-100' : utilization >= 50 ? 'bg-amber-100' : 'bg-emerald-100';
                const statusText = utilization >= 80 ? 'Critical' : utilization >= 50 ? 'Warning' : 'Good';
                
                return (
                  <Card key={index} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                            <Badge className={`${statusBg} ${statusColor}`}>{statusText}</Badge>
                          </div>
                          
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500">Budget Allocated</span>
                            <span className="font-semibold text-gray-700">{formatCurrency(dept.allocated)}</span>
                          </div>
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500">Amount Used</span>
                            <span className={`font-semibold ${dept.spent > dept.allocated ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatCurrency(dept.spent)}
                            </span>
                          </div>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500">Remaining</span>
                            <span className="font-semibold text-blue-600">{formatCurrency(dept.remaining)}</span>
                          </div>
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-xs">
                              <span>Utilization Rate</span>
                              <span className={getUtilizationColor(utilization)}>{utilization.toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={dept.utilization} 
                              className="h-2"
                              indicatorClassName={getProgressColor(utilization)}
                            />
                          </div>
                        </div>
                        <div className="flex min-w-[120px] flex-col items-center gap-1 rounded-xl bg-gray-50 p-4 text-center">
                          <div className="text-2xl font-bold text-gray-800">{dept.trips}</div>
                          <p className="text-xs text-gray-500">Total Trips</p>
                          <div className="mt-2 text-xs">
                            <span className={dept.variance > 0 ? 'text-red-500' : 'text-emerald-500'}>
                              Variance: {dept.variance > 0 ? '+' : ''}{formatCurrency(dept.variance)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
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