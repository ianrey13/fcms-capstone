// src/pages/gso/GsoReports.jsx
import React, { useState, useEffect } from 'react';
import { gsoAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileBarChart, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Send, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

const GsoReports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await gsoAPI.getReports({ 
                start_date: dateRange.start_date, 
                end_date: dateRange.end_date 
            });
            const reportData = response.data?.data || response.data;
            setStats(reportData);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setDateRange({
            start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0]
        });
    };

    const hasActiveFilters = dateRange.start_date !== new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0] ||
                            dateRange.end_date !== new Date().toISOString().split('T')[0];

    const totalProcessed = (stats?.total_verified || 0) + (stats?.total_rejected || 0);
    const approvalRate = totalProcessed > 0 ? ((stats?.total_verified || 0) / totalProcessed * 100).toFixed(1) : 0;
    const rejectionRate = totalProcessed > 0 ? ((stats?.total_rejected || 0) / totalProcessed * 100).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
                        <FileBarChart className="h-6 w-6" />
                        GSO Reports
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Summary of GSO verification activities and performance metrics
                    </p>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all duration-300">
                <div 
                    className="px-6 py-4 border-b dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Date Range</span>
                            {hasActiveFilters && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                    Custom
                                </span>
                            )}
                        </div>
                        {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
                
                {showFilters && (
                    <div className="p-6 animate-slide-down">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={dateRange.start_date}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={dateRange.end_date}
                                        onChange={handleDateChange}
                                        className="w-full pl-10 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={fetchReports} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Apply
                                </Button>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearFilters} className="dark:border-slate-700 dark:text-slate-300">
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Stats Cards - Premium Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verified Tickets</p>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {stats?.total_verified || stats?.total_approved || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Approved</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Forwarded to MO</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {stats?.total_forwarded || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <Send className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-blue-600 dark:text-blue-400">Pending Release</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected Tickets</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {stats?.total_rejected || 0}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-600 dark:text-red-400">Returned</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Processed</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {totalProcessed}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="h-3 w-3 text-purple-500" />
                                    <span className="text-xs text-purple-600 dark:text-purple-400">Overall</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Approval/Rejection Rate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="dark:bg-slate-800/80 dark:border-slate-700">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Approval Rate</h3>
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block text-emerald-600 dark:text-emerald-400">
                                        {approvalRate}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-emerald-200 dark:bg-emerald-900/50">
                                <div 
                                    style={{ width: `${approvalRate}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                {stats?.total_verified || 0} out of {totalProcessed} tickets approved
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800/80 dark:border-slate-700">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Rejection Rate</h3>
                            <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block text-red-600 dark:text-red-400">
                                        {rejectionRate}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-red-200 dark:bg-red-900/50">
                                <div 
                                    style={{ width: `${rejectionRate}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all duration-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                {stats?.total_rejected || 0} out of {totalProcessed} tickets rejected
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Breakdown Table */}
            {stats?.monthly_breakdown && stats.monthly_breakdown.length > 0 && (
                <Card className="dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
                    <CardHeader className="border-b dark:border-slate-700">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <BarChart3 className="h-5 w-5" />
                            Monthly Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Month</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Forwarded</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rejected</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {stats.monthly_breakdown.map((item, index) => (
                                        <tr 
                                            key={index} 
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors animate-fade-in"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.month}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    {item.verified}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    <Send className="h-3 w-3" />
                                                    {item.forwarded}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle className="h-3 w-3" />
                                                    {item.rejected}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {item.verified + item.forwarded + item.rejected}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {(!stats || (stats?.total_verified === 0 && stats?.total_rejected === 0 && stats?.total_forwarded === 0)) && (
                <Card className="dark:bg-slate-800/80 dark:border-slate-700">
                    <CardContent className="py-12 text-center">
                        <FileBarChart className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">No report data available</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                            Try adjusting your date range or check back later
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Last Updated Info */}
            <div className="text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last updated: {new Date().toLocaleString()}
                </p>
            </div>
        </div>
    );
};

export default GsoReports;