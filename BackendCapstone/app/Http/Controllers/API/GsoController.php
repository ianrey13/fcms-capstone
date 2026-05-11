<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\GsoVerification;
use App\Models\GasSlip;
use App\Models\Notification as ModelsNotification;
use App\Models\Notification;


use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class GsoController extends Controller
{
    /**
     * Get GSO dashboard statistics
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $stats = [
            'pending_review' => TripTicket::where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)->count(),
            'verified_pending' => TripTicket::where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)->count(),
            'with_mayors_office' => TripTicket::where('status', TripTicket::STATUS_WITH_MAYORS_OFFICE)->count(),
            'returned' => TripTicket::where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)->count(),
            'pending_reconciliation' => TripTicket::where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
            'total_verified_this_month' => GsoVerification::whereMonth('verified_at', now()->month)->count(),
            'total_verified_this_year' => GsoVerification::whereYear('verified_at', now()->year)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Get pending tickets for GSO review (pending_gso_review status)
     * ✅ UPDATED: Added budget warning fields
     */
    public function getPendingTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $pendingTickets = TripTicket::with(['vehicle', 'department', 'submittedBy', 'driver.user'])
                ->where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)
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
                        // ✅ NEW: Budget warning fields
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'estimated_cost' => $ticket->estimated_fuel_liters ? 
                            ($ticket->estimated_fuel_liters * 58) : null,
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
     * Get verified tickets (all tickets that have GSO approval)
     */
    public function getVerifiedTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $verifiedTickets = TripTicket::with(['vehicle', 'department', 'latestGsoVerification', 'gasSlip'])
                ->whereHas('gsoVerifications', function($q) {
                    $q->where('decision', 'approved');
                })
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'trip_ticket_id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'status' => $ticket->status,
                        'submitted_at' => $ticket->submitted_at,
                        // ✅ NEW: Budget warning fields
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                            'vehicle_model' => $ticket->vehicle->vehicle_model,
                        ] : null,
                        'department' => $ticket->department ? [
                            'department_name' => $ticket->department->department_name,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'driver' => $ticket->driver && $ticket->driver->user ? [
                            'full_name' => $ticket->driver->user->full_name,
                        ] : null,
                        'verified_at' => $ticket->latestGsoVerification ? $ticket->latestGsoVerification->verified_at : null,
                        'verified_by' => $ticket->latestGsoVerification && $ticket->latestGsoVerification->verifiedBy ?
                            $ticket->latestGsoVerification->verifiedBy->full_name : null,
                        'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $verifiedTickets,
                'meta' => [
                    'verified_count' => $verifiedTickets->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get verified tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch verified tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get returned tickets (returned_for_revision status)
     */
    public function getReturnedTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
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
                        // ✅ NEW: Budget warning fields
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
     * Get forward queue (pending_mayors_office tickets ready to forward)
     */
    public function getForwardQueue(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $forwardQueue = TripTicket::with(['vehicle', 'department'])
                ->where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)
                ->orderBy('submitted_at', 'asc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'status' => $ticket->status,
                        // ✅ NEW: Budget warning fields
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $forwardQueue,
                'meta' => [
                    'forward_count' => $forwardQueue->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get forward queue error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch forward queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GSO approves a ticket (verifies it)
     */
    public function approveTicket(Request $request, $id)
    {
        // ... keep existing method ...
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $tripTicket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)
                ->first();

            if (!$tripTicket) {
                return response()->json(['message' => 'Ticket not found or not eligible for approval'], 404);
            }

            if ($tripTicket->submitted_by === $user->user_id) {
                return response()->json(['message' => 'Cannot verify your own trip ticket'], 400);
            }

            DB::beginTransaction();

            $lastCycle = GsoVerification::where('trip_ticket_id', $id)->max('review_cycle') ?? 0;
            $reviewCycle = $lastCycle + 1;

            GsoVerification::create([
                'trip_ticket_id' => $id,
                'review_cycle' => $reviewCycle,
                'verified_by' => $user->user_id,
                'decision' => 'approved',
                'verification_note' => $request->gso_note,
                'verified_at' => now(),
            ]);

            $tripTicket->status = TripTicket::STATUS_PENDING_MAYORS_OFFICE;
            $tripTicket->save();

            DB::commit();

            $this->sendMoNotification($tripTicket);

            return response()->json([
                'success' => true,
                'message' => 'Ticket verified successfully',
                'data' => [
                    'id' => $tripTicket->trip_ticket_id,
                    'number' => $tripTicket->trip_ticket_number,
                    'status' => $tripTicket->status,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GSO approve error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * GSO rejects a ticket
     */
        public function rejectTicket(Request $request, $id)
        {
            $validator = Validator::make($request->all(), [
                'verification_note' => 'required|string|min:5'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            try {
                $user = $request->user();

                if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }

                $tripTicket = TripTicket::where('trip_ticket_id', $id)
                    ->where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)
                    ->first();

                if (!$tripTicket) {
                    return response()->json(['message' => 'Ticket not found'], 404);
                }

                DB::beginTransaction();

                $lastCycle = GsoVerification::where('trip_ticket_id', $id)->max('review_cycle') ?? 0;
                $reviewCycle = $lastCycle + 1;

                GsoVerification::create([
                    'trip_ticket_id' => $id,
                    'review_cycle' => $reviewCycle,
                    'verified_by' => $user->user_id,
                    'decision' => 'rejected',
                    'verification_note' => $request->verification_note,
                    'verified_at' => now(),
                ]);

                $tripTicket->status = TripTicket::STATUS_RETURNED_FOR_REVISION;
                $tripTicket->save();

                DB::table('trip_ticket_return')->insert([
                    'trip_ticket_id' => $id,
                    'return_type' => 'rejected_by_gso',
                    'return_note' => $request->verification_note,
                    'actioned_by' => $user->user_id,
                    'actioned_at' => now(),
                ]);

                DB::commit();

                $this->sendRejectionNotification($tripTicket, $request->verification_note);

                return response()->json([
                    'success' => true,
                    'message' => 'Ticket rejected and returned to department',
                    'data' => [
                        'id' => $tripTicket->trip_ticket_id,
                        'number' => $tripTicket->trip_ticket_number,
                        'status' => $tripTicket->status,
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('GSO reject error: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to reject ticket: ' . $e->getMessage()
                ], 500);
            }
        }

    /**
     * Forward tickets to Mayor's Office
     */
    public function forwardToMO(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'trip_ticket_ids' => 'required|array',
            'trip_ticket_ids.*' => 'exists:trip_ticket,trip_ticket_id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $forwardedCount = 0;
            $forwardedIds = [];

            DB::beginTransaction();

            foreach ($request->trip_ticket_ids as $id) {
                $ticket = TripTicket::where('trip_ticket_id', $id)
                    ->where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)
                    ->first();

                if ($ticket) {
                    $ticket->status = TripTicket::STATUS_PENDING_MAYORS_OFFICE;
                    $ticket->save();

                    $forwardedCount++;
                    $forwardedIds[] = $id;
                }
            }

            DB::commit();

            if ($forwardedCount > 0) {
                $this->sendBatchForwardNotification($forwardedCount, $forwardedIds);
            }

            return response()->json([
                'success' => true,
                'message' => $forwardedCount . ' ticket(s) forwarded to Mayor\'s Office',
                'data' => [
                    'forwarded_count' => $forwardedCount,
                    'forwarded_ids' => $forwardedIds
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Forward to MO error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to forward tickets: ' . $e->getMessage()
            ], 500);
        }
    }

 /**
 * Get single ticket details for GSO
 */
public function show(Request $request, $id)
{
    try {
        $user = $request->user();

        if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // ✅ FIXED: Removed latestMoReview
        $ticket = TripTicket::with([
            'vehicle',
            'driver.user',
            'department',
            'submittedBy',
            'latestHeadApproval.approvedBy',
            'latestGsoVerification.verifiedBy',
            // ❌ REMOVED: 'latestMoReview.reviewedBy',
            'gasSlip',
            'vehicleSnapshot'
        ])->findOrFail($id);

        Log::info('Ticket found:', ['id' => $id, 'status' => $ticket->status]);
        
        if ($ticket->latestHeadApproval) {
            Log::info('Head approval found:', [
                'decision' => $ticket->latestHeadApproval->decision,
                'approved_by_id' => $ticket->latestHeadApproval->approved_by,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'trip_ticket_id' => $ticket->trip_ticket_id,
                'trip_ticket_number' => $ticket->trip_ticket_number,
                'ticket_number' => $ticket->trip_ticket_number,
                'trip_date' => $ticket->trip_date,
                'destination' => $ticket->destination,
                'purpose' => $ticket->purpose,
                'charge_to' => $ticket->charge_to,
                'passenger_name' => $ticket->passenger_name,
                'status' => $ticket->status,
                'submitted_at' => $ticket->submitted_at,
                'submitted_by_head' => $ticket->submitted_by_head,
                // ✅ Budget warning fields
                'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                'budget_shortage' => $ticket->budget_shortage ?? 0,
                'estimated_distance_km' => $ticket->estimated_distance_km,
                'estimated_fuel_liters' => $ticket->estimated_fuel_liters,
                
                'vehicle' => $ticket->vehicle ? [
                    'vehicle_id' => $ticket->vehicle->vehicle_id,
                    'plate_number' => $ticket->vehicle->plate_number,
                    'vehicle_model' => $ticket->vehicle->vehicle_model,
                    'fuel_type' => $ticket->vehicle->fuel_type,
                ] : null,
                
                'driver' => $ticket->driver && $ticket->driver->user ? [
                    'driver_id' => $ticket->driver->driver_id,
                    'full_name' => $ticket->driver->user->full_name,
                    'first_name' => $ticket->driver->user->first_name,
                    'last_name' => $ticket->driver->user->last_name,
                    'user' => $ticket->driver->user,
                ] : null,
                'driver_name' => $ticket->driver && $ticket->driver->user ? 
                    $ticket->driver->user->full_name : null,
                
                'department' => $ticket->department ? [
                    'department_id' => $ticket->department->department_id,
                    'department_name' => $ticket->department->department_name,
                    'department_code' => $ticket->department->department_code,
                ] : null,
                'department_name' => $ticket->department ? 
                    $ticket->department->department_name : null,
                
                'head_approval' => $ticket->latestHeadApproval ? [
                    'approval_id' => $ticket->latestHeadApproval->approval_id,
                    'decision' => $ticket->latestHeadApproval->decision,
                    'review_note' => $ticket->latestHeadApproval->review_note,
                    'reviewed_at' => $ticket->latestHeadApproval->reviewed_at,
                    'is_oic_action' => $ticket->latestHeadApproval->is_oic_action ?? false,
                    'approved_by' => $ticket->latestHeadApproval->approvedBy ? [
                        'user_id' => $ticket->latestHeadApproval->approvedBy->user_id,
                        'full_name' => $ticket->latestHeadApproval->approvedBy->full_name,
                        'first_name' => $ticket->latestHeadApproval->approvedBy->first_name,
                        'last_name' => $ticket->latestHeadApproval->approvedBy->last_name,
                        'email' => $ticket->latestHeadApproval->approvedBy->email,
                    ] : null,
                ] : null,
                
                'gso_verification' => $ticket->latestGsoVerification ? [
                    'verification_id' => $ticket->latestGsoVerification->verification_id,
                    'decision' => $ticket->latestGsoVerification->decision,
                    'gso_note' => $ticket->latestGsoVerification->gso_note,
                    'verified_at' => $ticket->latestGsoVerification->verified_at,
                    'verified_by' => $ticket->latestGsoVerification->verifiedBy ? [
                        'full_name' => $ticket->latestGsoVerification->verifiedBy->full_name,
                    ] : null,
                ] : null,
                
                // ❌ REMOVED mo_review section
                
                'gas_slip' => $ticket->gasSlip ? [
                    'gas_slip_id' => $ticket->gasSlip->gas_slip_id,
                    'amount_released' => $ticket->gasSlip->amount_released,
                    'reconciliation_status' => $ticket->gasSlip->reconciliation_status,
                ] : null,
                'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                
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
            'message' => 'Ticket not found: ' . $e->getMessage()
        ], 404);
    }
}
    /**
     * Get GSO reports
     */
    public function getReports(Request $request)
    {
        // ... keep existing method ...
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $stats = [
                'total_verified' => GsoVerification::where('decision', 'approved')->count(),
                'total_forwarded' => TripTicket::where('status', TripTicket::STATUS_WITH_MAYORS_OFFICE)->count(),
                'total_rejected' => GsoVerification::where('decision', 'rejected')->count(),
                'this_month' => [
                    'verified' => GsoVerification::whereMonth('verified_at', now()->month)->where('decision', 'approved')->count(),
                    'approved' => GsoVerification::whereMonth('verified_at', now()->month)->where('decision', 'approved')->count(),
                    'rejected' => GsoVerification::whereMonth('verified_at', now()->month)->where('decision', 'rejected')->count(),
                ],
                'by_department' => DB::table('gso_verification as gv')
                    ->join('trip_ticket as tt', 'gv.trip_ticket_id', '=', 'tt.trip_ticket_id')
                    ->join('departments as d', 'tt.department_id', '=', 'd.department_id')
                    ->select('d.department_name', DB::raw('COUNT(*) as count'))
                    ->where('gv.decision', 'approved')
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
     * Get forwarded tickets (with_mayors_office status)
     */
    public function getForwardedTickets(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isGsoStaff() && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $forwardedTickets = TripTicket::with(['vehicle', 'department', 'latestGsoVerification', 'gasSlip'])
                ->where('status', TripTicket::STATUS_WITH_MAYORS_OFFICE)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->trip_ticket_id,
                        'trip_ticket_id' => $ticket->trip_ticket_id,
                        'ticket_number' => $ticket->trip_ticket_number,
                        'trip_ticket_number' => $ticket->trip_ticket_number,
                        'trip_date' => $ticket->trip_date,
                        'destination' => $ticket->destination,
                        'purpose' => $ticket->purpose,
                        'status' => $ticket->status,
                        'submitted_at' => $ticket->submitted_at,
                        'has_insufficient_budget' => $ticket->has_insufficient_budget ?? false,
                        'budget_shortage' => $ticket->budget_shortage ?? 0,
                        'vehicle' => $ticket->vehicle ? [
                            'plate_number' => $ticket->vehicle->plate_number,
                            'vehicle_model' => $ticket->vehicle->vehicle_model,
                            'fuel_type' => $ticket->vehicle->fuel_type,
                        ] : null,
                        'department' => $ticket->department ? [
                            'department_name' => $ticket->department->department_name,
                            'department_code' => $ticket->department->department_code,
                        ] : null,
                        'department_name' => $ticket->department ? $ticket->department->department_name : null,
                        'driver' => $ticket->driver && $ticket->driver->user ? [
                            'full_name' => $ticket->driver->user->full_name,
                        ] : null,
                        'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : 0,
                        'verified_at' => $ticket->latestGsoVerification ? $ticket->latestGsoVerification->verified_at : null,
                        'verified_by' => $ticket->latestGsoVerification && $ticket->latestGsoVerification->verifiedBy ?
                            $ticket->latestGsoVerification->verifiedBy->full_name : null,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $forwardedTickets,
                'meta' => [
                    'forwarded_count' => $forwardedTickets->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get forwarded tickets error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch forwarded tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============ PRIVATE METHODS ============

    private function sendMoNotification($tripTicket)
    {
        $moStaff = User::where('role', 'mayors_office')
            ->where('status', 'active')
            ->get();

        foreach ($moStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'forwarded_to_mo',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Trip ticket {$tripTicket->trip_ticket_number} is ready for fund release",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    private function sendBatchForwardNotification($count, $ticketIds)
    {
        $moStaff = User::where('role', 'mayors_office')
            ->where('status', 'active')
            ->get();

        $firstTicketId = $ticketIds[0] ?? null;

        foreach ($moStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'batch_forwarded_to_mo',
                'entity_type' => 'trip_ticket',
                'entity_id' => $firstTicketId,
                'message' => "{$count} trip ticket(s) have been forwarded for fund release",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
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
                'message' => "Trip ticket {$tripTicket->trip_ticket_number} was rejected by GSO: {$reason}",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }
}