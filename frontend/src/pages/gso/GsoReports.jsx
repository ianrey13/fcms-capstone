// src/pages/gso/GsoReports.jsx
import React, { useState, useEffect } from 'react';
import { gsoAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, Loader2, RefreshCw, Calendar, TrendingUp, CheckCircle, Send, XCircle } from 'lucide-react';

const GsoReports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
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
            // Handle response structure - response.data.data
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

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileBarChart className="h-6 w-6" />
                        GSO Reports
                    </h1>
                    <p className="text-gray-500">Summary of GSO verification activities</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <input
                            type="date"
                            name="start_date"
                            value={dateRange.start_date}
                            onChange={handleDateChange}
                            className="px-3 py-2 border rounded-lg text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            name="end_date"
                            value={dateRange.end_date}
                            onChange={handleDateChange}
                            className="px-3 py-2 border rounded-lg text-sm"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchReports} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Verified Tickets</p>
                                <p className="text-3xl font-bold text-green-600">{stats?.total_verified || stats?.total_approved || 0}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Forwarded to MO</p>
                                <p className="text-3xl font-bold text-blue-600">{stats?.total_forwarded || 0}</p>
                            </div>
                            <Send className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Rejected Tickets</p>
                                <p className="text-3xl font-bold text-red-600">{stats?.total_rejected || 0}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Processed</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {(stats?.total_verified || 0) + (stats?.total_rejected || 0)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            {stats?.monthly_breakdown && (
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium">Month</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium">Verified</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium">Forwarded</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium">Rejected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.monthly_breakdown.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-4 py-2">{item.month}</td>
                                            <td className="px-4 py-2 text-green-600">{item.verified}</td>
                                            <td className="px-4 py-2 text-blue-600">{item.forwarded}</td>
                                            <td className="px-4 py-2 text-red-600">{item.rejected}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default GsoReports;