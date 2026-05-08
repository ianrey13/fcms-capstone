// src/pages/mayor/MayorReports.jsx - With Dark Mode & Premium Theme
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, Loader2, TrendingUp, Fuel, DollarSign, Building2, 
  Calendar, Download, Printer, AlertCircle, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle, TrendingDown,
  Eye, Info, Zap, Target, Award, Users, Activity, Filter, ChevronLeft, ChevronRight,
  Sun, Moon
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

// Helper functions
const formatCurrency = (amount) => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numAmount)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

const formatCompactCurrency = (amount) => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numAmount)) return '₱0';
  if (numAmount >= 1000000) return `₱${(numAmount / 1000000).toFixed(1)}M`;
  if (numAmount >= 1000) return `₱${(numAmount / 1000).toFixed(1)}K`;
  return `₱${numAmount.toLocaleString()}`;
};

const MayorReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Month/Week Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState('month');
  const [selectedWeek, setSelectedWeek] = useState(1);
  
  const [reportData, setReportData] = useState({
    departments: [],
    fuelUsage: [],
    budgetAllocation: [],
    budgetSpent: [],
    utilizationRates: [],
    weeklyData: [],
    monthlyData: [],
    quarterlyData: [],
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

  // Check for dark mode preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getWeeksInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    
    let currentWeekStart = new Date(firstDay);
    const dayOfWeek = currentWeekStart.getDay();
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    currentWeekStart.setDate(currentWeekStart.getDate() - diffToMonday);
    
    let weekNumber = 1;
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekEnd >= firstDay && currentWeekStart <= lastDay) {
        weeks.push({
          weekNumber: weekNumber,
          start: new Date(currentWeekStart),
          end: weekEnd,
          label: `Week ${weekNumber} (${currentWeekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`
        });
        weekNumber++;
      }
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
  };

  const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
  const currentMonthName = monthNames[selectedMonth];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedMonth, selectedYear, selectedWeek, viewType]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let startDate, endDate;
      
      if (viewType === 'week' && selectedWeek) {
        const week = weeksInMonth[selectedWeek - 1];
        if (week) {
          startDate = week.start.toISOString().split('T')[0];
          endDate = week.end.toISOString().split('T')[0];
        } else {
          startDate = dateRange.start_date;
          endDate = dateRange.end_date;
        }
      } else {
        startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      }
      
      const budgetResponse = await mayorsOfficeAPI.getBudgetOverview();
      const budgetData = budgetResponse.data?.data || budgetResponse.data || [];
      
      const tripReportResponse = await reportsAPI.getTripReport({
        start_date: startDate,
        end_date: endDate
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
      const quarterlyData = generateQuarterlyData(tripData);
      
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
        quarterlyData,
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
    const weekMap = new Map();
    
    tripData.forEach(trip => {
      const tripDate = new Date(trip.trip_date);
      if (tripDate.getMonth() === selectedMonth && tripDate.getFullYear() === selectedYear) {
        const weekNumber = Math.ceil((tripDate.getDate()) / 7);
        if (!weekMap.has(weekNumber)) {
          weekMap.set(weekNumber, { budgetSpent: 0, trips: 0 });
        }
        const weekData = weekMap.get(weekNumber);
        weekData.budgetSpent += parseFloat(trip.amount_released) || 0;
        weekData.trips += 1;
      }
    });
    
    for (let i = 1; i <= 5; i++) {
      const weekData = weekMap.get(i) || { budgetSpent: 0, trips: 0 };
      weeks.push({
        week: `Week ${i}`,
        budgetSpent: Math.round(weekData.budgetSpent),
        trips: weekData.trips
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

  const generateQuarterlyData = (tripData) => {
    const quarters = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const quarterDate = new Date(today);
      quarterDate.setMonth(today.getMonth() - (i * 3));
      const quarterNumber = Math.floor(quarterDate.getMonth() / 3) + 1;
      const quarterName = `Q${quarterNumber} ${quarterDate.getFullYear()}`;
      
      const quarterStart = new Date(quarterDate.getFullYear(), Math.floor(quarterDate.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(quarterDate.getFullYear(), Math.floor(quarterDate.getMonth() / 3) * 3 + 3, 0);
      
      const quarterTrips = tripData.filter(t => {
        const tripDate = new Date(t.trip_date);
        return tripDate >= quarterStart && tripDate <= quarterEnd;
      });
      
      const budgetSpent = quarterTrips.reduce((sum, t) => sum + (parseFloat(t.amount_released) || 0), 0);
      const trips = quarterTrips.length;
      
      quarters.push({
        quarter: quarterName,
        budgetSpent: Math.round(budgetSpent),
        trips: trips
      });
    }
    return quarters;
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

  const handleMonthChange = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setSelectedWeek(1);
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
    if (percent >= 80) return 'text-red-600 dark:text-red-400';
    if (percent >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getProgressColor = (utilization) => {
    const percent = parseFloat(utilization);
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getCurrentChartData = () => {
    if (viewType === 'week') {
      return reportData.weeklyData;
    }
    return reportData.monthlyData;
  };

  const currentChartData = getCurrentChartData();
  const currentSelectedWeek = weeksInMonth[selectedWeek - 1];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <AlertCircle className="h-16 w-16 text-red-400 dark:text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-400 text-lg mb-2">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 p-6 text-white shadow-xl">
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
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-slate-300" />
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-28 bg-transparent text-sm text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-28 bg-transparent text-sm text-white focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
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
        <Card className="border-0 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Total Fuel Consumed</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{reportData.summary.totalFuelUsed} L</p>
              </div>
              <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-3">
                <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Budget Spent</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCompactCurrency(reportData.summary.totalBudgetSpent)}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{formatCurrency(reportData.summary.totalBudgetSpent)}</p>
              </div>
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-3">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Budget Utilization</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{reportData.summary.averageUtilization}%</p>
                <Progress value={parseFloat(reportData.summary.averageUtilization)} className="mt-2 h-1.5" />
              </div>
              <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-3">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Total Trips</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{reportData.summary.totalTrips}</p>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">Active: {reportData.summary.activeTrips}</span>
                  <span className="text-gray-400 dark:text-slate-500">•</span>
                  <span className="text-blue-600 dark:text-blue-400">Completed: {reportData.summary.completedTrips}</span>
                </div>
              </div>
              <div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 p-3">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b dark:border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
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
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
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
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
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
          <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                <PieChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {budgetPieData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index] }} />
                    <span className="text-xs text-gray-600 dark:text-slate-400">{item.name}</span>
                  </div>
                ))}
                {budgetPieData.length > 5 && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">+{budgetPieData.length - 5} more</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Month/Week Filter Card */}
          <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Spending Overview
                </CardTitle>
                
                <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
                  <button
                    onClick={() => setViewType('month')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewType === 'month'
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setViewType('week')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      viewType === 'week'
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange(-1)}
                  className="p-1 h-8 w-8 dark:border-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                      {monthNames[selectedMonth]} {selectedYear}
                    </span>
                  </div>
                  {viewType === 'week' && currentSelectedWeek && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {currentSelectedWeek.label}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange(1)}
                  className="p-1 h-8 w-8 dark:border-slate-600 dark:text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {viewType === 'week' && weeksInMonth.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Select Week
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {weeksInMonth.map((week) => (
                      <button
                        key={week.weekNumber}
                        onClick={() => setSelectedWeek(week.weekNumber)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                          selectedWeek === week.weekNumber
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        Week {week.weekNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={currentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                    <XAxis 
                      dataKey={viewType === 'week' ? 'week' : 'month'} 
                      stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={11} 
                    />
                    <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={11} tickFormatter={(value) => formatCompactCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
                    <Bar dataKey="budgetSpent" fill={COLORS.success} name="Spending" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No data available for {currentMonthName} {selectedYear}</p>
                </div>
              )}
              
              <div className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                {viewType === 'week' 
                  ? `Weekly spending for ${currentMonthName} ${selectedYear}`
                  : `Monthly spending trends (last 6 months)`
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BUDGET VS ACTUAL TAB */}
      {activeTab === 'comparison' && (
        <>
          <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Budget Allocation vs Actual Spending
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Compare budget allocated against actual spending by department</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-[180px]"
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
              
              {selectedDepartment !== 'all' && filteredComparisonData.length === 1 && (
                <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-400">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Showing data for <strong>{selectedDepartment}</strong> only</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setSelectedDepartment('all')}
                      className="ml-auto text-blue-600 dark:text-blue-400"
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
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                  <p className="mt-3 text-gray-500 dark:text-slate-400">No data available for the selected department</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(400, filteredComparisonData.length * 50)}>
                  <BarChart 
                    data={filteredComparisonData} 
                    layout="vertical" 
                    margin={{ left: 100, right: 30, top: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                    <XAxis type="number" tickFormatter={(value) => formatCompactCurrency(value)} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569' }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
                    <Legend wrapperStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                    <Bar dataKey="allocated" fill={COLORS.primary} name="Budget Allocated" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" fill={COLORS.success} name="Actual Spent" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Variance Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Under Budget</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                      {reportData.departmentTrends.filter(d => d.variance < 0).length}
                    </p>
                    <p className="text-xs text-emerald-500 dark:text-emerald-500">departments</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-3">
                    <TrendingDown className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">Within 10% of Budget</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                      {reportData.departmentTrends.filter(d => Math.abs(d.variancePercent) <= 10).length}
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-500">departments</p>
                  </div>
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-3">
                    <CheckCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400">Over Budget</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                      {reportData.departmentTrends.filter(d => d.variance > 0).length}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-500">departments</p>
                  </div>
                  <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-3">
                    <ArrowUpRight className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Budget Comparison Bar Chart */}
          <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800/80 dark:border-slate-700">
            <CardHeader className="border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Weekly Budget Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportData.weeklyBudgetComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="week" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickFormatter={(value) => formatCompactCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                  <Bar dataKey="allocated" fill={COLORS.primary} name="Budget Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" fill={COLORS.warning} name="Actual Spent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-[180px]"
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
                  className="text-blue-600 dark:text-blue-400"
                >
                  Clear Filter
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {filteredDepartmentDetails.length} of {reportData.departmentTrends.length} departments
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {filteredDepartmentDetails.length === 0 ? (
              <Card className="p-12 text-center dark:bg-slate-800/80">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                <p className="mt-3 text-gray-500 dark:text-slate-400">No department data available</p>
              </Card>
            ) : (
              filteredDepartmentDetails.map((dept, index) => {
                const utilization = dept.utilization;
                const statusColor = utilization >= 80 ? 'text-red-600 dark:text-red-400' : utilization >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                const statusBg = utilization >= 80 ? 'bg-red-100 dark:bg-red-900/30' : utilization >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30';
                const statusText = utilization >= 80 ? 'Critical' : utilization >= 50 ? 'Warning' : 'Good';
                
                return (
                  <Card key={index} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all dark:bg-slate-800/80 dark:border-slate-700">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                            <Badge className={`${statusBg} ${statusColor}`}>{statusText}</Badge>
                          </div>
                          
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500 dark:text-slate-400">Budget Allocated</span>
                            <span className="font-semibold text-gray-700 dark:text-slate-300">{formatCurrency(dept.allocated)}</span>
                          </div>
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500 dark:text-slate-400">Amount Used</span>
                            <span className={`font-semibold ${dept.spent > dept.allocated ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatCurrency(dept.spent)}
                            </span>
                          </div>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500 dark:text-slate-400">Remaining</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(dept.remaining)}</span>
                          </div>
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-slate-400">Utilization Rate</span>
                              <span className={getUtilizationColor(utilization)}>{utilization.toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={dept.utilization} 
                              className="h-2"
                            />
                          </div>
                        </div>
                        <div className="flex min-w-[120px] flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-slate-700/50 p-4 text-center">
                          <div className="text-2xl font-bold text-gray-800 dark:text-white">{dept.trips}</div>
                          <p className="text-xs text-gray-500 dark:text-slate-400">Total Trips</p>
                          <div className="mt-2 text-xs">
                            <span className={dept.variance > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'}>
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
      <div className="text-center text-xs text-gray-400 dark:text-slate-500 pt-4">
        Data period: {viewType === 'week' && currentSelectedWeek 
          ? `${currentSelectedWeek.start.toLocaleDateString()} to ${currentSelectedWeek.end.toLocaleDateString()}`
          : `${monthNames[selectedMonth]} ${selectedYear}`
        }
      </div>
    </div>
  );
};

export default MayorReports;