<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\FuelLog;
use App\Models\GasSlip;
use App\Models\FundIssuance;
use App\Models\Department;
use App\Models\Vehicle;
use App\Models\DeptBudgetPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportsController extends Controller
{
    /**
     * Get trip report data
     */
    public function getTripReport(Request $request)
    {
        try {
            $user = $request->user();
            $query = TripTicket::with(['department', 'vehicle', 'driver.user', 'gasSlip']);
            
            // Apply date filters
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('trip_date', [$request->start_date, $request->end_date]);
            }
            
            // Apply department filter
            if ($request->has('department_id')) {
                $query->where('department_id', $request->department_id);
            }
            
            // Apply status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            $trips = $query->orderBy('trip_date', 'desc')->get();
            
            $data = $trips->map(function($trip) {
                return [
                    'id' => $trip->trip_ticket_id,
                    'ticket_number' => $trip->trip_ticket_number,
                    'trip_date' => $trip->trip_date,
                    'destination' => $trip->destination,
                    'purpose' => $trip->purpose,
                    'status' => $trip->status,
                    'department_id' => $trip->department_id,
                    'department_name' => $trip->department ? $trip->department->department_name : null,
                    'vehicle' => $trip->vehicle ? [
                        'plate_number' => $trip->vehicle->plate_number,
                        'vehicle_model' => $trip->vehicle->vehicle_model,
                    ] : null,
                    'driver' => $trip->driver && $trip->driver->user ? [
                        'full_name' => $trip->driver->user->full_name,
                    ] : null,
                    'amount_released' => $trip->gasSlip ? $trip->gasSlip->amount_released : 0,
                    'created_at' => $trip->submitted_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'total' => $data->count(),
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get trip report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch trip report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get fuel report data
     */
    public function getFuelReport(Request $request)
    {
        try {
            $user = $request->user();
            $query = FuelLog::with(['gasSlip.tripTicket.department', 'gasSlip.tripTicket.vehicle']);
            
            // Apply date filters
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
            }
            
            $fuelLogs = $query->orderBy('created_at', 'desc')->get();
            
            $data = $fuelLogs->map(function($log) {
                $trip = $log->gasSlip ? $log->gasSlip->tripTicket : null;
                return [
                    'id' => $log->fuel_log_id,
                    'liters_availed' => $log->liters_availed,
                    'amount_on_receipt' => $log->amount_on_receipt,
                    'odometer_out' => $log->odometer_out,
                    'odometer_in' => $log->odometer_in,
                    'created_at' => $log->created_at,
                    'trip' => $trip ? [
                        'ticket_number' => $trip->trip_ticket_number,
                        'destination' => $trip->destination,
                        'department_name' => $trip->department ? $trip->department->department_name : null,
                    ] : null,
                ];
            });
            
            // Calculate summary
            $totalLiters = $fuelLogs->sum('liters_availed');
            $totalAmount = $fuelLogs->sum('amount_on_receipt');
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'summary' => [
                    'total_liters' => $totalLiters,
                    'total_amount' => $totalAmount,
                    'average_liters_per_trip' => $fuelLogs->count() > 0 ? $totalLiters / $fuelLogs->count() : 0,
                ],
                'meta' => [
                    'total' => $data->count(),
                    'start_date' => $request->start_date,
                    'end_date' => $request->end_date,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get fuel report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch fuel report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get budget report data
     */
    public function getBudgetReport(Request $request)
    {
        try {
            $user = $request->user();
            $query = DeptBudgetPeriod::with('department');
            
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('week_start', [$request->start_date, $request->end_date]);
            }
            
            if ($request->has('department_id')) {
                $query->where('department_id', $request->department_id);
            }
            
            $periods = $query->orderBy('week_start', 'desc')->get();
            
            $data = $periods->map(function($period) {
                $spent = FundIssuance::where('period_id', $period->period_id)->sum('amount_released');
                return [
                    'department_id' => $period->department_id,
                    'department_name' => $period->department ? $period->department->department_name : null,
                    'week_start' => $period->week_start,
                    'week_end' => $period->week_end,
                    'allocated_amount' => $period->allocated_amount,
                    'spent_amount' => $spent,
                    'remaining_amount' => $period->allocated_amount - $spent,
                    'utilization_percentage' => $period->allocated_amount > 0 
                        ? round(($spent / $period->allocated_amount) * 100, 2) 
                        : 0,
                    'status' => $period->status,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get budget report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get vehicle report
     */
    public function getVehicleReport(Request $request)
    {
        try {
            $user = $request->user();
            $vehicles = Vehicle::with('department')->get();
            
            $data = $vehicles->map(function($vehicle) {
                // Count trips for this vehicle
                $trips = TripTicket::where('vehicle_id', $vehicle->vehicle_id)->get();
                $totalFuelUsed = 0;
                $totalDistance = 0;
                
                foreach ($trips as $trip) {
                    if ($trip->gasSlip && $trip->gasSlip->fuelLog) {
                        $totalFuelUsed += $trip->gasSlip->fuelLog->liters_availed ?? 0;
                        $totalDistance += ($trip->gasSlip->fuelLog->odometer_in ?? 0) - ($trip->gasSlip->fuelLog->odometer_out ?? 0);
                    }
                }
                
                return [
                    'vehicle_id' => $vehicle->vehicle_id,
                    'vehicle_model' => $vehicle->vehicle_model,
                    'plate_number' => $vehicle->plate_number,
                    'fuel_type' => $vehicle->fuel_type,
                    'status' => $vehicle->status,
                    'department_name' => $vehicle->department ? $vehicle->department->department_name : null,
                    'total_trips' => $trips->count(),
                    'total_fuel_used' => $totalFuelUsed,
                    'total_distance' => $totalDistance,
                    'average_fuel_efficiency' => $totalDistance > 0 && $totalFuelUsed > 0 
                        ? round($totalDistance / $totalFuelUsed, 2) 
                        : 0,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get vehicle report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vehicle report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get report summary dashboard data
     */
    public function getReportSummary(Request $request)
    {
        try {
            $user = $request->user();
            
            // Date range filter
            $startDate = $request->start_date ?? now()->subDays(30);
            $endDate = $request->end_date ?? now();
            
            // Trip statistics
            $totalTrips = TripTicket::count();
            $pendingTrips = TripTicket::whereIn('status', [
                TripTicket::STATUS_PENDING_HEAD_APPROVAL,
                TripTicket::STATUS_PENDING_GSO_REVIEW,
                TripTicket::STATUS_PENDING_MAYORS_OFFICE
            ])->count();
            $completedTrips = TripTicket::where('status', TripTicket::STATUS_CLOSED)->count();
            $cancelledTrips = TripTicket::where('status', TripTicket::STATUS_CANCELLED)->count();
            
            // Budget statistics
            $totalBudgetAllocated = DeptBudgetPeriod::where('status', 'active')->sum('allocated_amount');
            $totalBudgetSpent = FundIssuance::sum('amount_released');
            $budgetUtilization = $totalBudgetAllocated > 0 
                ? round(($totalBudgetSpent / $totalBudgetAllocated) * 100, 2) 
                : 0;
            
            // Fuel statistics
            $totalFuelUsed = FuelLog::sum('liters_availed');
            $totalFuelCost = FuelLog::sum('amount_on_receipt');
            $averageFuelPrice = $totalFuelUsed > 0 ? $totalFuelCost / $totalFuelUsed : 0;
            
            // Department breakdown
            $departmentStats = Department::withCount('tripTickets')->get()->map(function($dept) {
                $trips = TripTicket::where('department_id', $dept->department_id)->get();
                $budgetPeriod = DeptBudgetPeriod::where('department_id', $dept->department_id)
                    ->where('status', 'active')
                    ->first();
                $spent = FundIssuance::whereHas('gasSlip.tripTicket', function($q) use ($dept) {
                    $q->where('department_id', $dept->department_id);
                })->sum('amount_released');
                
                return [
                    'name' => $dept->department_name,
                    'total_trips' => $trips->count(),
                    'allocated_budget' => $budgetPeriod ? $budgetPeriod->allocated_amount : 0,
                    'spent_budget' => $spent,
                    'utilization' => $budgetPeriod && $budgetPeriod->allocated_amount > 0 
                        ? round(($spent / $budgetPeriod->allocated_amount) * 100, 2) 
                        : 0,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'trips' => [
                        'total' => $totalTrips,
                        'pending' => $pendingTrips,
                        'completed' => $completedTrips,
                        'cancelled' => $cancelledTrips,
                    ],
                    'budget' => [
                        'total_allocated' => $totalBudgetAllocated,
                        'total_spent' => $totalBudgetSpent,
                        'utilization' => $budgetUtilization,
                    ],
                    'fuel' => [
                        'total_liters' => $totalFuelUsed,
                        'total_cost' => $totalFuelCost,
                        'average_price' => $averageFuelPrice,
                    ],
                    'departments' => $departmentStats,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get report summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch report summary: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export trip report to CSV (without PDF)
     */
    public function exportTripReport(Request $request, $format)
    {
        try {
            $trips = TripTicket::with(['department', 'vehicle', 'driver.user', 'gasSlip'])
                ->when($request->start_date, function($q) use ($request) {
                    return $q->whereDate('trip_date', '>=', $request->start_date);
                })
                ->when($request->end_date, function($q) use ($request) {
                    return $q->whereDate('trip_date', '<=', $request->end_date);
                })
                ->orderBy('trip_date', 'desc')
                ->get();
            
            $filename = 'trip-report-' . now()->format('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            
            // Add headers
            fputcsv($handle, ['Ticket #', 'Trip Date', 'Destination', 'Department', 'Vehicle', 'Driver', 'Amount', 'Status']);
            
            // Add data
            foreach ($trips as $trip) {
                fputcsv($handle, [
                    $trip->trip_ticket_number,
                    $trip->trip_date,
                    $trip->destination,
                    $trip->department->department_name ?? 'N/A',
                    $trip->vehicle->plate_number ?? 'N/A',
                    $trip->driver->user->full_name ?? 'N/A',
                    $trip->gasSlip->amount_released ?? 0,
                    $trip->status,
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return response($csvContent)
                ->withHeaders([
                    'Content-Type' => 'text/csv; charset=UTF-8',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            
        } catch (\Exception $e) {
            Log::error('Export trip report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export fuel report to CSV
     */
    public function exportFuelReport(Request $request, $format)
    {
        try {
            $fuelLogs = FuelLog::with(['gasSlip.tripTicket'])
                ->when($request->start_date, function($q) use ($request) {
                    return $q->whereDate('created_at', '>=', $request->start_date);
                })
                ->when($request->end_date, function($q) use ($request) {
                    return $q->whereDate('created_at', '<=', $request->end_date);
                })
                ->get();
            
            $filename = 'fuel-report-' . now()->format('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            
            fputcsv($handle, ['Ticket #', 'Destination', 'Liters', 'Amount', 'Date', 'Odometer Out', 'Odometer In']);
            
            foreach ($fuelLogs as $log) {
                $trip = $log->gasSlip->tripTicket ?? null;
                fputcsv($handle, [
                    $trip->trip_ticket_number ?? 'N/A',
                    $trip->destination ?? 'N/A',
                    $log->liters_availed,
                    $log->amount_on_receipt,
                    $log->created_at,
                    $log->odometer_out,
                    $log->odometer_in,
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return response($csvContent)
                ->withHeaders([
                    'Content-Type' => 'text/csv; charset=UTF-8',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            
        } catch (\Exception $e) {
            Log::error('Export fuel report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export budget report to CSV
     */
    public function exportBudgetReport(Request $request, $format)
    {
        try {
            $periods = DeptBudgetPeriod::with('department')
                ->when($request->start_date, function($q) use ($request) {
                    return $q->whereDate('week_start', '>=', $request->start_date);
                })
                ->when($request->end_date, function($q) use ($request) {
                    return $q->whereDate('week_end', '<=', $request->end_date);
                })
                ->get();
            
            $filename = 'budget-report-' . now()->format('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            
            fputcsv($handle, ['Department', 'Week Start', 'Week End', 'Allocated', 'Spent', 'Remaining', 'Utilization', 'Status']);
            
            foreach ($periods as $period) {
                $spent = FundIssuance::where('period_id', $period->period_id)->sum('amount_released');
                fputcsv($handle, [
                    $period->department->department_name ?? 'N/A',
                    $period->week_start,
                    $period->week_end,
                    $period->allocated_amount,
                    $spent,
                    $period->allocated_amount - $spent,
                    $period->allocated_amount > 0 ? round(($spent / $period->allocated_amount) * 100, 2) . '%' : '0%',
                    $period->status,
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return response($csvContent)
                ->withHeaders([
                    'Content-Type' => 'text/csv; charset=UTF-8',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            
        } catch (\Exception $e) {
            Log::error('Export budget report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }
}