<?php

namespace App\Http\Controllers\API;

use Illuminate\Support\Facades\Cache;

use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\GasSlip;
use App\Models\FundIssuance;
use App\Models\MoReview;
use App\Models\DeptBudgetPeriod;
use App\Models\Notification;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Department;
use App\Models\TripTicketVehicleSnapshot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class MayorsOfficeController extends Controller
{
    /**
     * Get Mayor's Office dashboard statistics
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'pending_fund_release' => TripTicket::where('status', 'with_mayors_office')->count(),
            'funds_issued' => TripTicket::where('status', TripTicket::STATUS_FUNDS_ISSUED)->count(),
            'total_amount_released' => FundIssuance::sum('amount_released'),
            'pending_reconciliation' => TripTicket::where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
            'pending_budget_assistance' => $this->getPendingBudgetAssistanceCount(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get pending budget assistance requests count
     */
    private function getPendingBudgetAssistanceCount()
    {
        $requestIds = Cache::get('mo_requests_list', []);
        return count($requestIds);
    }

    /**
     * Get pending tickets for fund release (with_mayors_office status)
     */
    public function getPendingTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $tickets = TripTicket::with(['vehicle', 'department', 'driver.user'])
                ->where('status', 'with_mayors_office')
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
                        'status' => $ticket->status,
                        'submitted_at' => $ticket->submitted_at,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                            'vehicle_model' => $ticket->vehicle->vehicle_model,
                            'fuel_type' => $ticket->vehicle->fuel_type,
                        ] : null,
                        'driver' => $ticket->driver && $ticket->driver->user ? [
                            'full_name' => $ticket->driver->user->full_name,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'department_code' => $ticket->department ? $ticket->department->department_code : null,
                        'is_mo_funded' => $ticket->created_by_mo_user_id !== null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tickets
            ]);
        } catch (\Exception $e) {
            Log::error('Get pending tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approved/funds issued tickets
     */
    public function getApprovedTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $tickets = TripTicket::with(['vehicle', 'department', 'gasSlip'])
                ->where('status', TripTicket::STATUS_FUNDS_ISSUED)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'status' => $ticket->status,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                        'gas_slip_number' => $ticket->gasSlip ? $ticket->gasSlip->gas_slip_number : null,
                        'is_mo_funded' => $ticket->created_by_mo_user_id !== null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tickets
            ]);
        } catch (\Exception $e) {
            Log::error('Get approved tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approved tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve ticket and release funds - WITH BUDGET VALIDATION
     */
    public function approveTicket(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount_released' => 'required|numeric|min:0.01',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = $request->user();

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', 'with_mayors_office')
                ->first();

            if (!$ticket) {
                return response()->json(['message' => 'Ticket not found or not eligible for fund release'], 404);
            }

            $amountToRelease = $request->amount_released;
            $departmentId = $ticket->department_id;

            // ✅ CHECK BUDGET IF NOT MO-FUNDED
            $isMoFundedTicket = $ticket->created_by_mo_user_id !== null;

            if (!$isMoFundedTicket) {
                // Get current active budget period
                $currentPeriod = DeptBudgetPeriod::where('department_id', $departmentId)
                    ->where('status', 'active')
                    ->first();

                if (!$currentPeriod) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No active budget period found for this department'
                    ], 400);
                }

                // Calculate remaining budget
                $totalSpent = FundIssuance::where('period_id', $currentPeriod->period_id)
                    ->sum('amount_released');

                $remainingBudget = $currentPeriod->allocated_amount - $totalSpent;

                // ✅ CHECK IF SUFFICIENT BUDGET
                if ($remainingBudget < $amountToRelease) {
                    $shortage = $amountToRelease - $remainingBudget;

                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient department budget',
                        'budget_info' => [
                            'allocated' => $currentPeriod->allocated_amount,
                            'spent' => $totalSpent,
                            'remaining' => $remainingBudget,
                            'requested' => $amountToRelease,
                            'shortage' => $shortage,
                            'is_negative' => $remainingBudget < 0,
                        ],
                        'suggestions' => [
                            'reduce_amount' => "Please reduce the amount to ₱" . number_format($remainingBudget, 2),
                            'use_mo_funded' => 'Or create an MO-funded trip ticket instead',
                        ]
                    ], 422);
                }
            }

            DB::beginTransaction();

            // Get current review cycle
            $lastCycle = MoReview::where('trip_ticket_id', $id)->max('review_cycle') ?? 0;
            $reviewCycle = $lastCycle + 1;

            // Create MO review record
            MoReview::create([
                'trip_ticket_id' => $id,
                'review_cycle' => $reviewCycle,
                'reviewed_by' => $user->user_id,
                'decision' => 'approved',
                'review_note' => $request->review_note,
                'reviewed_at' => now(),
            ]);

            // Create gas slip
            $gasSlip = GasSlip::create([
                'trip_ticket_id' => $id,
                'created_by' => $user->user_id,
                'amount_released' => $amountToRelease,
                'reconciliation_status' => 'pending',
                'created_at' => now(),
            ]);

            // Only deduct from department budget if NOT MO-funded
            if (!$isMoFundedTicket) {
                $budgetPeriod = DeptBudgetPeriod::where('department_id', $departmentId)
                    ->where('status', 'active')
                    ->first();

                if ($budgetPeriod) {
                    // Get budget before release
                    $totalSpent = FundIssuance::where('period_id', $budgetPeriod->period_id)
                        ->sum('amount_released');
                    $budgetBefore = $budgetPeriod->allocated_amount - $totalSpent;
                    $budgetAfter = $budgetBefore - $amountToRelease;

                    // Create fund issuance
                    FundIssuance::create([
                        'gas_slip_id' => $gasSlip->gas_slip_id,
                        'period_id' => $budgetPeriod->period_id,
                        'issued_by' => $user->user_id,
                        'amount_released' => $amountToRelease,
                        'budget_before' => $budgetBefore,
                        'budget_after' => $budgetAfter,
                        'issued_at' => now(),
                    ]);
                }
            }

            // Update ticket status
            $ticket->status = TripTicket::STATUS_FUNDS_ISSUED;
            $ticket->save();

            DB::commit();

            // Send notification to driver
            $fundingSource = $isMoFundedTicket ? 'MO Funded' : 'Department Budget';
            $this->sendFundIssuedNotification($ticket, $amountToRelease, $fundingSource);

            $responseMessage = $isMoFundedTicket
                ? "Funds released successfully (MO Funded - No department budget deduction)"
                : "Funds released successfully";

            return response()->json([
                'success' => true,
                'message' => $responseMessage,
                'data' => [
                    'ticket_id' => $ticket->trip_ticket_id,
                    'ticket_number' => $ticket->trip_ticket_number,
                    'amount_released' => $amountToRelease,
                    'gas_slip_id' => $gasSlip->gas_slip_id,
                    'status' => $ticket->status,
                    'funding_source' => $fundingSource,
                    'is_mo_funded' => $isMoFundedTicket,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Approve ticket error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to release funds: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject ticket
     */
    public function rejectTicket(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'review_note' => 'required|string|min:5'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $ticket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', 'with_mayors_office')
                ->first();

            if (!$ticket) {
                return response()->json(['message' => 'Ticket not found'], 404);
            }

            DB::beginTransaction();

            // Get current review cycle
            $lastCycle = MoReview::where('trip_ticket_id', $id)->max('review_cycle') ?? 0;
            $reviewCycle = $lastCycle + 1;

            // Create MO review record
            MoReview::create([
                'trip_ticket_id' => $id,
                'review_cycle' => $reviewCycle,
                'reviewed_by' => $user->user_id,
                'decision' => 'rejected',
                'review_note' => $request->review_note,
                'reviewed_at' => now(),
            ]);

            // Update ticket status
            $ticket->status = TripTicket::STATUS_RETURNED_FOR_REVISION;
            $ticket->save();

            DB::commit();

            // Send notification to department
            $this->sendRejectionNotification($ticket, $request->review_note);

            return response()->json([
                'success' => true,
                'message' => 'Ticket rejected and returned to department',
                'data' => [
                    'id' => $ticket->trip_ticket_id,
                    'number' => $ticket->trip_ticket_number,
                    'status' => $ticket->status,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Reject ticket error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject ticket: ' . $e->getMessage()
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

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $ticket = TripTicket::with([
                'vehicle',
                'driver.user',
                'department',
                'submittedBy',
                'latestHeadApproval.approvedBy',
                'latestGsoVerification.verifiedBy',
                'gasSlip',
                'vehicleSnapshot'
            ])->findOrFail($id);

            // Add budget info
            $budgetInfo = $this->getDepartmentBudgetInfo($ticket->department_id);

            // Add MO funded flag
            $ticketData = $ticket->toArray();
            $ticketData['is_mo_funded'] = $ticket->created_by_mo_user_id !== null;
            $ticketData['budget_info'] = $budgetInfo;

            return response()->json([
                'success' => true,
                'data' => $ticketData
            ]);
        } catch (\Exception $e) {
            Log::error('Show ticket error: ' . $e->getMessage());
            return response()->json(['message' => 'Ticket not found'], 404);
        }
    }

    /**
     * Get budget overview
     */
    public function getBudgetOverview(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isMayorsOffice() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $budgetData = DeptBudgetPeriod::with('department')
                ->where('status', 'active')
                ->get()
                ->map(function ($period) {
                    $spent = $period->fundIssuances()->sum('amount_released');
                    $remaining = $period->allocated_amount - $spent;
                    return [
                        'department_id' => $period->department_id,
                        'department_name' => $period->department->department_name,
                        'allocated_amount' => $period->allocated_amount,
                        'spent_amount' => $spent,
                        'remaining_amount' => $remaining,
                        'is_negative' => $remaining < 0,
                        'week_start' => $period->week_start,
                        'week_end' => $period->week_end,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $budgetData
            ]);
        } catch (\Exception $e) {
            Log::error('Get budget overview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget overview'
            ], 500);
        }
    }
    
    // ============ BUDGET ASSISTANCE / MO FUNDED TRIP METHODS ============

    /**
     * Get all pending budget assistance requests
     */
    public function getBudgetAssistanceRequests(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Mayor\'s Office and Super Admin can access this.'
                ], 403);
            }

            // ✅ Get from Cache instead of Session
            $requestIds = Cache::get('mo_requests_list', []);
            $requests = [];

            foreach ($requestIds as $requestId) {
                $requestData = Cache::get($requestId);
                if ($requestData) {
                    $department = Department::find($requestData['department_id']);
                    $requester = User::find($requestData['requested_by']);

                    $requests[] = [
                        'request_id' => $requestId,
                        'department_id' => $requestData['department_id'],
                        'department_name' => $department ? $department->department_name : 'Unknown',
                        'department_code' => $department ? $department->department_code : 'N/A',
                        'requester_name' => $requester ? $requester->full_name : 'Unknown',
                        'ticket_data' => $requestData['ticket_data'],
                        'budget_info' => $requestData['budget_info'],
                        'estimated_cost' => $requestData['estimated_cost'],
                        'shortage' => round($requestData['estimated_cost'] - $requestData['budget_info']['remaining'], 2),
                        'created_at' => $requestData['created_at'],
                    ];
                }
            }

            // Sort by created_at descending
            usort($requests, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'data' => $requests,
                'total' => count($requests)
            ]);
        } catch (\Exception $e) {
            Log::error('Get budget assistance requests error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get single budget assistance request details
     */
    public function getBudgetAssistanceRequest($requestId)
    {
        try {
            $user = auth()->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $requestData = session()->get($requestId);

            if (!$requestData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or expired'
                ], 404);
            }

            $department = Department::find($requestData['department_id']);
            $requester = User::find($requestData['requested_by']);

            // Get available vehicles and drivers for the department
            $vehicles = Vehicle::where('department_id', $requestData['department_id'])
                ->where('status', 'active')
                ->get();

            $drivers = Driver::whereHas('user', function ($q) use ($requestData) {
                $q->where('department_id', $requestData['department_id'])
                    ->where('status', 'active');
            })->with('user')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'request_id' => $requestId,
                    'department' => $department ? [
                        'id' => $department->department_id,
                        'name' => $department->department_name,
                        'code' => $department->department_code,
                    ] : null,
                    'requester' => $requester ? $requester->full_name : null,
                    'ticket_data' => $requestData['ticket_data'],
                    'budget_info' => $requestData['budget_info'],
                    'estimated_cost' => $requestData['estimated_cost'],
                    'shortage' => round($requestData['estimated_cost'] - $requestData['budget_info']['remaining'], 2),
                    'created_at' => $requestData['created_at'],
                    'available_vehicles' => $vehicles,
                    'available_drivers' => $drivers,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get budget assistance request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get request details'
            ], 500);
        }
    }

    /**
     * Create MO-funded trip ticket from a budget assistance request
     */
    public function createMoFundedTicket(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'request_id' => 'required|string',
                'charge_to' => 'required|string|max:120',
                'mo_note' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // ✅ Get from Cache
            $requestData = Cache::get($request->request_id);

            if (!$requestData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or expired. Please ask the department to resubmit.'
                ], 404);
            }

            $ticketData = $requestData['ticket_data'];

            DB::beginTransaction();

            // Generate ticket number
            $yearMonth = date('Y-m');
            $lastTicket = TripTicket::where('trip_ticket_number', 'like', $yearMonth . '-%')
                ->orderBy('trip_ticket_id', 'desc')
                ->first();

            if ($lastTicket) {
                preg_match('/' . $yearMonth . '-(\d+)/', $lastTicket->trip_ticket_number, $matches);
                $seq = isset($matches[1]) ? intval($matches[1]) + 1 : 1;
            } else {
                $seq = 1;
            }

            $ticketNumber = $yearMonth . '-' . str_pad($seq, 3, '0', STR_PAD_LEFT);

            // Create trip ticket - MO funded
            $tripTicket = TripTicket::create([
                'trip_ticket_number' => $ticketNumber,
                'department_id' => $requestData['department_id'],
                'driver_id' => $ticketData['driver_id'],
                'vehicle_id' => $ticketData['vehicle_id'],
                'submitted_by' => $user->user_id,
                'created_by_mo_user_id' => $user->user_id,
                'submitted_by_head' => true,
                'trip_date' => $ticketData['trip_date'],
                'purpose' => $ticketData['purpose'],
                'destination' => $ticketData['destination'],
                'charge_to' => $request->charge_to,
                'passenger_name' => $ticketData['passenger_name'] ?? null,
                'status' => TripTicket::STATUS_FUNDS_ISSUED,
                'submitted_at' => now(),
            ]);

            // Create vehicle snapshot
            $vehicle = Vehicle::find($ticketData['vehicle_id']);
            if ($vehicle) {
                TripTicketVehicleSnapshot::create([
                    'trip_ticket_id' => $tripTicket->trip_ticket_id,
                    'vehicle_status' => $vehicle->status,
                    'odometer_status' => $vehicle->odometer_status,
                    'fuel_type' => $vehicle->fuel_type,
                    'snapshot_taken_at' => now(),
                ]);
            }

            // Create gas slip
            $estimatedCost = $requestData['estimated_cost'];
            $gasSlip = GasSlip::create([
                'trip_ticket_id' => $tripTicket->trip_ticket_id,
                'created_by' => $user->user_id,
                'amount_released' => $estimatedCost,
                'reconciliation_status' => 'pending',
                'created_at' => now(),
            ]);

            // ✅ Remove from Cache
            Cache::forget($request->request_id);

            $keys = Cache::get('mo_requests_list', []);
            $keys = array_diff($keys, [$request->request_id]);
            Cache::put('mo_requests_list', $keys, now()->addHours(24));

            DB::commit();

            // Send notifications
            $this->notifyDriverOfMOTrip($tripTicket, $estimatedCost, $request->charge_to);
            $this->notifyDepartmentOfMOTrip($tripTicket, $request->charge_to, $request->mo_note);

            return response()->json([
                'success' => true,
                'message' => 'MO-funded trip ticket created successfully! Driver can start the trip.',
                'data' => [
                    'trip_ticket_id' => $tripTicket->trip_ticket_id,
                    'trip_ticket_number' => $ticketNumber,
                    'gas_slip_id' => $gasSlip->gas_slip_id,
                    'amount_released' => $estimatedCost,

                    'charge_to' => $request->charge_to,
                    'status' => $tripTicket->status,
                    'is_mo_funded' => true,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('MO create ticket error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Notify driver of MO-funded trip
     */
    private function notifyDriverOfMOTrip($tripTicket, $amount, $chargeTo)
    {
        $driver = $tripTicket->driver && $tripTicket->driver->user ? $tripTicket->driver->user : null;

        if ($driver) {
            Notification::create([
                'recipient_user_id' => $driver->user_id,
                'notification_type' => 'fund_issued',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Funds of ₱{$amount} have been released for trip ticket {$tripTicket->trip_ticket_number} (MO Funded)\n\n" .
                    "Charge To: {$chargeTo}\n" .
                    "You may start your trip.",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }





    /**
     * Get department budget info helper
     */
    private function getDepartmentBudgetInfo($departmentId)
    {
        $currentPeriod = DeptBudgetPeriod::where('department_id', $departmentId)
            ->where('status', 'active')
            ->first();

        if (!$currentPeriod) {
            return [
                'allocated' => 0,
                'spent' => 0,
                'remaining' => 0,
                'has_period' => false,
            ];
        }

        $totalSpent = FundIssuance::where('period_id', $currentPeriod->period_id)
            ->sum('amount_released');

        return [
            'allocated' => $currentPeriod->allocated_amount,
            'spent' => $totalSpent,
            'remaining' => $currentPeriod->allocated_amount - $totalSpent,
            'has_period' => true,
            'period_id' => $currentPeriod->period_id,
        ];
    }

    /**
     * Notify department that MO created the ticket
     */
    private function notifyDepartmentOfMOTicket($tripTicket, $chargeTo, $moNote)
    {
        $departmentStaff = User::where('department_id', $tripTicket->department_id)
            ->where('role', 'dept_office')
            ->where('status', 'active')
            ->get();

        $message = "✅ Mayor's Office has created a trip ticket for your department.\n\n" .
            "Ticket #: {$tripTicket->trip_ticket_number}\n" .
            "Charge To: {$chargeTo}\n" .
            "This trip is funded by Mayor's Office (no budget deduction from your department).";

        if ($moNote) {
            $message .= "\n\nMO Note: {$moNote}";
        }

        foreach ($departmentStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'mo_created_ticket',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => $message,
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Notify GSO of new ticket
     */
    private function notifyGSOOfNewTicket($tripTicket)
    {
        $gsoStaff = User::where('role', 'gso_staff')
            ->where('status', 'active')
            ->get();

        $fundingNote = $tripTicket->created_by_mo_user_id ? ' (MO Funded)' : '';

        foreach ($gsoStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'trip_submitted',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Trip ticket {$tripTicket->trip_ticket_number}{$fundingNote} is ready for GSO review",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Send fund issued notification to driver
     */
    private function sendFundIssuedNotification($ticket, $amount, $fundingSource = 'Department Budget')
    {
        $driver = $ticket->driver && $ticket->driver->user ? $ticket->driver->user : null;

        if ($driver) {
            Notification::create([
                'recipient_user_id' => $driver->user_id,
                'notification_type' => 'fund_issued',
                'entity_type' => 'trip_ticket',
                'entity_id' => $ticket->trip_ticket_id,
                'message' => "Funds of ₱{$amount} have been released for trip ticket {$ticket->trip_ticket_number} ({$fundingSource})",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Send rejection notification to department
     */
    private function sendRejectionNotification($ticket, $reason)
    {
        $deptOffice = User::find($ticket->submitted_by);

        if ($deptOffice) {
            Notification::create([
                'recipient_user_id' => $deptOffice->user_id,
                'notification_type' => 'mo_rejected',
                'entity_type' => 'trip_ticket',
                'entity_id' => $ticket->trip_ticket_id,
                'message' => "Trip ticket {$ticket->trip_ticket_number} was rejected by Mayor's Office: {$reason}",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Remove MO request from session after processing
     */
    
    public function removeMORequest($requestId)
    {
        try {
            $user = auth()->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            // ✅ Remove from Cache
            Cache::forget($requestId);

            $keys = Cache::get('mo_requests_list', []);
            $keys = array_diff($keys, [$requestId]);
            Cache::put('mo_requests_list', $keys, now()->addHours(24));

            return response()->json([
                'success' => true,
                'message' => 'Request removed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Remove MO request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove request'
            ], 500);
        }
    }

    
}
