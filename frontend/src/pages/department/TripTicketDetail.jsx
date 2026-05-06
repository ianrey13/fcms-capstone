// src/pages/department/TripTicketDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tripTicketAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Truck,
  DollarSign,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Building2,
  Fuel,
  Hash,
  TrendingUp,
  Printer,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TripTicketDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    setIsLoading(true);
    try {
      const response = await tripTicketAPI.getById(id);
      const ticketData = response.data?.data || response.data;
      setTicket(ticketData);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load trip ticket details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { color: 'bg-gray-500', label: 'Draft', icon: Clock, variant: 'secondary' },
      pending_head_approval: { color: 'bg-purple-500', label: 'Pending Head Approval', icon: Clock, variant: 'warning' },
      pending_gso_review: { color: 'bg-yellow-500', label: 'Pending GSO Review', icon: Clock, variant: 'warning' },
      returned_for_revision: { color: 'bg-red-500', label: 'Returned for Revision', icon: AlertCircle, variant: 'destructive' },
      with_mayors_office: { color: 'bg-purple-500', label: 'With Mayor\'s Office', icon: Building2, variant: 'warning' },
      pending_mayors_office: { color: 'bg-purple-500', label: 'Pending Mayor\'s Office', icon: Clock, variant: 'warning' },
      funds_issued: { color: 'bg-green-500', label: 'Funds Issued', icon: DollarSign, variant: 'success' },
      acknowledged: { color: 'bg-blue-500', label: 'Acknowledged', icon: CheckCircle, variant: 'success' },
      in_transit: { color: 'bg-indigo-500', label: 'In Transit', icon: Truck, variant: 'info' },
      pending_reconciliation: { color: 'bg-orange-500', label: 'Pending Reconciliation', icon: Clock, variant: 'warning' },
      closed: { color: 'bg-emerald-600', label: 'Closed', icon: CheckCircle, variant: 'success' },
      cancelled: { color: 'bg-red-700', label: 'Cancelled', icon: XCircle, variant: 'destructive' },
      rejected: { color: 'bg-red-600', label: 'Rejected', icon: XCircle, variant: 'destructive' }
    };
    const c = config[status] || { color: 'bg-gray-500', label: status.replace(/_/g, ' '), icon: Clock, variant: 'secondary' };
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} text-white flex items-center gap-1 px-3 py-1.5 text-sm`}>
        <Icon className="h-3.5 w-3.5" />
        {c.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getProgressPercentage = () => {
    const statusOrder = [
      'draft',
      'pending_head_approval',
      'pending_gso_review',
      'pending_mayors_office',
      'with_mayors_office',
      'funds_issued',
      'acknowledged',
      'in_transit',
      'pending_reconciliation',
      'closed'
    ];
    const currentIndex = statusOrder.indexOf(ticket?.status);
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading trip ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Trip ticket not found</p>
          <Button onClick={() => navigate('/department/requests')} className="mt-4">
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/department/requests')}
              className="text-white/80 hover:text-white hover:bg-white/10 mb-4 -ml-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                    Trip Ticket
                  </Badge>
                  {ticket.submitted_by_head && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Building2 className="h-3 w-3 mr-1" />
                      Created by Head
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold font-mono">
                  {ticket.trip_ticket_number || 'Draft Ticket'}
                </h1>
                {ticket.submitted_at && (
                  <p className="text-slate-300 text-sm mt-1">
                    Submitted on {formatDateTime(ticket.submitted_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(ticket.status)}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="bg-white p-1 shadow-sm">
            <TabsTrigger value="details" className="data-[state=active]:bg-blue-50">
              Trip Details
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-blue-50">
              Status Timeline
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-blue-50">
              Financial Info
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trip Details Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Trip Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Trip Date</p>
                      <p className="font-semibold text-gray-800">{formatDate(ticket.trip_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Destination</p>
                      <p className="font-semibold text-gray-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {ticket.destination}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Purpose</p>
                    <p className="text-gray-700 mt-1">{ticket.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Charge To</p>
                    <p className="font-semibold text-gray-800">{ticket.charge_to}</p>
                  </div>
                  {ticket.passenger_name && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Passenger</p>
                      <p className="font-semibold text-gray-800">{ticket.passenger_name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">
                        {ticket.vehicle?.plate_number} - {ticket.vehicle?.vehicle_model}
                      </span>
                    </div>
                    {ticket.vehicle?.fuel_type && (
                      <p className="text-sm text-gray-500 mt-1">
                        Fuel Type: {ticket.vehicle.fuel_type.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Driver</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">
                        {ticket.driver?.user?.full_name || ticket.driver?.full_name || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">
                        {ticket.department?.name || user?.department_name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Ticket Created</p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(ticket.created_at || ticket.submitted_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Submitted */}
                  {ticket.submitted_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Send className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Submitted for Approval</p>
                        <p className="text-sm text-gray-500">{formatDateTime(ticket.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Head Approval */}
                  {ticket.head_approval && (
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full ${ticket.head_approval.decision === 'approved' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center flex-shrink-0`}>
                        {ticket.head_approval.decision === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          Head of Office - {ticket.head_approval.decision === 'approved' ? 'Approved' : 'Rejected'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(ticket.head_approval.reviewed_at)}
                          {ticket.head_approval.is_oic_action && (
                            <span className="ml-2 text-xs text-orange-500">(OIC Action)</span>
                          )}
                        </p>
                        {ticket.head_approval.review_note && (
                          <p className="text-sm text-gray-600 mt-1">Note: {ticket.head_approval.review_note}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* GSO Verification */}
                  {ticket.gso_verification && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">GSO Verified</p>
                        <p className="text-sm text-gray-500">{formatDateTime(ticket.gso_verification.verified_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Status */}
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Current Status</p>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Amount Released</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(ticket.amount_released || ticket.gas_slip?.amount_released)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Funding Source</p>
                    <p className="font-semibold text-gray-800">
                      {ticket.created_by_mo_user_id ? 'MO Funded (Emergency Fund)' : 'Department Budget'}
                    </p>
                  </div>
                  {ticket.gas_slip && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Gas Slip ID</p>
                      <p className="font-mono text-sm">{ticket.gas_slip.gas_slip_id}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {ticket.gas_slip.reconciliation_status}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estimated Costs */}
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fuel className="h-5 w-5 text-orange-600" />
                    Estimated Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Fuel</p>
                      <p className="font-semibold text-gray-800">
                        {ticket.estimated_fuel_liters || '—'} Liters
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Distance</p>
                      <p className="font-semibold text-gray-800">
                        {ticket.estimated_distance_km || '—'} KM
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Fuel prices are based on current market rates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripTicketDetail;