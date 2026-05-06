import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mayorsOfficeAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, MapPin, User, Truck, DollarSign, Printer } from 'lucide-react';
import municipalLogo from '../../assets/img/465557735_866766092283213_5502511239926698684_n.svg';
import bagongPilipinasLogo from '../../assets/img/Bagong_Pilipinas_Logo.svg.png';

const MayorTripTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await mayorsOfficeAPI.getTicketById(id);
      console.log('Ticket response:', response.data);
      const data = response.data?.data || response.data;
      setTicket(data);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      setError(error.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trip Ticket - ${ticket?.trip_ticket_number || ''}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: portrait; margin: 0.5in; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', 'Georgia', 'Serif';
              background: white;
              font-size: 11px;
            }
            .trip-ticket-container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header-banner {
              background: linear-gradient(135deg, #2d5a3f 0%, #4a7c59 50%, #2d5a3f 100%);
              padding: 10px 15px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #1a1a1a;
            }
            .logo-left, .logo-right {
              width: 55px;
              height: 55px;
              background: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              border: 2px solid #ffd700;
            }
            .logo-left img, .logo-right img { width: 100%; height: 100%; object-fit: contain; }
            .header-text { text-align: center; flex: 1; color: white; }
            .header-text .republic { font-size: 9px; letter-spacing: 1px; margin-bottom: 2px; }
            .header-text .province { font-size: 10px; font-weight: bold; margin-bottom: 1px; }
            .header-text .municipality { font-size: 11px; font-weight: bold; margin-bottom: 1px; }
            .header-text .office { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
            .title-box { background: #d4c5b5; border-bottom: 2px solid #1a1a1a; text-align: center; padding: 6px; }
            .title-box h1 { font-size: 18px; font-weight: bold; letter-spacing: 3px; color: #1a1a1a; margin: 0; }
            .content { padding: 15px 20px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; font-size: 12px; border-bottom: 1px solid #000; margin-bottom: 8px; padding-bottom: 3px; }
            .row { display: flex; margin-bottom: 6px; }
            .label { width: 150px; font-weight: bold; }
            .value { flex: 1; border-bottom: 1px solid #ccc; padding-left: 5px; }
            .two-column { display: flex; gap: 20px; margin-bottom: 10px; }
            .column { flex: 1; }
            .amount-box { background: #e8f5e9; padding: 10px; text-align: center; border-radius: 5px; margin-top: 10px; }
            .amount-label { font-size: 11px; color: #2e7d32; }
            .amount-value { font-size: 18px; font-weight: bold; color: #2e7d32; }
            .approvals { display: flex; justify-content: space-between; margin-top: 15px; }
            .approval-item { text-align: center; flex: 1; }
            .signature-line { border-top: 1px solid #000; width: 150px; margin: 5px auto 0; padding-top: 3px; }
            .footer { margin-top: 20px; text-align: center; font-size: 8px; border-top: 1px solid #ccc; padding-top: 8px; }
            @media print { body { margin: 0; padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="trip-ticket-container">
            <!-- Header with Logos -->
            <div class="header-banner">
              <div class="logo-left"><img src="${municipalLogo}" alt="Municipal Logo" /></div>
              <div class="header-text">
                <div class="republic">REPUBLIC OF THE PHILIPPINES</div>
                <div class="province">PROVINCE OF MISAMIS ORIENTAL</div>
                <div class="municipality">MUNICIPALITY OF LAGUINDINGAN</div>
                <div class="office">GENERAL SERVICES OFFICE</div>
              </div>
              <div class="logo-right"><img src="${bagongPilipinasLogo}" alt="Bagong Pilipinas Logo" /></div>
            </div>
            
            <div class="title-box">
              <h1>DRIVER'S TRIP TICKET</h1>
            </div>
            
            <div class="content">
              <!-- Trip Information -->
              <div class="section">
                <div class="section-title">TRIP INFORMATION</div>
                <div class="row">
                  <div class="label">Trip Ticket #</div>
                  <div class="value">${ticket?.trip_ticket_number || ''}</div>
                </div>
                <div class="row">
                  <div class="label">Date</div>
                  <div class="value">${ticket?.trip_date ? new Date(ticket.trip_date).toLocaleDateString() : ''}</div>
                </div>
                <div class="row">
                  <div class="label">Destination</div>
                  <div class="value">${ticket?.destination || ''}</div>
                </div>
                <div class="row">
                  <div class="label">Purpose of Travel</div>
                  <div class="value">${ticket?.purpose || ''}</div>
                </div>
                <div class="row">
                  <div class="label">Charge to Project/Office</div>
                  <div class="value">${ticket?.charge_to || ''}</div>
                </div>
              </div>

              <!-- Assignment -->
              <div class="section">
                <div class="section-title">ASSIGNMENT</div>
                <div class="row">
                  <div class="label">Name of Driver</div>
                  <div class="value">${ticket?.driver?.user?.full_name || ticket?.driver?.full_name || 'N/A'}</div>
                </div>
                <div class="row">
                  <div class="label">Government Car Used & Plate #</div>
                  <div class="value">${ticket?.vehicle?.vehicle_model || ''} / ${ticket?.vehicle?.plate_number || ''}</div>
                </div>
                <div class="row">
                  <div class="label">Name of Authorized Passenger</div>
                  <div class="value">${ticket?.passenger_name || 'N/A'}</div>
                </div>
              </div>

              <!-- Amount Released -->
              ${ticket?.gas_slip?.amount_released > 0 ? `
              <div class="amount-box">
                <div class="amount-label">AMOUNT RELEASED</div>
                <div class="amount-value">₱${ticket.gas_slip.amount_released.toLocaleString()}</div>
              </div>
              ` : ''}

              <!-- Approvals -->
              <div class="approvals">
                <div class="approval-item">
                  <div>Head of Office</div>
                  <div class="signature-line"></div>
                  <div style="font-size:9px; margin-top:3px;">${ticket?.latest_head_approval?.approved_by?.full_name || 'Pending'}</div>
                </div>
                <div class="approval-item">
                  <div>GSO Verified</div>
                  <div class="signature-line"></div>
                  <div style="font-size:9px; margin-top:3px;">${ticket?.latest_gso_verification?.verified_by?.full_name || 'Pending'}</div>
                </div>
                <div class="approval-item">
                  <div>Mayor's Office</div>
                  <div class="signature-line"></div>
                  <div style="font-size:9px; margin-top:3px;">${ticket?.latest_mo_review?.reviewed_by?.full_name || 'Pending'}</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>I HEREBY CERTIFY for the correctness of the above statement records travel.</p>
              <p>This trip ticket is valid only for the specified vehicle and driver.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusBadge = (status) => {
    const config = {
      funds_issued: { color: 'bg-green-500', label: 'Funds Issued' },
      in_transit: { color: 'bg-blue-500', label: 'In Transit' },
      closed: { color: 'bg-gray-500', label: 'Closed' },
      pending_reconciliation: { color: 'bg-yellow-500', label: 'Pending Reconciliation' },
      with_mayors_office: { color: 'bg-orange-500', label: 'Pending Fund Release' },
    };
    const c = config[status] || { color: 'bg-gray-500', label: status?.replace(/_/g, ' ') || 'Unknown' };
    return <Badge className={`${c.color} text-white`}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate('/mo/approved')} className="mt-4">
          Back to Approved
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trip ticket not found</p>
        <Button onClick={() => navigate('/mo/approved')} className="mt-4">
          Back to Approved
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 no-print">
        <Button variant="ghost" onClick={() => navigate('/mo/approved')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Ticket
        </Button>
      </div>

      {/* Screen View Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Trip Ticket Details</span>
            {getStatusBadge(ticket.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ticket Number</p>
              <p className="font-semibold">{ticket.trip_ticket_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trip Date</p>
              <p className="font-semibold">{new Date(ticket.trip_date).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-semibold">{ticket.destination}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Purpose</p>
              <p className="font-semibold">{ticket.purpose}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Charge To</p>
              <p className="font-semibold">{ticket.charge_to}</p>
            </div>
            {ticket.passenger_name && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Passenger</p>
                <p className="font-semibold">{ticket.passenger_name}</p>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-semibold">{ticket.driver?.user?.full_name || ticket.driver?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-semibold">{ticket.vehicle?.plate_number} - {ticket.vehicle?.vehicle_model}</p>
              </div>
            </div>
          </div>

          {/* Amount Released */}
          {ticket.gas_slip?.amount_released > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Financial Information</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">Amount Released</p>
                <p className="text-2xl font-bold text-green-700">
                  ₱{ticket.gas_slip.amount_released.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Approvals */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Approvals</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Head of Office</p>
                <p className="font-semibold">{ticket.latest_head_approval?.approved_by?.full_name || 'Pending'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GSO Verified</p>
                <p className="font-semibold">{ticket.latest_gso_verification?.verified_by?.full_name || 'Pending'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mayor's Office</p>
                <p className="font-semibold">{ticket.latest_mo_review?.reviewed_by?.full_name || 'Pending'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MayorTripTicketDetail;