<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\GasSlip;
use App\Models\Notification;
use App\Models\User;
use App\Models\Department;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\FuelLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Helpers\NotificationHelper;

class GsoController extends Controller
{
    /**
     * Get GSO dashboard statistics
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->isGsoOffice()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'pending_mayors_office' => TripTicket::where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)->count(),
            'funds_issued' => TripTicket::where('status', TripTicket::STATUS_FUNDS_ISSUED)->count(),
            'in_transit' => TripTicket::where('status', TripTicket::STATUS_IN_TRANSIT)->count(),
            'pending_reconciliation' => TripTicket::where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
            'returned' => TripTicket::where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)->count(),
            'closed' => TripTicket::where('status', TripTicket::STATUS_CLOSED)->count(),
            'total_trips_this_month' => TripTicket::whereMonth('submitted_at', now()->month)->count(),
            'total_trips_this_year' => TripTicket::whereYear('submitted_at', now()->year)->count(),
            'total_budget_allocated' => DB::table('dept_budget_period')
                ->where('status', 'active')
                ->sum('allocated_amount'),
            'total_users' => User::count(),
            'total_vehicles' => Vehicle::count(),
            'total_departments' => Department::count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get pending tickets for Mayor's Office
     */
    public function getPendingTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $pendingTickets = TripTicket::with(['vehicle', 'department', 'submittedBy', 'driver.user'])
                ->where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)
                ->orderBy('submitted_at', 'asc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'charge_to' => $ticket->charge_to,
                        'passenger_name' => $ticket->passenger_name,
                        'submitted_at' => $ticket->submitted_at,
                        'status' => $ticket->status,
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'estimated_cost' => $ticket->estimated_fuel_liters ? 
                            ($ticket->estimated_fuel_liters * 88) : null,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                            'vehicle_model' => $ticket->vehicle->vehicle_model,
                        ] : null,
                        'driver' => $ticket->driver && $ticket->driver->user ? [
                            'full_name' => $ticket->driver->user->full_name,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'department_code' => $ticket->department ? $ticket->department->department_code : null,
                        'requester' => $ticket->submittedBy ? [
                            'full_name' => $ticket->submittedBy->full_name,
                        ] : null,
                        'is_staff_created' => $ticket->submitted_by_staff ?? false,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $pendingTickets,
                'meta' => [
                    'pending_count' => $pendingTickets->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get pending tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trips that need reconciliation
     */
    public function getPendingReconciliation(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $trips = TripTicket::with(['vehicle', 'department', 'driver.user', 'gasSlip'])
                ->where('status', TripTicket::STATUS_PENDING_RECONCILIATION)
                ->orderBy('submitted_at', 'asc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'status' => $ticket->status,
                        'submitted_at' => $ticket->submitted_at,
                        'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                        ] : null,
                        'driver' => $ticket->driver && $ticket->driver->user ? [
                            'full_name' => $ticket->driver->user->full_name,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $trips,
                'meta' => [
                    'total' => $trips->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get pending reconciliation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending reconciliation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get returned tickets
     */
    public function getReturnedTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $returnedTickets = TripTicket::with(['vehicle', 'department', 'submittedBy', 'returns'])
                ->where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($ticket) {
                    $latestReturn = $ticket->returns->sortByDesc('actioned_at')->first();
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'status' => $ticket->status,
                        'submitted_at' => $ticket->submitted_at,
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'return_reason' => $latestReturn ? $latestReturn->return_note : null,
                        'returned_at' => $latestReturn ? $latestReturn->actioned_at : null,
                        'requester' => $ticket->submittedBy ? [
                            'full_name' => $ticket->submittedBy->full_name,
                        ] : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $returnedTickets,
                'meta' => [
                    'returned_count' => $returnedTickets->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get returned tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch returned tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ FIXED: Get all trips (for GSO admin view)
     * GET /api/gso/all-trips
     */
    public function getAllTrips(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // ✅ Use get() instead of paginate() for frontend compatibility
            $trips = TripTicket::with([
                'department',
                'driver.user',
                'vehicle',
                'gasSlip'
            ])
            ->orderBy('submitted_at', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $trips
            ]);

        } catch (\Exception $e) {
            Log::error('Get all trips error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch trips: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single ticket details
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $ticket = TripTicket::with([
                'vehicle',
                'driver.user',
                'department',
                'submittedBy',
                'gasSlip',
                'vehicleSnapshot',
                'returns'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'trip_ticket_number' => $ticket->trip_ticket_number,
                    'trip_date' => $ticket->trip_date,
                    'destination' => $ticket->destination,
                    'purpose' => $ticket->purpose,
                    'charge_to' => $ticket->charge_to,
                    'passenger_name' => $ticket->passenger_name,
                    'status' => $ticket->status,
                    'submitted_at' => $ticket->submitted_at,
                    'submitted_by_staff' => $ticket->submitted_by_staff ?? false,
                    'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                    'budget_shortage' => $ticket->budget_shortage ?? 0,
                    'estimated_distance_km' => $ticket->estimated_distance_km,
                    'estimated_fuel_liters' => $ticket->estimated_fuel_liters,
                    'odometer_exception' => $ticket->odometer_exception ?? false,
                    'odometer_exception_note' => $ticket->odometer_exception_note,
                    'vehicle' => $ticket->vehicle ? [
                        'vehicle_id' => $ticket->vehicle->vehicle_id,
                        'plate_number' => $ticket->vehicle->plate_number,
                        'vehicle_model' => $ticket->vehicle->vehicle_model,
                        'fuel_type' => $ticket->vehicle->fuel_type,
                    ] : null,
                    'driver' => $ticket->driver && $ticket->driver->user ? [
                        'driver_id' => $ticket->driver->driver_id,
                        'full_name' => $ticket->driver->user->full_name,
                    ] : null,
                    'department' => $ticket->department ? [
                        'department_id' => $ticket->department->department_id,
                        'department_name' => $ticket->department->department_name,
                        'department_code' => $ticket->department->department_code,
                    ] : null,
                    'gas_slip' => $ticket->gasSlip ? [
                        'gas_slip_id' => $ticket->gasSlip->gas_slip_id,
                        'amount_released' => $ticket->gasSlip->amount_released,
                        'reconciliation_status' => $ticket->gasSlip->reconciliation_status,
                        'budget_before' => $ticket->gasSlip->budget_before,
                        'budget_after' => $ticket->gasSlip->budget_after,
                    ] : null,
                    'vehicle_snapshot' => $ticket->vehicleSnapshot ? [
                        'vehicle_status' => $ticket->vehicleSnapshot->vehicle_status,
                        'odometer_status' => $ticket->vehicleSnapshot->odometer_status,
                        'fuel_type' => $ticket->vehicleSnapshot->fuel_type,
                    ] : null,
                    'requester' => $ticket->submittedBy ? [
                        'user_id' => $ticket->submittedBy->user_id,
                        'full_name' => $ticket->submittedBy->full_name,
                    ] : null,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Show ticket error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ticket not found'
            ], 404);
        }
    }

    /**
     * Get GSO reports
     */
    public function getReports(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $stats = [
                'total_trips' => TripTicket::count(),
                'total_funds_released' => GasSlip::sum('amount_released'),
                'total_allocated_budget' => DB::table('dept_budget_period')
                    ->where('status', 'active')
                    ->sum('allocated_amount'),
                'total_budget_used' => GasSlip::sum('amount_released'),
                'pending_mo' => TripTicket::where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)->count(),
                'funds_issued' => TripTicket::where('status', TripTicket::STATUS_FUNDS_ISSUED)->count(),
                'in_transit' => TripTicket::where('status', TripTicket::STATUS_IN_TRANSIT)->count(),
                'closed' => TripTicket::where('status', TripTicket::STATUS_CLOSED)->count(),
                'rejected' => TripTicket::where('status', TripTicket::STATUS_REJECTED)->count(),
                'cancelled' => TripTicket::where('status', TripTicket::STATUS_CANCELLED)->count(),
                'this_month' => [
                    'trips' => TripTicket::whereMonth('submitted_at', now()->month)->count(),
                    'funds' => GasSlip::whereMonth('created_at', now()->month)->sum('amount_released'),
                ],
                'by_department' => DB::table('trip_ticket as tt')
                    ->join('departments as d', 'tt.department_id', '=', 'd.department_id')
                    ->select('d.department_name', DB::raw('COUNT(*) as count'))
                    ->groupBy('d.department_id', 'd.department_name')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Get reports error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reconcile a trip (close it)
     */
    public function reconcileTrip(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'reconciliation_note' => 'nullable|string|max:500',
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', TripTicket::STATUS_PENDING_RECONCILIATION)
                ->first();
            
            if (!$ticket) {
                return response()->json(['message' => 'Trip not found or not pending reconciliation'], 404);
            }
            
            // Update gas slip reconciliation status
            $gasSlip = GasSlip::where('trip_ticket_id', $id)->first();
            if ($gasSlip) {
                $gasSlip->reconciliation_status = 'verified';
                $gasSlip->reconciled_by = $user->user_id;
                $gasSlip->reconciled_at = now();
                $gasSlip->reconciliation_note = $request->reconciliation_note;
                $gasSlip->save();
            }
            
            // Update ticket status
            $ticket->status = TripTicket::STATUS_CLOSED;
            $ticket->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Trip reconciled and closed successfully',
                'data' => [
                    'trip_ticket_id' => $ticket->trip_ticket_id,
                    'status' => $ticket->status,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Reconcile trip error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reconcile trip: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get completed trips for GSO
     */
    public function getCompletedTrips(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $trips = TripTicket::with(['driver.user', 'department', 'gasSlip'])
                ->where('status', TripTicket::STATUS_CLOSED)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($ticket) {
                    $fuelLog = $ticket->gasSlip ? $ticket->gasSlip->fuelLog : null;
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'driver_name' => $ticket->driver?->user?->full_name,
                        'department_name' => $ticket->department?->department_name,
                        'amount_released' => $ticket->gasSlip?->amount_released,
                        'liters_used' => $fuelLog?->liters_availed,
                        'distance_km' => $fuelLog?->gps_distance_km ?? 
                                     ($fuelLog?->odometer_end - $fuelLog?->odometer_start),
                        'status' => $ticket->status,
                        'closed_at' => $ticket->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $trips,
                'total' => $trips->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Get completed trips error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch completed trips: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get fuel receipts for GSO
     */
    public function getFuelReceipts(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $receipts = DB::table('fuel_log as fl')
                ->join('gas_slip as gs', 'fl.gas_slip_id', '=', 'gs.gas_slip_id')
                ->join('trip_ticket as tt', 'gs.trip_ticket_id', '=', 'tt.trip_ticket_id')
                ->join('vehicles as v', 'tt.vehicle_id', '=', 'v.vehicle_id')
                ->join('users as u', 'tt.driver_id', '=', 'u.user_id')
                ->select(
                    'fl.fuel_log_id as id',
                    'tt.trip_ticket_id',
                    'tt.trip_ticket_number as ticket_number',
                    'v.plate_number',
                    'v.vehicle_model',
                    'fl.liters_availed as liters',
                    'fl.amount_on_receipt as amount',
                    'fl.receipt_photo_path as receipt_url',
                    'fl.receipt_uploaded_at as uploaded_at',
                    'fl.distance_calculation_method',
                    'fl.gps_distance_km',
                    'fl.odometer_start',
                    'fl.odometer_end',
                    'gs.reconciliation_status as status',
                    'tt.trip_date',
                    DB::raw("CONCAT(u.first_name, ' ', u.last_name) as driver_name")
                )
                ->orderBy('fl.created_at', 'desc')
                ->get()
                ->map(function ($receipt) {
                    if ($receipt->receipt_url && !str_starts_with($receipt->receipt_url, 'http')) {
                        $receipt->receipt_url = asset('storage/' . $receipt->receipt_url);
                    }
                    $receipt->amount = (float) $receipt->amount;
                    $receipt->liters = (float) $receipt->liters;
                    $receipt->gps_distance_km = $receipt->gps_distance_km ? (float) $receipt->gps_distance_km : null;
                    return $receipt;
                });

            return response()->json([
                'success' => true,
                'data' => $receipts,
                'total' => $receipts->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Get fuel receipts error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fuel receipts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single fuel receipt with details
     */
    public function getFuelReceipt($request, $id)
    {
        try {
            $user = $request->user();
            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $receipt = DB::table('fuel_log as fl')
                ->join('gas_slip as gs', 'fl.gas_slip_id', '=', 'gs.gas_slip_id')
                ->join('trip_ticket as tt', 'gs.trip_ticket_id', '=', 'tt.trip_ticket_id')
                ->join('vehicles as v', 'tt.vehicle_id', '=', 'v.vehicle_id')
                ->join('users as u_driver', 'tt.driver_id', '=', 'u_driver.user_id')
                ->join('users as u_submitter', 'tt.submitted_by', '=', 'u_submitter.user_id')
                ->leftJoin('departments as d', 'tt.department_id', '=', 'd.department_id')
                ->select(
                    'fl.fuel_log_id as id',
                    'tt.trip_ticket_id',
                    'tt.trip_ticket_number as ticket_number',
                    'v.plate_number',
                    'v.vehicle_model',
                    'v.fuel_type',
                    'd.department_name',
                    'fl.liters_availed as liters',
                    'fl.amount_on_receipt as amount',
                    'fl.receipt_photo_path as receipt_url',
                    'fl.receipt_uploaded_at as uploaded_at',
                    'fl.odometer_start',
                    'fl.odometer_end',
                    'fl.distance_calculation_method',
                    'fl.gps_distance_km',
                    'fl.trip_started_at',
                    'fl.trip_ended_at',
                    'fl.trip_elapsed_minutes',
                    'gs.amount_released',
                    'gs.reconciliation_status as status',
                    'gs.reconciliation_note',
                    'tt.trip_date',
                    'tt.destination',
                    'tt.purpose',
                    DB::raw("CONCAT(u_driver.first_name, ' ', u_driver.last_name) as driver_name"),
                    DB::raw("CONCAT(u_submitter.first_name, ' ', u_submitter.last_name) as submitted_by_name")
                )
                ->where('fl.fuel_log_id', $id)
                ->first();

            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt not found'
                ], 404);
            }

            if ($receipt->receipt_url && !str_starts_with($receipt->receipt_url, 'http')) {
                $receipt->receipt_url = asset('storage/' . $receipt->receipt_url);
            }

            return response()->json([
                'success' => true,
                'data' => $receipt
            ]);
        } catch (\Exception $e) {
            Log::error('Get fuel receipt error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fuel receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Record receipt (GSO manually records a receipt)
     */
    public function recordReceipt(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isGsoOffice()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'trip_ticket_id' => 'required|exists:trip_ticket,trip_ticket_id',
                'liters_availed' => 'required|numeric|min:0.01',
                'amount_on_receipt' => 'required|numeric|min:0.01',
                'receipt_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
                'odometer_start' => 'nullable|integer',
                'odometer_end' => 'nullable|integer',
                'gps_distance_km' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $gasSlip = GasSlip::where('trip_ticket_id', $request->trip_ticket_id)->first();
            if (!$gasSlip) {
                return response()->json(['message' => 'Gas slip not found for this trip'], 404);
            }

            DB::beginTransaction();

            $photoPath = null;
            if ($request->hasFile('receipt_photo')) {
                $file = $request->file('receipt_photo');
                $filename = 'receipt_' . time() . '_' . $request->trip_ticket_id . '.' . $file->getClientOriginalExtension();
                $photoPath = $file->storeAs('receipts', $filename, 'public');
            }

            $fuelLog = FuelLog::updateOrCreate(
                ['gas_slip_id' => $gasSlip->gas_slip_id],
                [
                    'liters_availed' => $request->liters_availed,
                    'amount_on_receipt' => $request->amount_on_receipt,
                    'receipt_photo_path' => $photoPath,
                    'odometer_start' => $request->odometer_start,
                    'odometer_end' => $request->odometer_end,
                    'gps_distance_km' => $request->gps_distance_km,
                    'distance_calculation_method' => $request->gps_distance_km ? 'gps' : 'manual_estimate',
                    'receipt_uploaded_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $gasSlip->reconciliation_status = 'pending';
            $gasSlip->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Receipt recorded successfully',
                'data' => [
                    'fuel_log_id' => $fuelLog->fuel_log_id,
                    'gas_slip_id' => $gasSlip->gas_slip_id,
                    'liters_availed' => $fuelLog->liters_availed,
                    'amount_on_receipt' => $fuelLog->amount_on_receipt,
                    'receipt_photo_path' => $photoPath ? asset('storage/' . $photoPath) : null,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Record receipt error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============ PRIVATE METHODS ============

    private function sendMoNotification($tripTicket)
    {
        Log::info('🔔🔔🔔 sendMoNotification CALLED', [
            'ticket_id' => $tripTicket->trip_ticket_id,
            'ticket_number' => $tripTicket->trip_ticket_number
        ]);
        
        $moStaff = User::where('role', 'mayors_office')
            ->where('status', 'active')
            ->get();
        
        Log::info('🔔 MO Staff found: ' . $moStaff->count());
        
        foreach ($moStaff as $staff) {
            Log::info('🔔 Sending to MO: ' . $staff->user_id);
            
            $result = NotificationHelper::send(
                $staff->user_id,
                'trip_created',
                'trip_ticket',
                $tripTicket->trip_ticket_id,
                "Trip ticket {$tripTicket->trip_ticket_number} is ready for fund release"
            );
            
            Log::info('📡 Result: ' . ($result ? 'SUCCESS' : 'FAILED'));
        }
    }

    private function sendStaffNotification($tripTicket)
    {
        NotificationHelper::send(
            $tripTicket->submitted_by,
            'trip_submitted',
            'trip_ticket',
            $tripTicket->trip_ticket_id,
            "Trip ticket {$tripTicket->trip_ticket_number} has been created and sent to Mayor's Office"
        );
    }

    private function sendRejectionNotification($tripTicket, $reason)
    {
        $deptOffice = User::find($tripTicket->submitted_by);

        if ($deptOffice) {
            Notification::create([
                'recipient_user_id' => $deptOffice->user_id,
                'notification_type' => 'gso_rejected',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Trip ticket {$tripTicket->trip_ticket_number} was rejected: {$reason}",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }
}