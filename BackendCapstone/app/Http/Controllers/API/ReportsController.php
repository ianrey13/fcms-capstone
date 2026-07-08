<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TripTicket;
use App\Models\FuelLog;
use App\Models\Vehicle;
use App\Models\Department;
use App\Models\DeptBudgetPeriod;
use App\Models\GasSlip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * Get Trip Report
     * GET /api/reports/trips
     */
    public function getTripReport(Request $request)
    {
        try {
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $departmentId = $request->get('department_id');
            $status = $request->get('status');

            $query = TripTicket::with([
                'department',
                'driver.user',
                'vehicle',
                'gasSlip'
            ]);

            if ($startDate && $endDate) {
                $query->whereBetween('trip_date', [$startDate, $endDate]);
            }

            if ($departmentId) {
                $query->where('department_id', $departmentId);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $trips = $query->orderBy('trip_date', 'desc')->get();

            $statusBreakdown = $trips->groupBy('status')->map(function($group) {
                return $group->count();
            });

            $departmentBreakdown = $trips->groupBy('department_id')->map(function($group) {
                $first = $group->first();
                return [
                    'department_id' => $first->department_id,
                    'department_name' => $first->department->department_name ?? 'Unknown',
                    'total' => $group->count(),
                    'pending' => $group->where('status', 'pending_mayors_office')->count(),
                    'in_transit' => $group->where('status', 'in_transit')->count(),
                    'completed' => $group->where('status', 'closed')->count(),
                    'rejected' => $group->where('status', 'rejected')->count(),
                ];
            })->values();

            $monthlyTrend = $trips->groupBy(function($trip) {
                return $trip->trip_date ? Carbon::parse($trip->trip_date)->format('Y-m') : 'Unknown';
            })->map(function($group) {
                return [
                    'month' => $group->first()->trip_date ? Carbon::parse($group->first()->trip_date)->format('M Y') : 'Unknown',
                    'count' => $group->count(),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_trips' => $trips->count(),
                    'status_breakdown' => $statusBreakdown,
                    'department_breakdown' => $departmentBreakdown,
                    'monthly_trend' => $monthlyTrend,
                    'recent_trips' => $trips->take(20)->map(function($trip) {
                        return [
                            'trip_ticket_id' => $trip->trip_ticket_id,
                            'trip_ticket_number' => $trip->trip_ticket_number,
                            'destination' => $trip->destination,
                            'purpose' => $trip->purpose,
                            'trip_date' => $trip->trip_date,
                            'department_name' => $trip->department->department_name ?? 'Unknown',
                            'driver_name' => $trip->driver->user->full_name ?? 'Unknown',
                            'vehicle_plate' => $trip->vehicle->plate_number ?? 'Unknown',
                            'status' => $trip->status,
                            'amount_released' => $trip->gasSlip->amount_released ?? 0,
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Trip report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate trip report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Fuel Report
     * GET /api/reports/fuel
     */
    public function getFuelReport(Request $request)
    {
        try {
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $departmentId = $request->get('department_id');
            $vehicleId = $request->get('vehicle_id');

            $query = FuelLog::with([
                'gasSlip.tripTicket.department',
                'gasSlip.tripTicket.vehicle',
                'gasSlip.tripTicket.driver.user'
            ]);

            if ($startDate && $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }

            if ($departmentId) {
                $query->whereHas('gasSlip.tripTicket', function($q) use ($departmentId) {
                    $q->where('department_id', $departmentId);
                });
            }

            if ($vehicleId) {
                $query->whereHas('gasSlip.tripTicket', function($q) use ($vehicleId) {
                    $q->where('vehicle_id', $vehicleId);
                });
            }

            $fuelLogs = $query->get();

            // Summary
            $totalLiters = $fuelLogs->sum('liters_availed');
            $totalCost = $fuelLogs->sum('amount_on_receipt');
            $totalTrips = $fuelLogs->unique('gas_slip.trip_ticket_id')->count();

            // Department breakdown
            $departmentBreakdown = $fuelLogs->groupBy(function($log) {
                return $log->gasSlip->tripTicket->department->department_name ?? 'Unknown';
            })->map(function($group) {
                return [
                    'department_name' => $group->first()->gasSlip->tripTicket->department->department_name ?? 'Unknown',
                    'trips' => $group->unique('gas_slip.trip_ticket_id')->count(),
                    'liters' => round($group->sum('liters_availed'), 2),
                    'cost' => round($group->sum('amount_on_receipt'), 2),
                ];
            })->values();

            // Vehicle breakdown
            $vehicleBreakdown = $fuelLogs->groupBy(function($log) {
                $vehicle = $log->gasSlip->tripTicket->vehicle;
                return $vehicle ? $vehicle->plate_number : 'Unknown';
            })->map(function($group) {
                $first = $group->first();
                $vehicle = $first->gasSlip->tripTicket->vehicle;
                $totalDistance = $this->calculateTotalDistance($group);
                $totalLiters = $group->sum('liters_availed');
                
                return [
                    'plate_number' => $vehicle ? $vehicle->plate_number : 'Unknown',
                    'model' => $vehicle ? $vehicle->vehicle_model : 'Unknown',
                    'fuel_type' => $vehicle ? $vehicle->fuel_type : 'Unknown',
                    'trips' => $group->unique('gas_slip.trip_ticket_id')->count(),
                    'liters' => round($totalLiters, 2),
                    'cost' => round($group->sum('amount_on_receipt'), 2),
                    'distance_km' => round($totalDistance, 2),
                    'km_per_liter' => $totalLiters > 0 ? round($totalDistance / $totalLiters, 2) : 0,
                ];
            })->values();

            // Monthly trend
            $monthlyTrend = $fuelLogs->groupBy(function($log) {
                return $log->created_at ? Carbon::parse($log->created_at)->format('Y-m') : 'Unknown';
            })->map(function($group) {
                return [
                    'month' => $group->first()->created_at ? Carbon::parse($group->first()->created_at)->format('M Y') : 'Unknown',
                    'liters' => round($group->sum('liters_availed'), 2),
                    'cost' => round($group->sum('amount_on_receipt'), 2),
                    'trips' => $group->unique('gas_slip.trip_ticket_id')->count(),
                ];
            })->values();

            $totalDistance = $this->calculateTotalDistance($fuelLogs);

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_trips' => $totalTrips,
                        'total_liters' => round($totalLiters, 2),
                        'total_cost' => round($totalCost, 2),
                        'total_distance_km' => round($totalDistance, 2),
                        'average_km_per_liter' => $totalLiters > 0 ? round($totalDistance / $totalLiters, 2) : 0,
                        'average_cost_per_km' => $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : 0,
                    ],
                    'department_breakdown' => $departmentBreakdown,
                    'vehicle_breakdown' => $vehicleBreakdown,
                    'monthly_trend' => $monthlyTrend,
                    'recent_fuel_logs' => $fuelLogs->take(20)->map(function($log) {
                        $trip = $log->gasSlip->tripTicket;
                        return [
                            'ticket_number' => $trip->trip_ticket_number,
                            'department' => $trip->department->department_name ?? 'Unknown',
                            'vehicle' => $trip->vehicle->plate_number ?? 'Unknown',
                            'driver' => $trip->driver->user->full_name ?? 'Unknown',
                            'destination' => $trip->destination,
                            'liters' => $log->liters_availed,
                            'cost' => $log->amount_on_receipt,
                            'date' => $log->created_at ? $log->created_at->format('Y-m-d') : null,
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Fuel report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate fuel report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Budget Report
     * GET /api/reports/budget
     */
    public function getBudgetReport(Request $request)
    {
        try {
            $departmentId = $request->get('department_id');
            $periodId = $request->get('period_id');

            $query = DeptBudgetPeriod::with(['department']);

            if ($departmentId) {
                $query->where('department_id', $departmentId);
            }

            if ($periodId) {
                $query->where('period_id', $periodId);
            }

            $periods = $query->orderBy('week_start', 'desc')->get();

            $budgetData = $periods->map(function($period) {
                $used = GasSlip::where('period_id', $period->period_id)->sum('amount_released');
                $allocated = $period->allocated_amount;
                $remaining = $allocated - $used;
                $utilization = $allocated > 0 ? round(($used / $allocated) * 100, 2) : 0;

                return [
                    'period_id' => $period->period_id,
                    'department_id' => $period->department_id,
                    'department_name' => $period->department->department_name ?? 'Unknown',
                    'week_start' => $period->week_start,
                    'week_end' => $period->week_end,
                    'allocated' => round($allocated, 2),
                    'used' => round($used, 2),
                    'remaining' => round($remaining, 2),
                    'utilization_percentage' => $utilization,
                    'status' => $period->status,
                    'is_over_budget' => $remaining < 0,
                ];
            });

            // Summary totals
            $totalAllocated = $budgetData->sum('allocated');
            $totalUsed = $budgetData->sum('used');
            $totalRemaining = $budgetData->sum('remaining');

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_allocated' => round($totalAllocated, 2),
                        'total_used' => round($totalUsed, 2),
                        'total_remaining' => round($totalRemaining, 2),
                        'overall_utilization' => $totalAllocated > 0 ? round(($totalUsed / $totalAllocated) * 100, 2) : 0,
                        'total_departments' => $budgetData->unique('department_id')->count(),
                    ],
                    'periods' => $budgetData,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Budget report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate budget report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Vehicle Report
     * GET /api/reports/vehicles
     */
    public function getVehicleReport(Request $request)
    {
        try {
            $vehicles = Vehicle::with(['trips' => function($q) {
                $q->where('status', 'closed')
                  ->with(['gasSlip.fuelLog']);
            }])->get();

            $vehicleData = $vehicles->map(function($vehicle) {
                $trips = $vehicle->trips;
                $totalLiters = 0;
                $totalCost = 0;
                $totalDistance = 0;
                $tripCount = $trips->count();

                foreach ($trips as $trip) {
                    if ($trip->gasSlip && $trip->gasSlip->fuelLog) {
                        $fuelLog = $trip->gasSlip->fuelLog;
                        $totalLiters += $fuelLog->liters_availed ?? 0;
                        $totalCost += $fuelLog->amount_on_receipt ?? 0;
                        
                        if ($fuelLog->odometer_start && $fuelLog->odometer_end) {
                            $totalDistance += ($fuelLog->odometer_end - $fuelLog->odometer_start);
                        } elseif ($fuelLog->gps_distance_km) {
                            $totalDistance += $fuelLog->gps_distance_km;
                        }
                    }
                }

                return [
                    'vehicle_id' => $vehicle->vehicle_id,
                    'plate_number' => $vehicle->plate_number,
                    'model' => $vehicle->vehicle_model,
                    'fuel_type' => $vehicle->fuel_type,
                    'odometer_status' => $vehicle->odometer_status,
                    'maintenance_flag' => $vehicle->maintenance_flag,
                    'trip_count' => $tripCount,
                    'total_liters' => round($totalLiters, 2),
                    'total_cost' => round($totalCost, 2),
                    'total_distance_km' => round($totalDistance, 2),
                    'km_per_liter' => $totalLiters > 0 ? round($totalDistance / $totalLiters, 2) : 0,
                    'cost_per_km' => $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : 0,
                    'efficiency_rating' => $this->getEfficiencyRating($totalLiters, $totalDistance),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $vehicleData
            ]);

        } catch (\Exception $e) {
            Log::error('Vehicle report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate vehicle report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Report Summary
     * GET /api/reports/summary
     */
    public function getReportSummary(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));

            // Total trips
            $totalTrips = TripTicket::count();
            $activeTrips = TripTicket::whereIn('status', ['in_transit', 'funds_issued'])->count();
            $completedTrips = TripTicket::where('status', 'closed')->count();

            // Fuel summary
            $fuelSummary = FuelLog::select(
                DB::raw('SUM(liters_availed) as total_liters'),
                DB::raw('SUM(amount_on_receipt) as total_cost'),
                DB::raw('COUNT(DISTINCT gas_slip_id) as total_entries')
            )->first();

            // Budget summary
            $budgetSummary = DeptBudgetPeriod::select(
                DB::raw('SUM(allocated_amount) as total_allocated')
            )->where('status', 'active')->first();

            $usedBudget = GasSlip::sum('amount_released');

            // Department count
            $totalDepartments = Department::where('is_active', 1)->count();

            // Vehicle count
            $totalVehicles = Vehicle::where('status', 'active')->count();

            // Monthly trend (last 6 months)
            $monthlyTrips = TripTicket::select(
                DB::raw('YEAR(trip_date) as year'),
                DB::raw('MONTH(trip_date) as month'),
                DB::raw('COUNT(*) as count')
            )
            ->where('trip_date', '>=', Carbon::now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'month' => Carbon::createFromDate($item->year, $item->month, 1)->format('M Y'),
                    'count' => $item->count,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'trips' => [
                        'total' => $totalTrips,
                        'active' => $activeTrips,
                        'completed' => $completedTrips,
                        'monthly_trend' => $monthlyTrips,
                    ],
                    'fuel' => [
                        'total_liters' => round($fuelSummary->total_liters ?? 0, 2),
                        'total_cost' => round($fuelSummary->total_cost ?? 0, 2),
                        'total_entries' => $fuelSummary->total_entries ?? 0,
                    ],
                    'budget' => [
                        'total_allocated' => round($budgetSummary->total_allocated ?? 0, 2),
                        'used' => round($usedBudget, 2),
                        'remaining' => round(($budgetSummary->total_allocated ?? 0) - $usedBudget, 2),
                    ],
                    'resources' => [
                        'departments' => $totalDepartments,
                        'vehicles' => $totalVehicles,
                    ],
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Report summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate report summary: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // EXPORT METHODS
    // ============================================

    /**
     * Export Trip Report
     * GET /api/reports/trips/export/{format}
     */
    public function exportTripReport(Request $request, $format)
    {
        try {
            $data = $this->getTripReport($request)->getData();
            
            if ($format === 'pdf') {
                // PDF export logic
                return $this->exportToPDF($data->data, 'trip_report');
            } elseif ($format === 'excel') {
                // Excel export logic
                return $this->exportToExcel($data->data, 'trip_report');
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported format: ' . $format
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Export trip report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Fuel Report
     * GET /api/reports/fuel/export/{format}
     */
    public function exportFuelReport(Request $request, $format)
    {
        try {
            $data = $this->getFuelReport($request)->getData();
            
            if ($format === 'pdf') {
                return $this->exportToPDF($data->data, 'fuel_report');
            } elseif ($format === 'excel') {
                return $this->exportToExcel($data->data, 'fuel_report');
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported format: ' . $format
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Export fuel report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export Budget Report
     * GET /api/reports/budget/export/{format}
     */
    public function exportBudgetReport(Request $request, $format)
    {
        try {
            $data = $this->getBudgetReport($request)->getData();
            
            if ($format === 'pdf') {
                return $this->exportToPDF($data->data, 'budget_report');
            } elseif ($format === 'excel') {
                return $this->exportToExcel($data->data, 'budget_report');
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported format: ' . $format
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Export budget report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export report: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private function calculateTotalDistance($fuelLogs)
    {
        $totalDistance = 0;
        foreach ($fuelLogs as $log) {
            if ($log->odometer_start && $log->odometer_end) {
                $totalDistance += ($log->odometer_end - $log->odometer_start);
            } elseif ($log->gps_distance_km) {
                $totalDistance += $log->gps_distance_km;
            }
        }
        return $totalDistance;
    }

    private function getEfficiencyRating($liters, $distance)
    {
        if ($liters == 0 || $distance == 0) return 'No Data';
        
        $kmPerLiter = $distance / $liters;
        
        if ($kmPerLiter >= 10) return 'Excellent';
        if ($kmPerLiter >= 7) return 'Good';
        if ($kmPerLiter >= 5) return 'Average';
        if ($kmPerLiter >= 3) return 'Poor';
        return 'Critical - Needs Maintenance';
    }

    private function exportToPDF($data, $name)
    {
        // Placeholder for PDF export
        return response()->json([
            'success' => true,
            'message' => 'PDF export coming soon',
            'data' => $data
        ]);
    }

    private function exportToExcel($data, $name)
    {
        // Placeholder for Excel export
        return response()->json([
            'success' => true,
            'message' => 'Excel export coming soon',
            'data' => $data
        ]);
    }
}