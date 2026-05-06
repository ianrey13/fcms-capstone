<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Driver;
use App\Models\TripTicket;
use App\Models\GasSlip;
use App\Models\FundIssuance;
use App\Models\GpsPing;
use App\Models\FuelLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DriverController extends Controller
{
    /**
     * Get assigned trips for the authenticated driver
     */
    public function getTrips(Request $request)
    {
        try {
            $user = $request->user();
            
            // Get the driver record for this user
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            // Get all trips assigned to this driver
            $trips = TripTicket::with(['vehicle', 'department', 'gasSlip'])
                ->where('driver_id', $driver->driver_id)
                ->whereIn('status', ['funds_issued', 'acknowledged', 'in_transit', 'pending_reconciliation', 'closed'])
                ->orderBy('trip_date', 'desc')
                ->get()
                ->map(function($ticket) {
                    return [
                        'trip_ticket_id' => $ticket->trip_ticket_id,
                        'trip_ticket_number' => $ticket->trip_ticket_number,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'trip_date' => $ticket->trip_date,
                        'status' => $ticket->status,
                        'estimated_fuel_liters' => $ticket->estimated_fuel_liters,
                        'estimated_distance_km' => $ticket->estimated_distance_km,
                        'vehicle' => $ticket->vehicle ? [
                            'vehicle_id' => $ticket->vehicle->vehicle_id,
                            'plate_number' => $ticket->vehicle->plate_number,
                            'vehicle_model' => $ticket->vehicle->vehicle_model,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => $trips
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get trips error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch trips: ' . $e->getMessage()
            ], 500);
        }
    }
    
/**
 * Get current active trip for the driver
 */
public function getActiveTrip(Request $request)
{
    try {
        $user = $request->user();
        
        Log::info('getActiveTrip called', ['user_id' => $user->user_id]);
        
        $driver = Driver::where('user_id', $user->user_id)->first();
        
        if (!$driver) {
            Log::warning('Driver not found', ['user_id' => $user->user_id]);
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found'
            ], 404);
        }
        
        Log::info('Driver found', ['driver_id' => $driver->driver_id]);
        
        // ✅ PRIORITY 1: Check for in_transit trip first (ongoing trip)
        $activeTrip = TripTicket::with(['vehicle', 'department', 'gasSlip', 'driver.user'])
            ->where('driver_id', $driver->driver_id)
            ->where('status', 'in_transit')
            ->orderBy('trip_ticket_id', 'desc')
            ->first();
        
        // ✅ PRIORITY 2: If no in_transit, check for acknowledged (ready to start)
        if (!$activeTrip) {
            $activeTrip = TripTicket::with(['vehicle', 'department', 'gasSlip', 'driver.user'])
                ->where('driver_id', $driver->driver_id)
                ->where('status', 'acknowledged')
                ->orderBy('trip_ticket_id', 'desc')
                ->first();
        }
        
        // ✅ PRIORITY 3: If no acknowledged, check for funds_issued (needs acknowledgment)
        if (!$activeTrip) {
            $activeTrip = TripTicket::with(['vehicle', 'department', 'gasSlip', 'driver.user'])
                ->where('driver_id', $driver->driver_id)
                ->where('status', 'funds_issued')
                ->orderBy('trip_ticket_id', 'desc')
                ->first();
        }
        
        if (!$activeTrip) {
            Log::info('No active trip found', ['driver_id' => $driver->driver_id]);
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No active trip'
            ]);
        }
        
        Log::info('Active trip found', [
            'trip_id' => $activeTrip->trip_ticket_id,
            'trip_number' => $activeTrip->trip_ticket_number,
            'status' => $activeTrip->status
        ]);
        
        return response()->json([
            'success' => true,
            'data' => [
                'trip_ticket_id' => $activeTrip->trip_ticket_id,
                'trip_ticket_number' => $activeTrip->trip_ticket_number,
                'destination' => $activeTrip->destination,
                'purpose' => $activeTrip->purpose,
                'trip_date' => $activeTrip->trip_date,
                'status' => $activeTrip->status,
                'charge_to' => $activeTrip->charge_to,
                'amount_released' => $activeTrip->gasSlip ? $activeTrip->gasSlip->amount_released : 0,
                'estimated_fuel_liters' => $activeTrip->estimated_fuel_liters,
                'estimated_distance_km' => $activeTrip->estimated_distance_km,
                'vehicle' => $activeTrip->vehicle ? [
                    'vehicle_id' => $activeTrip->vehicle->vehicle_id,
                    'plate_number' => $activeTrip->vehicle->plate_number,
                    'vehicle_model' => $activeTrip->vehicle->vehicle_model,
                    'fuel_type' => $activeTrip->vehicle->fuel_type,
                ] : null,
                'driver' => $activeTrip->driver && $activeTrip->driver->user ? [
                    'full_name' => $activeTrip->driver->user->full_name,
                ] : null,
                'department_name' => $activeTrip->department ? $activeTrip->department->department_name : null,
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('Get active trip error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch active trip: ' . $e->getMessage()
        ], 500);
    }
}
    
    /**
     * Acknowledge fund issuance (gas slip receipt)
     */
    public function acknowledgeFunds(Request $request, $id)
    {
        try {
            $user = $request->user();
            Log::info('acknowledgeFunds called', ['trip_id' => $id, 'user_id' => $user->user_id]);
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            if ($ticket->status !== 'funds_issued') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot acknowledge. Current status: ' . $ticket->status . '. Required: funds_issued'
                ], 400);
            }
            
            DB::beginTransaction();
            
            // Update ticket status
            $ticket->status = 'acknowledged';
            $ticket->save();
            
            // Update fund issuance acknowledgment
            $gasSlip = GasSlip::where('trip_ticket_id', $id)->first();
            if ($gasSlip) {
                $fundIssuance = FundIssuance::where('gas_slip_id', $gasSlip->gas_slip_id)->first();
                if ($fundIssuance) {
                    $fundIssuance->acknowledged_by = $user->user_id;
                    $fundIssuance->acknowledged_at = now();
                    $fundIssuance->save();
                }
            }
            
            DB::commit();
            
            Log::info('Gas slip acknowledged', ['trip_id' => $id, 'new_status' => $ticket->status]);
            
            return response()->json([
                'success' => true,
                'message' => 'Gas slip acknowledged successfully',
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'status' => $ticket->status
                ]
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Acknowledge funds error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to acknowledge: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Start trip and begin GPS tracking
     */
    public function startTrip(Request $request, $id)
    {
        try {
            $user = $request->user();
            Log::info('startTrip called', ['trip_id' => $id, 'user_id' => $user->user_id]);
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            Log::info('Trip found', [
                'trip_id' => $ticket->trip_ticket_id,
                'current_status' => $ticket->status
            ]);
            
            // ✅ FIX: Allow starting from 'acknowledged' status
            if ($ticket->status === 'in_transit') {
                // Trip already started - just return success
                Log::info('Trip already in progress', ['trip_id' => $id]);
                return response()->json([
                    'success' => true,
                    'message' => 'Trip already in progress',
                    'data' => [
                        'trip_ticket_id' => $ticket->trip_ticket_id,
                        'status' => $ticket->status
                    ]
                ]);
            }
            
            if ($ticket->status !== 'acknowledged') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot start trip. Current status: ' . $ticket->status . '. Required: acknowledged'
                ], 400);
            }
            
            $ticket->status = 'in_transit';
            $ticket->save();
            
            Log::info('Trip started successfully', [
                'trip_id' => $ticket->trip_ticket_id,
                'new_status' => $ticket->status
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Trip started successfully',
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'status' => $ticket->status
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Start trip error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to start trip: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Complete trip
     */
    public function completeTrip(Request $request, $id)
    {
        try {
            $user = $request->user();
            Log::info('completeTrip called', ['trip_id' => $id, 'user_id' => $user->user_id]);
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            Log::info('Trip found for completion', [
                'trip_id' => $ticket->trip_ticket_id,
                'current_status' => $ticket->status
            ]);
            
            // ✅ FIX: Allow completing from 'in_transit' status
            if ($ticket->status === 'pending_reconciliation') {
                // Already completed
                return response()->json([
                    'success' => true,
                    'message' => 'Trip already completed',
                    'data' => [
                        'trip_ticket_id' => $ticket->trip_ticket_id,
                        'status' => $ticket->status
                    ]
                ]);
            }
            
            if ($ticket->status !== 'in_transit') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot complete trip. Current status: ' . $ticket->status . '. Required: in_transit'
                ], 400);
            }
            
            $ticket->status = 'pending_reconciliation';
            $ticket->save();
            
            Log::info('Trip completed successfully', [
                'trip_id' => $ticket->trip_ticket_id,
                'new_status' => $ticket->status
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Trip completed successfully',
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'status' => $ticket->status
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Complete trip error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete trip: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Upload fuel receipt
     */
    public function uploadReceipt(Request $request, $id)
    {
        try {
            $request->validate([
                'receipt' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            ]);
            
            $user = $request->user();
            Log::info('uploadReceipt called', ['trip_id' => $id, 'user_id' => $user->user_id]);
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            // Store receipt image
            $file = $request->file('receipt');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('receipts', $filename, 'public');
            
            // Update gas slip with receipt path
            $gasSlip = GasSlip::where('trip_ticket_id', $id)->first();
            if ($gasSlip) {
                $gasSlip->receipt_photo_path = $path;
                $gasSlip->receipt_uploaded_at = now();
                $gasSlip->save();
            }
            
            Log::info('Receipt uploaded', ['trip_id' => $id, 'path' => $path]);
            
            return response()->json([
                'success' => true,
                'message' => 'Receipt uploaded successfully',
                'data' => [
                    'receipt_path' => $path
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Upload receipt error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload receipt: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update odometer readings
     */
    public function updateOdometer(Request $request, $id)
    {
        try {
            $request->validate([
                'odometer_out' => 'required|numeric',
                'odometer_in' => 'required|numeric',
            ]);
            
            $user = $request->user();
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            // Update fuel log with odometer readings
            $gasSlip = GasSlip::where('trip_ticket_id', $id)->first();
            if ($gasSlip) {
                $fuelLog = FuelLog::where('gas_slip_id', $gasSlip->gas_slip_id)->first();
                if ($fuelLog) {
                    $fuelLog->odometer_out = $request->odometer_out;
                    $fuelLog->odometer_in = $request->odometer_in;
                    $fuelLog->save();
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Odometer readings updated'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Update odometer error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update odometer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get gas slip details for a trip
     */
    public function getGasSlip(Request $request, $id)
    {
        try {
            $user = $request->user();
            Log::info('getGasSlip called', ['trip_id' => $id, 'user_id' => $user->user_id]);
            
            $driver = Driver::where('user_id', $user->user_id)->first();
            
            if (!$driver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Driver record not found'
                ], 404);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('driver_id', $driver->driver_id)
                ->first();
            
            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trip ticket not found'
                ], 404);
            }
            
            $gasSlip = GasSlip::where('trip_ticket_id', $id)->first();
            
            if (!$gasSlip) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gas slip not found'
                ], 404);
            }
            
            $fundIssuance = FundIssuance::where('gas_slip_id', $gasSlip->gas_slip_id)->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'trip_ticket_number' => $ticket->trip_ticket_number,
                    'destination' => $ticket->destination,
                    'trip_date' => $ticket->trip_date,
                    'purpose' => $ticket->purpose,
                    'charge_to' => $ticket->charge_to,
                    'vehicle' => $ticket->vehicle ? [
                        'plate_number' => $ticket->vehicle->plate_number,
                        'vehicle_model' => $ticket->vehicle->vehicle_model,
                        'fuel_type' => $ticket->vehicle->fuel_type,
                    ] : null,
                    'driver_name' => $driver->user ? $driver->user->full_name : null,
                    'amount_released' => $gasSlip->amount_released,
                    'issued_at' => $fundIssuance ? $fundIssuance->issued_at : null,
                    'acknowledged_at' => $fundIssuance ? $fundIssuance->acknowledged_at : null,
                    'status' => $ticket->status,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get gas slip error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch gas slip: ' . $e->getMessage()
            ], 500);
        }
    }
}