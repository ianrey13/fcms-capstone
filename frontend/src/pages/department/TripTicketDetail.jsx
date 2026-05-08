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
  Eye,
  CreditCard,
  Gauge,
  Route,
  CalendarDays,
  UserCheck,
  Shield,
  Info
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

  const getStatusConfig = (status) => {
    const configs = {
      draft: { color: 'bg-slate-500', label: 'Draft', icon: Clock, textColor: 'text-white' },
      pending_head_approval: { color: 'bg-purple-500', label: 'Pending Head Approval', icon: Clock, textColor: 'text-white' },
      pending_gso_review: { color: 'bg-amber-500', label: 'Pending GSO Review', icon: Clock, textColor: 'text-white' },
      returned_for_revision: { color: 'bg-red-500', label: 'Returned for Revision', icon: AlertCircle, textColor: 'text-white' },
      with_mayors_office: { color: 'bg-violet-500', label: "With Mayor's Office", icon: Building2, textColor: 'text-white' },
      pending_mayors_office: { color: 'bg-violet-500', label: "Pending Mayor's Office", icon: Clock, textColor: 'text-white' },
      funds_issued: { color: 'bg-emerald-500', label: 'Funds Issued', icon: DollarSign, textColor: 'text-white' },
      acknowledged: { color: 'bg-blue-500', label: 'Acknowledged', icon: CheckCircle, textColor: 'text-white' },
      in_transit: { color: 'bg-indigo-500', label: 'In Transit', icon: Truck, textColor: 'text-white' },
      pending_reconciliation: { color: 'bg-orange-500', label: 'Pending Reconciliation', icon: Clock, textColor: 'text-white' },
      closed: { color: 'bg-emerald-600', label: 'Closed', icon: CheckCircle, textColor: 'text-white' },
      cancelled: { color: 'bg-red-700', label: 'Cancelled', icon: XCircle, textColor: 'text-white' },
      rejected: { color: 'bg-red-600', label: 'Rejected', icon: XCircle, textColor: 'text-white' }
    };
    return configs[status] || { color: 'bg-slate-500', label: status?.replace(/_/g, ' '), icon: Clock, textColor: 'text-white' };
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} ${config.textColor} flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium shadow-sm`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading trip ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg">Trip ticket not found</p>
          <Button onClick={() => navigate('/department/requests')} className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700">
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;
  const isMoFunded = ticket.created_by_mo_user_id || ticket.is_mo_funded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Premium Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/department/requests')}
              className="text-white/80 hover:text-white hover:bg-white/10 mb-4 -ml-3 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="animate-fade-in-up">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Trip Ticket
                  </Badge>
                  {ticket.submitted_by_head && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Building2 className="h-3 w-3 mr-1" />
                      Created by Head
                    </Badge>
                  )}
                  {isMoFunded && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      <CreditCard className="h-3 w-3 mr-1" />
                      MO Funded (Emergency)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white/70" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold font-mono text-white tracking-tight">
                    {ticket.trip_ticket_number || 'Draft Ticket'}
                  </h1>
                </div>
                {ticket.submitted_at && (
                  <p className="text-slate-300 text-sm mt-2 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Submitted on {formatDateTime(ticket.submitted_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {getStatusBadge(ticket.status)}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200"
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
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Progress
            </span>
            <span className="font-medium">{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2 bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="bg-white dark:bg-slate-800 p-1 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="details" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/50 rounded-lg px-4">
              Trip Details
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/50 rounded-lg px-4">
              Status Timeline
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/50 rounded-lg px-4">
              Financial Info
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trip Details Card */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white">
                    <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Trip Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trip Date</p>
                      <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{formatDate(ticket.trip_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Destination</p>
                      <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {ticket.destination}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Purpose</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{ticket.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Charge To</p>
                    <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{ticket.charge_to}</p>
                  </div>
                  {ticket.passenger_name && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Passenger</p>
                      <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{ticket.passenger_name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Card */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white">
                    <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vehicle</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {ticket.vehicle?.plate_number} - {ticket.vehicle?.vehicle_model}
                        </p>
                        {ticket.vehicle?.fuel_type && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <Fuel className="h-3 w-3 inline mr-1" />
                            {ticket.vehicle.fuel_type.toUpperCase()} Fuel
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Driver</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {ticket.driver?.user?.full_name || ticket.driver?.full_name || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Department</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {ticket.department?.name || user?.department_name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="mt-6 animate-fade-in">
            <Card className="shadow-md border-slate-200 dark:border-slate-700 dark:bg-slate-800/80">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative space-y-6 before:absolute before:left-4 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {/* Created */}
                  <div className="relative flex items-start gap-4 pl-0">
                    <div className="relative z-10 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-slate-800 dark:text-white">Ticket Created</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDateTime(ticket.created_at || ticket.submitted_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Submitted */}
                  {ticket.submitted_at && (
                    <div className="relative flex items-start gap-4 pl-0">
                      <div className="relative z-10 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800">
                        <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-slate-800 dark:text-white">Submitted for Approval</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(ticket.submitted_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Head Approval */}
                  {ticket.head_approval && (
                    <div className="relative flex items-start gap-4 pl-0">
                      <div className={`relative z-10 w-9 h-9 rounded-full ${ticket.head_approval.decision === 'approved' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'} flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800`}>
                        {ticket.head_approval.decision === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          Head of Office - {ticket.head_approval.decision === 'approved' ? 'Approved' : 'Rejected'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDateTime(ticket.head_approval.reviewed_at)}
                          {ticket.head_approval.is_oic_action && (
                            <span className="ml-2 text-xs text-amber-500 dark:text-amber-400">(OIC Action)</span>
                          )}
                        </p>
                        {ticket.head_approval.review_note && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                            Note: {ticket.head_approval.review_note}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* GSO Verification */}
                  {ticket.gso_verification && (
                    <div className="relative flex items-start gap-4 pl-0">
                      <div className="relative z-10 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800">
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-slate-800 dark:text-white">GSO Verified</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(ticket.gso_verification.verified_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Status */}
                  <div className="relative flex items-start gap-4 pl-0">
                    <div className="relative z-10 w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-slate-800">
                      <StatusIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-slate-800 dark:text-white">Current Status</p>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="mt-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-xl p-4">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Amount Released</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                      {formatCurrency(ticket.amount_released || ticket.gas_slip?.amount_released)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Funding Source</p>
                    <div className="flex items-center gap-2 mt-1">
                      {isMoFunded ? (
                        <>
                          <CreditCard className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold text-amber-700 dark:text-amber-400">MO Funded (Emergency Fund)</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-blue-700 dark:text-blue-400">Department Budget</span>
                        </>
                      )}
                    </div>
                  </div>
                  {ticket.gas_slip && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gas Slip Information</p>
                      <p className="font-mono text-sm text-slate-700 dark:text-slate-300 mt-1">ID: {ticket.gas_slip.gas_slip_id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Status: <span className="capitalize">{ticket.gas_slip.reconciliation_status}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estimated Costs Card */}
              <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-white">
                    <Fuel className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Estimated Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Fuel className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-wide">Estimated Fuel</p>
                      </div>
                      <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {ticket.estimated_fuel_liters || '—'} <span className="text-sm font-normal">Liters</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Route className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-wide">Estimated Distance</p>
                      </div>
                      <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {ticket.estimated_distance_km || '—'} <span className="text-sm font-normal">KM</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium">Fuel Price Reference</p>
                        <p className="text-xs mt-1">Fuel prices are based on current market rates from system settings.</p>
                      </div>
                    </div>
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