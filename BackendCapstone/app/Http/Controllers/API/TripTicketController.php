<?php

namespace App\Http\Controllers\API;

use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\HeadApproval;
use App\Models\GsoVerification;
use App\Models\MoReview;
use App\Models\GasSlip;
use App\Models\FundIssuance;
use App\Models\Notification;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Department;
use App\Models\User;
use App\Models\DeptBudgetPeriod;
use App\Models\TripTicketVehicleSnapshot;
use App\Models\TripTicketReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class TripTicketController extends Controller
{
    /**
     * Display trip tickets based on user role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = TripTicket::with(['department', 'driver.user', 'vehicle', 'latestHeadApproval']);

        if ($user->isDeptOffice()) {
            $query->where('submitted_by', $user->user_id);
        } elseif ($user->isDriver()) {
            $driver = Driver::where('user_id', $user->user_id)->first();
            if ($driver) {
                $query->where('driver_id', $driver->driver_id);
            }
        } elseif ($user->isGsoStaff()) {
            $query->whereIn('status', [
                TripTicket::STATUS_PENDING_GSO_REVIEW,
                TripTicket::STATUS_RETURNED_FOR_REVISION
            ]);
        } elseif ($user->isMayorsOffice()) {
            $query->whereIn('status', [
                TripTicket::STATUS_PENDING_MAYORS_OFFICE,
                TripTicket::STATUS_FUNDS_ISSUED,
                TripTicket::STATUS_PENDING_RECONCILIATION
            ]);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('submitted_at', [$request->start_date, $request->end_date]);
        }

        $tripTickets = $query->orderBy('submitted_at', 'desc')->paginate(15);

        return response()->json($tripTickets);
    }

    /**
     * Get my requests for department office - WITH AMOUNT
     */
    public function myRequests(Request $request)
    {
        $user = $request->user();

        $tripTickets = TripTicket::with(['vehicle', 'driver.user', 'department', 'latestHeadApproval', 'gasSlip'])
            ->where('submitted_by', $user->user_id)
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                $latestApproval = $ticket->latestHeadApproval;
                return [
                    'id' => $ticket->trip_ticket_id,
                    'ticket_number' => $ticket->trip_ticket_number,
                    'trip_date' => $ticket->trip_date,
                    'destination' => $ticket->destination,
                    'status' => $ticket->status,
                    'submitted_at' => $ticket->submitted_at,
                    'submitted_by_head' => $ticket->submitted_by_head ?? false,
                    'head_status' => $latestApproval ? $latestApproval->decision : null,
                    'head_approved_at' => $latestApproval ? $latestApproval->reviewed_at : null,
                    'amount_released' => $ticket->gasSlip ? $ticket->gasSlip->amount_released : null,
                    'vehicle' => $ticket->vehicle ? [
                        'plate_number' => $ticket->vehicle->plate_number,
                    ] : null,
                    'driver' => $ticket->driver && $ticket->driver->user ? [
                        'full_name' => $ticket->driver->user->full_name,
                    ] : null,
                ];
            });

        return response()->json($tripTickets);
    }

    /**
     * Display a specific trip ticket
     */
    public function show($id)
    {
        try {
            $tripTicket = TripTicket::with([
                'department',
                'driver.user',
                'vehicle',
                'latestHeadApproval.approvedBy',
                'latestGsoVerification.verifiedBy',
                'latestMoReview.reviewedBy',
                'gasSlip',
                'gasSlip.fuelLog',
                'vehicleSnapshot',
                'returns'
            ])->findOrFail($id);

            $response = [
                'id' => $tripTicket->trip_ticket_id,
                'ticket_number' => $tripTicket->trip_ticket_number,
                'trip_date' => $tripTicket->trip_date,
                'destination' => $tripTicket->destination,
                'purpose' => $tripTicket->purpose,
                'charge_to' => $tripTicket->charge_to,
                'passenger_name' => $tripTicket->passenger_name,
                'status' => $tripTicket->status,
                'submitted_at' => $tripTicket->submitted_at,
                'submitted_by_head' => $tripTicket->submitted_by_head ?? false,
                'estimated_distance_km' => $tripTicket->estimated_distance_km,
                'estimated_fuel_liters' => $tripTicket->estimated_fuel_liters,
                'amount_released' => $tripTicket->gasSlip ? $tripTicket->gasSlip->amount_released : null,
                'created_by_mo_user_id' => $tripTicket->created_by_mo_user_id,
                'vehicle' => $tripTicket->vehicle ? [
                    'plate_number' => $tripTicket->vehicle->plate_number,
                    'vehicle_model' => $tripTicket->vehicle->vehicle_model,
                    'fuel_type' => $tripTicket->vehicle->fuel_type,
                ] : null,
                'driver' => $tripTicket->driver && $tripTicket->driver->user ? [
                    'full_name' => $tripTicket->driver->user->full_name,
                ] : null,
                'department' => $tripTicket->department ? [
                    'name' => $tripTicket->department->department_name,
                    'code' => $tripTicket->department->department_code,
                ] : null,
                'head_approval' => $tripTicket->latestHeadApproval ? [
                    'decision' => $tripTicket->latestHeadApproval->decision,
                    'review_note' => $tripTicket->latestHeadApproval->review_note,
                    'reviewed_at' => $tripTicket->latestHeadApproval->reviewed_at,
                    'approved_by' => $tripTicket->latestHeadApproval->approvedBy ? [
                        'name' => $tripTicket->latestHeadApproval->approvedBy->full_name,
                    ] : null,
                    'is_oic_action' => $tripTicket->latestHeadApproval->is_oic_action,
                ] : null,
                'gso_verification' => $tripTicket->latestGsoVerification ? [
                    'decision' => $tripTicket->latestGsoVerification->decision,
                    'gso_note' => $tripTicket->latestGsoVerification->gso_note,
                    'verified_at' => $tripTicket->latestGsoVerification->verified_at,
                ] : null,
                'mo_review' => $tripTicket->latestMoReview ? [
                    'decision' => $tripTicket->latestMoReview->decision,
                    'review_note' => $tripTicket->latestMoReview->review_note,
                    'reviewed_at' => $tripTicket->latestMoReview->reviewed_at,
                ] : null,
                'gas_slip' => $tripTicket->gasSlip ? [
                    'amount_released' => $tripTicket->gasSlip->amount_released,
                    'reconciliation_status' => $tripTicket->gasSlip->reconciliation_status,
                    'created_at' => $tripTicket->gasSlip->created_at,
                ] : null,
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Show ticket error: ' . $e->getMessage());
            return response()->json(['message' => 'Trip ticket not found'], 404);
        }
    }

    /**
     * Save draft trip ticket - WITH ESTIMATES
     */
    public function saveDraft(Request $request)
    {
        try {
            $user = $request->user();
            $departmentId = $user->department_id;

            if (!$departmentId) {
                return response()->json(['message' => 'User has no department assigned'], 400);
            }

            $validator = Validator::make($request->all(), [
                'driver_id' => 'required|exists:drivers,driver_id',
                'vehicle_id' => 'required|exists:vehicles,vehicle_id',
                'trip_date' => 'required|date|after_or_equal:today',
                'destination' => 'required|string|max:255',
                'purpose' => 'required|string',
                'charge_to' => 'required|string|max:120',
                'passenger_name' => 'nullable|string|max:120',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $vehicle = Vehicle::find($request->vehicle_id);
            $estimatedDistance = $this->calculateDistanceFromConfig($request->destination);
            $estimatedFuel = $vehicle ? $this->calculateEstimatedFuelFromConfig($vehicle, $estimatedDistance) : 0;

            $ticketNumber = 'DRF-' . date('Ymd') . '-' . rand(1000, 9999);

            $tripTicket = TripTicket::create([
                'trip_ticket_number' => $ticketNumber,
                'department_id' => $departmentId,
                'driver_id' => $request->driver_id,
                'vehicle_id' => $request->vehicle_id,
                'submitted_by' => $user->user_id,
                'trip_date' => $request->trip_date,
                'purpose' => $request->purpose,
                'destination' => $request->destination,
                'charge_to' => $request->charge_to,
                'passenger_name' => $request->passenger_name ?? null,
                'status' => TripTicket::STATUS_DRAFT,
                'submitted_at' => null,
                'estimated_distance_km' => $estimatedDistance,
                'estimated_fuel_liters' => $estimatedFuel,
                'submitted_by_head' => $request->input('submitted_by_head', false),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Draft saved successfully',
                'data' => [
                    'trip_ticket_id' => $tripTicket->trip_ticket_id,
                    'trip_ticket_number' => $tripTicket->trip_ticket_number,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Save draft error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save draft: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit trip ticket for review - WITH HEAD CREATE SUPPORT
     */
    public function submit(Request $request)
    {
        try {
            $user = $request->user();
            $departmentId = $user->department_id;

            if (!$departmentId) {
                return response()->json(['message' => 'User has no department assigned'], 400);
            }

            $validator = Validator::make($request->all(), [
                'driver_id' => 'required|exists:drivers,driver_id',
                'vehicle_id' => 'required|exists:vehicles,vehicle_id',
                'trip_date' => 'required|date|after_or_equal:today',
                'destination' => 'required|string|max:255',
                'purpose' => 'required|string',
                'charge_to' => 'required|string|max:120',
                'passenger_name' => 'nullable|string|max:120',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $vehicle = Vehicle::find($request->vehicle_id);
            if (!$vehicle) {
                return response()->json(['message' => 'Vehicle not found'], 404);
            }

            if ($vehicle->status !== 'active' || $vehicle->maintenance_flag) {
                return response()->json(['message' => 'Vehicle is not available'], 400);
            }

            $driver = Driver::find($request->driver_id);
            if (!$driver || $driver->status !== 'active') {
                return response()->json(['message' => 'Driver is not active'], 400);
            }

            // ✅ Check if submitted by Head of Office
            $submittedByHead = $request->input('submitted_by_head', false);

            // If user is Head but didn't set the flag, force it
            if ($user->isDeptHead() && !$submittedByHead) {
                $submittedByHead = true;
            }

            // Calculate estimates
            $estimatedDistance = $this->calculateDistanceFromConfig($request->destination);
            $estimatedFuel = $this->calculateEstimatedFuelFromConfig($vehicle, $estimatedDistance);

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

            // ✅ Determine initial status based on who created the ticket
            // If submitted by Head, skip Head approval and go directly to GSO
            // If submitted by Department Staff, go to Head approval first
            $initialStatus = $submittedByHead
                ? TripTicket::STATUS_PENDING_GSO_REVIEW      // Skip Head approval
                : TripTicket::STATUS_PENDING_HEAD_APPROVAL;  // Normal flow

            DB::beginTransaction();

            $tripTicket = TripTicket::create([
                'trip_ticket_number' => $ticketNumber,
                'department_id' => $departmentId,
                'driver_id' => $request->driver_id,
                'vehicle_id' => $request->vehicle_id,
                'submitted_by' => $user->user_id,
                'trip_date' => $request->trip_date,
                'purpose' => $request->purpose,
                'destination' => $request->destination,
                'charge_to' => $request->charge_to,
                'passenger_name' => $request->passenger_name ?? null,
                'status' => $initialStatus,  // ✅ Now uses correct status
                'submitted_at' => now(),
                'estimated_distance_km' => $estimatedDistance,
                'estimated_fuel_liters' => $estimatedFuel,
                'submitted_by_head' => $submittedByHead,
            ]);

            TripTicketVehicleSnapshot::create([
                'trip_ticket_id' => $tripTicket->trip_ticket_id,
                'vehicle_status' => $vehicle->status,
                'odometer_status' => $vehicle->odometer_status,
                'fuel_type' => is_string($vehicle->fuel_type) ? $vehicle->fuel_type : 'regular',
                'snapshot_taken_at' => now(),
            ]);

            DB::commit();

            // ✅ Send appropriate notifications based on who created the ticket
            if ($submittedByHead) {
                // Skip Head approval, notify GSO directly
                $this->sendGsoNotification($tripTicket);
            } else {
                // Normal flow - notify Department Head
                $this->sendHeadApprovalNotification($tripTicket);
            }

            return response()->json([
                'success' => true,
                'message' => $submittedByHead
                    ? 'Trip ticket submitted successfully to GSO'
                    : 'Trip ticket submitted for Head approval',
                'data' => [
                    'trip_ticket_id' => $tripTicket->trip_ticket_id,
                    'trip_ticket_number' => $tripTicket->trip_ticket_number,
                    'status' => $tripTicket->status,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Submit error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit trip ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification to GSO Staff
     */
    private function sendGsoNotification($tripTicket)
    {
        $gsoStaff = User::where('role', 'gso_staff')
            ->where('status', 'active')
            ->get();

        foreach ($gsoStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'trip_submitted',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Trip ticket {$tripTicket->trip_ticket_number} is ready for GSO review" .
                    ($tripTicket->submitted_by_head ? " (Created by Department Head)" : ""),
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Send notification to Department Head about pending approval
     */
    private function sendHeadApprovalNotification($tripTicket)
    {
        $department = Department::find($tripTicket->department_id);

        $headDesignation = DB::table('oic_designation')
            ->where('department_id', $department->department_id)
            ->where('is_active', true)
            ->first();

        $approverId = null;
        if ($headDesignation) {
            $headUser = User::find($headDesignation->head_of_office_id);
            if ($headUser && $headUser->head_active_status === 'active') {
                $approverId = $headDesignation->head_of_office_id;
            } elseif ($headDesignation->head_of_office_id != $headDesignation->oic_user_id) {
                $approverId = $headDesignation->oic_user_id;
            }
        }

        if ($approverId) {
            Notification::create([
                'recipient_user_id' => $approverId,
                'notification_type' => 'trip_submitted',
                'entity_type' => 'trip_ticket',
                'entity_id' => $tripTicket->trip_ticket_id,
                'message' => "Trip ticket {$tripTicket->trip_ticket_number} requires your approval",
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Update draft trip ticket
     */
    public function updateDraft(Request $request, $id)
    {
        try {
            $tripTicket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', TripTicket::STATUS_DRAFT)
                ->firstOrFail();

            $user = $request->user();

            if ($tripTicket->submitted_by !== $user->user_id && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'driver_id' => 'sometimes|exists:drivers,driver_id',
                'vehicle_id' => 'sometimes|exists:vehicles,vehicle_id',
                'trip_date' => 'sometimes|date|after_or_equal:today',
                'destination' => 'sometimes|string|max:255',
                'purpose' => 'sometimes|string',
                'charge_to' => 'sometimes|string|max:120',
                'passenger_name' => 'nullable|string|max:120',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $tripTicket->update($request->only([
                'driver_id',
                'vehicle_id',
                'trip_date',
                'purpose',
                'destination',
                'charge_to',
                'passenger_name'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Draft updated successfully',
                'data' => $tripTicket
            ]);
        } catch (\Exception $e) {
            Log::error('Update draft error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update draft: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit rejected trip ticket
     */
    public function resubmit(Request $request, $id)
    {
        try {
            $tripTicket = TripTicket::where('trip_ticket_id', $id)
                ->where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)
                ->firstOrFail();

            $user = $request->user();

            if ($tripTicket->submitted_by !== $user->user_id && !$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'driver_id' => 'sometimes|exists:drivers,driver_id',
                'vehicle_id' => 'sometimes|exists:vehicles,vehicle_id',
                'trip_date' => 'sometimes|date|after_or_equal:today',
                'destination' => 'sometimes|string|max:255',
                'purpose' => 'sometimes|string',
                'charge_to' => 'sometimes|string|max:120',
                'passenger_name' => 'nullable|string|max:120',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $oldValues = $tripTicket->getAttributes();

            $tripTicket->update($request->only([
                'driver_id',
                'vehicle_id',
                'trip_date',
                'purpose',
                'destination',
                'charge_to',
                'passenger_name'
            ]));

            $changes = array_diff_assoc($tripTicket->getAttributes(), $oldValues);

            TripTicketReturn::create([
                'trip_ticket_id' => $id,
                'return_type' => 'resubmitted_to_head',
                'fields_changed' => json_encode($changes),
                'actioned_by' => $user->user_id,
                'actioned_at' => now(),
            ]);

            $tripTicket->status = TripTicket::STATUS_PENDING_HEAD_APPROVAL;
            $tripTicket->save();

            DB::commit();

            $this->sendHeadApprovalNotification($tripTicket);

            return response()->json([
                'success' => true,
                'message' => 'Trip ticket resubmitted successfully',
                'data' => $tripTicket
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Resubmit error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a trip ticket
     */
    public function cancel(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $tripTicket = TripTicket::findOrFail($id);
            $user = $request->user();

            $authorizedRoles = ['superadmin', 'dept_office', 'head_of_office', 'gso_staff', 'mayors_office'];
            $isAuthorized = in_array($user->role, $authorizedRoles);
            $isOwner = $tripTicket->submitted_by === $user->user_id;

            if (!$isAuthorized && !$isOwner) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $cancellableStatuses = [
                TripTicket::STATUS_DRAFT,
                TripTicket::STATUS_PENDING_HEAD_APPROVAL,
                TripTicket::STATUS_RETURNED_FOR_REVISION,
            ];

            if (!in_array($tripTicket->status, $cancellableStatuses)) {
                return response()->json(['message' => 'Trip ticket cannot be cancelled at this stage'], 400);
            }

            DB::beginTransaction();

            $tripTicket->status = TripTicket::STATUS_CANCELLED;
            $tripTicket->save();

            DB::table('trip_ticket_cancellation')->insert([
                'trip_ticket_id' => $id,
                'cancelled_by' => $user->user_id,
                'cancellation_reason' => $request->reason,
                'cancelled_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Trip ticket cancelled successfully',
                'data' => $tripTicket
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cancel error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard counts for each role
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $dashboard = [];

        if ($user->isDeptOffice()) {
            $dashboard = [
                'draft' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_DRAFT)->count(),
                'pending_head_approval' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_PENDING_HEAD_APPROVAL)->count(),
                'returned_for_revision' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)->count(),
                'approved' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)->count(),
                'completed' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_CLOSED)->count(),
                'cancelled' => TripTicket::where('submitted_by', $user->user_id)->where('status', TripTicket::STATUS_CANCELLED)->count(),
            ];
        } elseif ($user->isGsoStaff()) {
            $dashboard = [
                'pending_review' => TripTicket::where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)->count(),
                'pending_reconciliation' => TripTicket::where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
                'returned' => TripTicket::where('status', TripTicket::STATUS_RETURNED_FOR_REVISION)->count(),
            ];
        } elseif ($user->isMayorsOffice()) {
            $dashboard = [
                'pending_approval' => TripTicket::where('status', TripTicket::STATUS_PENDING_MAYORS_OFFICE)->count(),
                'funds_issued' => TripTicket::where('status', TripTicket::STATUS_FUNDS_ISSUED)->count(),
                'in_transit' => TripTicket::where('status', TripTicket::STATUS_IN_TRANSIT)->count(),
                'pending_reconciliation' => TripTicket::where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
            ];
        } elseif ($user->isDriver()) {
            $driver = Driver::where('user_id', $user->user_id)->first();
            if ($driver) {
                $dashboard = [
                    'in_transit' => TripTicket::where('driver_id', $driver->driver_id)->where('status', TripTicket::STATUS_IN_TRANSIT)->count(),
                    'pending_reconciliation' => TripTicket::where('driver_id', $driver->driver_id)->where('status', TripTicket::STATUS_PENDING_RECONCILIATION)->count(),
                    'completed' => TripTicket::where('driver_id', $driver->driver_id)->where('status', TripTicket::STATUS_CLOSED)->count(),
                ];
            }
        } elseif ($user->isDeptHead()) {
            $department = $user->getManagedDepartment();
            if ($department) {
                $dashboard = [
                    'pending_approval' => TripTicket::where('department_id', $department->department_id)->where('status', TripTicket::STATUS_PENDING_HEAD_APPROVAL)->count(),
                    'approved' => TripTicket::where('department_id', $department->department_id)->where('status', TripTicket::STATUS_PENDING_GSO_REVIEW)->count(),
                    'in_transit' => TripTicket::where('department_id', $department->department_id)->where('status', TripTicket::STATUS_IN_TRANSIT)->count(),
                    'completed' => TripTicket::where('department_id', $department->department_id)->where('status', TripTicket::STATUS_CLOSED)->count(),
                ];
            }
        }

        return response()->json($dashboard);
    }

    // ============ FIXED HELPER METHODS (READS FROM CONFIG) ============

    /**
     * Calculate distance from config file - RETURNS ROUND TRIP KM
     */
    private function calculateDistanceFromConfig($destination)
    {
        $destinationLower = strtolower((string) $destination);

        // Check municipalities first
        $municipalities = config('locations.municipalities', []);
        foreach ($municipalities as $key => $value) {
            if (strpos($destinationLower, $key) !== false) {
                $oneWayKm = is_array($value) ? ($value['distance_km'] ?? 0) : (float) $value;
                return round($oneWayKm * 2, 1);
            }
        }

        // Check barangays
        $barangays = config('locations.barangays', []);
        foreach ($barangays as $key => $value) {
            if (strpos($destinationLower, $key) !== false) {
                $oneWayKm = is_array($value) ? ($value['distance_km'] ?? 0) : (float) $value;
                return round($oneWayKm * 2, 1);
            }
        }

        // Check major cities
        $majorCities = config('locations.major_cities', []);
        foreach ($majorCities as $key => $value) {
            if (strpos($destinationLower, $key) !== false) {
                $oneWayKm = $value['distance_km'] ?? 0;
                return round($oneWayKm * 2, 1);
            }
        }

        return 60.0;
    }

    /**
     * Calculate estimated fuel from config - RETURNS LITERS
     */
    private function calculateEstimatedFuelFromConfig($vehicle, $distanceKm)
    {
        $fuelType = 'regular';
        if ($vehicle && isset($vehicle->fuel_type)) {
            if (is_string($vehicle->fuel_type)) {
                $fuelType = strtolower($vehicle->fuel_type);
            } elseif (is_array($vehicle->fuel_type)) {
                $fuelType = strtolower($vehicle->fuel_type[0] ?? 'regular');
            }
        }

        $fuelRates = config('locations.fuel_rates', []);

        $rateKey = $fuelType;
        if ($fuelType === 'diesel') {
            $rateKey = 'car_diesel';
        } elseif ($fuelType === 'regular') {
            $rateKey = 'car_regular';
        } elseif ($fuelType === 'premium') {
            $rateKey = 'car_premium';
        }

        $rate = $fuelRates[$rateKey] ?? $fuelRates['car'] ?? 0.12;
        $distanceKm = (float) $distanceKm;

        return round($distanceKm * $rate, 1);
    }

    /**
     * Get fuel price from config
     */
    private function getFuelPriceFromConfig($fuelType)
    {
        if (is_array($fuelType)) {
            $fuelType = isset($fuelType[0]) ? $fuelType[0] : 'regular';
        }
        $fuelType = is_string($fuelType) ? strtolower($fuelType) : 'regular';

        $prices = [
            'regular' => 55.00,
            'premium' => 65.00,
            'diesel' => 50.00,
        ];

        return isset($prices[$fuelType]) ? (float) $prices[$fuelType] : 55.00;
    }

    /**
     * Get department budget
     */
    private function getDepartmentBudgetFromConfig($departmentId)
    {
        $currentPeriod = DeptBudgetPeriod::where('department_id', $departmentId)
            ->where('status', 'active')
            ->first();

        if (!$currentPeriod) {
            return [
                'allocated' => 10000.00,
                'spent' => 0.00,
                'remaining' => 10000.00,
                'has_period' => false,
            ];
        }

        $totalSpent = FundIssuance::where('period_id', $currentPeriod->period_id)->sum('amount_released');

        return [
            'allocated' => round((float) $currentPeriod->allocated_amount, 2),
            'spent' => round((float) $totalSpent, 2),
            'remaining' => round((float) $currentPeriod->allocated_amount - (float) $totalSpent, 2),
            'has_period' => true,
        ];
    }
    
    // ============ BUDGET CHECK & MO ASSISTANCE METHODS ============

    /**
     * Check budget before submission
     */
    public function checkBudgetBeforeSubmit(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->isDeptOffice()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only department staff can submit trip tickets'
                ], 403);
            }

            $departmentId = $user->department_id;

            $validator = Validator::make($request->all(), [
                'driver_id' => 'required|exists:drivers,driver_id',
                'vehicle_id' => 'required|exists:vehicles,vehicle_id',
                'trip_date' => 'required|date|after_or_equal:today',
                'destination' => 'required|string|max:255',
                'purpose' => 'required|string',
                'charge_to' => 'required|string|max:120',
                'passenger_name' => 'nullable|string|max:120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $vehicle = Vehicle::find($request->vehicle_id);
            if (!$vehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle not found'
                ], 404);
            }

            $estimatedDistance = $this->calculateDistanceFromConfig($request->destination);
            $estimatedFuel = $this->calculateEstimatedFuelFromConfig($vehicle, $estimatedDistance);
            $fuelPrice = $this->getFuelPriceFromConfig($vehicle->fuel_type ?? 'regular');
            $estimatedCost = round($estimatedFuel * $fuelPrice, 2);

            $budgetInfo = $this->getDepartmentBudgetFromConfig($departmentId);

            if ($budgetInfo['remaining'] >= $estimatedCost) {
                return response()->json([
                    'success' => true,
                    'can_proceed' => true,
                    'message' => 'Budget is sufficient. You can proceed with submission.',
                    'budget' => $budgetInfo,
                    'estimated_cost' => $estimatedCost,
                ]);
            }

            $requestId = $this->storeMORequestFromConfig($departmentId, $user->user_id, $request->all(), $budgetInfo, $estimatedCost);
            $this->notifyMOOfInsufficientBudgetFromConfig($departmentId, $budgetInfo, $estimatedCost, $requestId);

            return response()->json([
                'success' => false,
                'can_proceed' => false,
                'message' => 'Insufficient department budget. Request sent to Mayor\'s Office.',
                'budget' => $budgetInfo,
                'estimated_cost' => $estimatedCost,
                'shortage' => round($estimatedCost - $budgetInfo['remaining'], 2),
                'request_id' => $requestId,
            ]);
        } catch (\Exception $e) {
            Log::error('Check budget error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check budget: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store MO request in cache
     */
    private function storeMORequestFromConfig($departmentId, $userId, $ticketData, $budgetInfo, $estimatedCost)
    {
        $requestId = 'mo_req_' . uniqid() . '_' . time();

        Cache::put($requestId, [
            'department_id' => $departmentId,
            'requested_by' => $userId,
            'ticket_data' => $ticketData,
            'budget_info' => $budgetInfo,
            'estimated_cost' => $estimatedCost,
            'created_at' => now()->toDateTimeString(),
        ], now()->addHours(24));

        $requests = Cache::get('mo_requests_list', []);
        if (!in_array($requestId, $requests)) {
            $requests[] = $requestId;
            Cache::put('mo_requests_list', $requests, now()->addHours(24));
        }

        return $requestId;
    }

    /**
     * Notify Mayor's Office of insufficient budget
     */
    private function notifyMOOfInsufficientBudgetFromConfig($departmentId, $budgetInfo, $estimatedCost, $requestId)
    {
        $department = Department::find($departmentId);
        if (!$department) return;

        $moStaff = User::where('role', 'mayors_office')->where('status', 'active')->get();

        $shortage = $estimatedCost - $budgetInfo['remaining'];

        $message = sprintf(
            "🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: %s\nRemaining Budget: ₱%s\nEstimated Cost: ₱%s\nShortage: ₱%s",
            $department->department_name,
            number_format($budgetInfo['remaining'], 2),
            number_format($estimatedCost, 2),
            number_format($shortage, 2)
        );

        foreach ($moStaff as $staff) {
            Notification::create([
                'recipient_user_id' => $staff->user_id,
                'notification_type' => 'budget_assistance_request',
                'entity_type' => 'mo_request',
                'entity_id' => 0,
                'message' => $message,
                'channel' => 'in_app',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Get all pending MO requests (for Mayor's Office)
     */
    public function getAllMORequests()
    {
        try {
            $user = auth()->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Mayor\'s Office and Super Admin can access this.'
                ], 403);
            }

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

            usort($requests, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'data' => $requests,
                'total' => count($requests)
            ]);
        } catch (\Exception $e) {
            Log::error('Get all MO requests error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single MO request data
     */
    public function getMORequest($requestId)
    {
        try {
            $user = auth()->user();

            if ($user->role !== 'mayors_office' && $user->role !== 'superadmin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $requestData = Cache::get($requestId);

            if (!$requestData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or expired'
                ], 404);
            }

            $department = Department::find($requestData['department_id']);
            $requester = User::find($requestData['requested_by']);

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
                    'shortage' => $requestData['estimated_cost'] - $requestData['budget_info']['remaining'],
                    'created_at' => $requestData['created_at'],
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get MO request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get request details'
            ], 500);
        }
    }

    /**
     * Remove MO request from cache after processing
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
