// src/pages/mayor/BudgetAssistance.jsx

import React, { useState, useEffect } from 'react';
import { mayorsOfficeAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Building2, DollarSign, FileText, Loader2, Clock, User, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BudgetAssistance = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [chargeTo, setChargeTo] = useState('');
    const [moNote, setMoNote] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchRequests();
        // Refresh every 30 seconds
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await mayorsOfficeAPI.getBudgetAssistanceRequests();
            setRequests(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error('Failed to load budget assistance requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!chargeTo.trim()) {
            toast.error('Please enter "Charge To" field');
            return;
        }

        setCreating(true);
        try {
            const response = await mayorsOfficeAPI.createMoFundedTicket({
                request_id: selectedRequest.request_id,
                charge_to: chargeTo,
                mo_note: moNote,
            });

            if (response.data.success) {
                toast.success(response.data.message || 'MO-funded trip ticket created successfully!');
                setShowCreateModal(false);
                setSelectedRequest(null);
                setChargeTo('');
                setMoNote('');
                fetchRequests();
            }
        } catch (error) {
            console.error('Failed to create ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setCreating(false);
        }
    };

    const openCreateModal = (request) => {
        setSelectedRequest(request);
        setChargeTo(request.ticket_data?.charge_to || 'Mayor\'s Office Fund');
        setMoNote('');
        setShowCreateModal(true);
    };

    const getStatusColor = (shortage) => {
        if (shortage > 5000) return 'text-red-600';
        if (shortage > 1000) return 'text-orange-500';
        return 'text-yellow-600';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Budget Assistance Requests</h1>
                <p className="text-gray-600 mt-1">
                    Review and process department requests for budget assistance
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending Requests</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {requests.length}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Shortage</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₱{requests.reduce((sum, r) => sum + (r.shortage || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Departments</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {new Set(requests.map(r => r.department_id)).size}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Avg. Shortage</p>
                                <p className="text-2xl font-bold text-orange-500">
                                    ₱{requests.length > 0 
                                        ? Math.round(requests.reduce((sum, r) => sum + (r.shortage || 0), 0) / requests.length).toLocaleString()
                                        : 0}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Requests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Assistance Requests</CardTitle>
                    <p className="text-sm text-gray-500">
                        Click "Create Ticket" to process a request and generate an MO-funded trip ticket
                    </p>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p>No pending budget assistance requests</p>
                            <p className="text-sm">All departments have sufficient budget</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div key={request.request_id} className="border rounded-lg p-4 hover:shadow-md transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">
                                                    {request.department_name}
                                                </h3>
                                                <Badge className="bg-yellow-500">Pending</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <User className="h-3 w-3" />
                                                    <span>Requester: {request.requester_name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(request.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Destination: {request.ticket_data?.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Trip Date: {request.ticket_data?.trip_date}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p className="line-clamp-2">Purpose: {request.ticket_data?.purpose}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => openCreateModal(request)}
                                            className="bg-blue-600 hover:bg-blue-700 ml-4"
                                        >
                                            Create Ticket
                                        </Button>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t">
                                        <div>
                                            <span className="text-xs text-gray-500">Remaining Budget</span>
                                            <p className="font-medium text-red-600">
                                                ₱{request.budget_info?.remaining?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Estimated Cost</span>
                                            <p className="font-medium">
                                                ₱{request.estimated_cost?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Shortage</span>
                                            <p className={`font-semibold ${getStatusColor(request.shortage)}`}>
                                                ₱{request.shortage?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Ticket Modal */}
            {showCreateModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold">Create MO-Funded Trip Ticket</h2>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Auto-filled fields (readonly) */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-3 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Trip Details (Auto-filled from department request)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">Department:</span>
                                            <p className="font-medium">{selectedRequest.department_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Requester:</span>
                                            <p className="font-medium">{selectedRequest.requester_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Destination:</span>
                                            <p>{selectedRequest.ticket_data?.destination}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Trip Date:</span>
                                            <p>{selectedRequest.ticket_data?.trip_date}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Purpose:</span>
                                            <p>{selectedRequest.ticket_data?.purpose}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Passenger:</span>
                                            <p>{selectedRequest.ticket_data?.passenger_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Estimated Cost:</span>
                                            <p className="font-semibold text-blue-600">
                                                ₱{selectedRequest.estimated_cost?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Fields for MO to fill */}
                                <div>
                                    <Label htmlFor="charge_to" className="text-sm font-medium text-gray-700">
                                        Charge To <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="charge_to"
                                        type="text"
                                        value={chargeTo}
                                        onChange={(e) => setChargeTo(e.target.value)}
                                        className="mt-1"
                                        placeholder="e.g., Mayor's Office Fund / SK Fund / Special Allotment"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This trip will be charged to Mayor's Office fund (no department budget deduction)
                                    </p>
                                </div>
                                
                                <div>
                                    <Label htmlFor="mo_note" className="text-sm font-medium text-gray-700">
                                        MO Note (Optional)
                                    </Label>
                                    <textarea
                                        id="mo_note"
                                        rows="3"
                                        value={moNote}
                                        onChange={(e) => setMoNote(e.target.value)}
                                        className="w-full border rounded-lg p-2 mt-1"
                                        placeholder="Add any notes about this budget assistance..."
                                    />
                                </div>
                                
                                {/* Info Box */}
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-2">
                                        <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div className="text-sm text-green-800">
                                            <p className="font-medium">MO Funded Trip</p>
                                            <p>
                                                This trip will be funded by the Mayor's Office. 
                                                The department's budget will NOT be deducted.
                                            </p>
                                            <p className="text-xs mt-1 text-green-700">
                                                Gas slip will be generated automatically with the estimated amount.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={handleCreateTicket}
                                    disabled={creating}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Create MO-Funded Trip Ticket
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedRequest(null);
                                        setChargeTo('');
                                        setMoNote('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetAssistance;