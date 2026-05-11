<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DeptBudgetPolicy;
use App\Models\DeptBudgetPeriod;
use App\Models\Department;
use App\Models\GasSlip;
// ❌ REMOVED: use App\Models\FundIssuance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BudgetController extends Controller
{
    /**
     * Get budget periods for a department
     */
    public function getBudgetPeriods(Request $request, $departmentId = null)
    {
        try {
            $user = $request->user();
            
            if (!$departmentId) {
                $departmentId = $user->department_id;
            }
            
            // Check permission
            if (!$user->isSuperAdmin() && $user->department_id != $departmentId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $periods = DeptBudgetPeriod::where('department_id', $departmentId)
                ->orderBy('week_start', 'desc')
                ->paginate(15);
            
            // Add remaining amount to active periods
            foreach ($periods as $period) {
                $period->remaining_amount = $this->getRemainingAmount($period->period_id);
            }
            
            return response()->json([
                'success' => true,
                'data' => $periods
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get budget periods error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget periods: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get current budget status for a department
     */
    public function getBudgetStatus(Request $request, $departmentId = null)
    {
        try {
            $user = $request->user();
            
            if (!$departmentId) {
                $departmentId = $user->department_id;
            }
            
            // Check permission
            if (!$user->isSuperAdmin() && $user->department_id != $departmentId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Try to get from view first
            try {
                $budgetStatus = DB::table('v_remaining_budget')
                    ->where('department_id', $departmentId)
                    ->where('status', 'active')
                    ->first();
                
                if ($budgetStatus) {
                    return response()->json([
                        'success' => true,
                        'data' => $budgetStatus
                    ]);
                }
            } catch (\Exception $e) {
                // View might not exist, calculate manually
            }
            
            // Manual calculation if view doesn't exist
            $currentPeriod = DeptBudgetPeriod::where('department_id', $departmentId)
                ->where('status', 'active')
                ->where('week_start', '<=', now())
                ->where('week_end', '>=', now())
                ->first();
            
            if (!$currentPeriod) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active budget period found'
                ], 404);
            }
            
            // ✅ FIXED: Use GasSlip instead of FundIssuance
            $spentAmount = GasSlip::where('period_id', $currentPeriod->period_id)
                ->whereNotNull('acknowledged_at')
                ->sum('amount_released');
            
            $remainingAmount = $currentPeriod->allocated_amount - $spentAmount;
            
            return response()->json([
                'success' => true,
                'data' => (object)[
                    'department_id' => $departmentId,
                    'allocated_amount' => $currentPeriod->allocated_amount,
                    'spent_amount' => $spentAmount,
                    'remaining_amount' => $remainingAmount,
                    'week_start' => $currentPeriod->week_start,
                    'week_end' => $currentPeriod->week_end,
                    'status' => $currentPeriod->status,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get budget status error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get current department budget for authenticated user
     * ✅ FIXED: Use GasSlip instead of FundIssuance
     */
    public function getCurrentDepartmentBudget(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->department_id) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'weekly_allocation' => 0,
                        'used_this_week' => 0,
                        'remaining_budget' => 0,
                        'remaining_amount' => 0,
                        'allocated_amount' => 0,
                        'spent_amount' => 0,
                        'week_start' => null,
                        'week_end' => null,
                        'utilization_percentage' => 0
                    ]
                ]);
            }
            
            // Get current active budget period
            $currentPeriod = DeptBudgetPeriod::where('department_id', $user->department_id)
                ->where('status', 'active')
                ->first();
            
            if (!$currentPeriod) {
                // Try to create a period from policy
                $policy = DeptBudgetPolicy::where('department_id', $user->department_id)->first();
                
                if ($policy) {
                    $currentPeriod = DeptBudgetPeriod::create([
                        'department_id' => $user->department_id,
                        'week_start' => now()->startOfWeek(),
                        'week_end' => now()->endOfWeek(),
                        'allocated_amount' => $policy->default_weekly_allocation,
                        'status' => 'active',
                        'created_at' => now(),
                    ]);
                } else {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'weekly_allocation' => 0,
                            'used_this_week' => 0,
                            'remaining_budget' => 0,
                            'remaining_amount' => 0,
                            'allocated_amount' => 0,
                            'spent_amount' => 0,
                            'week_start' => null,
                            'week_end' => null,
                            'utilization_percentage' => 0
                        ]
                    ]);
                }
            }
            
            // ✅ FIXED: Use GasSlip instead of FundIssuance
            $usedBudget = GasSlip::where('period_id', $currentPeriod->period_id)
                ->whereNotNull('acknowledged_at')
                ->sum('amount_released');
            
            $remaining = $currentPeriod->allocated_amount - $usedBudget;
            $utilization = $currentPeriod->allocated_amount > 0 
                ? round(($usedBudget / $currentPeriod->allocated_amount) * 100, 2) 
                : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'weekly_allocation' => (float) $currentPeriod->allocated_amount,
                    'used_this_week' => (float) $usedBudget,
                    'remaining_budget' => (float) max(0, $remaining),
                    'remaining_amount' => (float) max(0, $remaining),
                    'allocated_amount' => (float) $currentPeriod->allocated_amount,
                    'spent_amount' => (float) $usedBudget,
                    'week_start' => $currentPeriod->week_start,
                    'week_end' => $currentPeriod->week_end,
                    'utilization_percentage' => $utilization,
                    'period_start' => $currentPeriod->week_start,
                    'period_end' => $currentPeriod->week_end,
                    'status' => $currentPeriod->status,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get current department budget error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get budget policy for a department
     */
    public function getBudgetPolicy(Request $request, $departmentId = null)
    {
        try {
            $user = $request->user();
            
            if (!$departmentId) {
                $departmentId = $user->department_id;
            }
            
            if (!$user->isSuperAdmin() && $user->department_id != $departmentId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $policy = DeptBudgetPolicy::with('department')
                ->where('department_id', $departmentId)
                ->first();
            
            if (!$policy) {
                return response()->json([
                    'success' => false,
                    'message' => 'Budget policy not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $policy
            ]);
        } catch (\Exception $e) {
            Log::error('Get budget policy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget policy: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update budget policy (superadmin only)
     */
    public function updateBudgetPolicy(Request $request, $departmentId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'default_weekly_allocation' => 'required|numeric|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $user = $request->user();
            
            if (!$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $policy = DeptBudgetPolicy::updateOrCreate(
                ['department_id' => $departmentId],
                ['default_weekly_allocation' => $request->default_weekly_allocation]
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Budget policy updated successfully',
                'data' => $policy
            ]);
        } catch (\Exception $e) {
            Log::error('Update budget policy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update budget policy: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all budget policies (superadmin only)
     */
    public function getAllBudgetPolicies(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $policies = DeptBudgetPolicy::with('department')->get();
            
            return response()->json([
                'success' => true,
                'data' => $policies
            ]);
        } catch (\Exception $e) {
            Log::error('Get all budget policies error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget policies: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Force activate a budget period for a department
     */
    public function forceActivate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'department_id' => 'required|exists:departments,department_id',
                'amount' => 'required|numeric|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $user = $request->user();
            
            if (!$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            DB::beginTransaction();
            
            // Close any existing active periods for this department
            DeptBudgetPeriod::where('department_id', $request->department_id)
                ->where('status', 'active')
                ->update(['status' => 'closed', 'closed_at' => now()]);
            
            // Create new active period
            $period = DeptBudgetPeriod::create([
                'department_id' => $request->department_id,
                'week_start' => now()->startOfWeek(),
                'week_end' => now()->endOfWeek(),
                'allocated_amount' => $request->amount,
                'status' => 'active',
                'created_at' => now(),
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Budget period activated successfully',
                'data' => $period
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Force activate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate budget period: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Run weekly budget reset for all departments
     */
    public function runWeeklyReset(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            // Try to call the stored procedure
            try {
                DB::statement('CALL proc_weekly_budget_reset()');
                
                return response()->json([
                    'success' => true,
                    'message' => 'Weekly budget reset completed successfully'
                ]);
            } catch (\Exception $e) {
                // If stored procedure doesn't exist, do it manually
                
                DB::beginTransaction();
                
                // Close all active periods
                $closedCount = DeptBudgetPeriod::where('status', 'active')
                    ->update(['status' => 'closed', 'closed_at' => now()]);
                
                // Get all policies
                $policies = DeptBudgetPolicy::all();
                $createdCount = 0;
                
                $weekStart = now()->startOfWeek();
                $weekEnd = now()->endOfWeek();
                
                // Create new active periods for each policy
                foreach ($policies as $policy) {
                    // Check if period already exists for this week
                    $exists = DeptBudgetPeriod::where('department_id', $policy->department_id)
                        ->where('week_start', $weekStart)
                        ->exists();
                    
                    if (!$exists) {
                        DeptBudgetPeriod::create([
                            'department_id' => $policy->department_id,
                            'week_start' => $weekStart,
                            'week_end' => $weekEnd,
                            'allocated_amount' => $policy->default_weekly_allocation,
                            'status' => 'active',
                            'created_at' => now(),
                        ]);
                        $createdCount++;
                    }
                }
                
                DB::commit();
                
                // Log the reset event
                DB::table('event_run_log')->insert([
                    'event_name' => 'proc_weekly_budget_reset',
                    'status' => 'success',
                    'periods_closed' => $closedCount,
                    'periods_created' => $createdCount,
                    'run_at' => now(),
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Weekly budget reset completed successfully',
                    'periods_closed' => $closedCount,
                    'periods_created' => $createdCount
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Run weekly reset error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to run weekly reset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get budget summary for all departments (superadmin only)
     * ✅ FIXED: Use GasSlip instead of FundIssuance
     */
    public function getBudgetSummary(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->isSuperAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $summary = [];
            $departments = Department::all();
            
            foreach ($departments as $department) {
                $currentPeriod = DeptBudgetPeriod::where('department_id', $department->department_id)
                    ->where('status', 'active')
                    ->first();
                
                if ($currentPeriod) {
                    // ✅ FIXED: Use GasSlip instead of FundIssuance
                    $spent = GasSlip::where('period_id', $currentPeriod->period_id)
                        ->whereNotNull('acknowledged_at')
                        ->sum('amount_released');
                    
                    $summary[] = [
                        'department_id' => $department->department_id,
                        'department_name' => $department->department_name,
                        'department_code' => $department->department_code,
                        'allocated_amount' => (float) $currentPeriod->allocated_amount,
                        'spent_amount' => (float) $spent,
                        'remaining_amount' => (float) ($currentPeriod->allocated_amount - $spent),
                        'utilization_percentage' => $currentPeriod->allocated_amount > 0 
                            ? round(($spent / $currentPeriod->allocated_amount) * 100, 2) 
                            : 0,
                        'week_start' => $currentPeriod->week_start,
                        'week_end' => $currentPeriod->week_end,
                    ];
                } else {
                    $summary[] = [
                        'department_id' => $department->department_id,
                        'department_name' => $department->department_name,
                        'department_code' => $department->department_code,
                        'allocated_amount' => 0,
                        'spent_amount' => 0,
                        'remaining_amount' => 0,
                        'utilization_percentage' => 0,
                        'week_start' => null,
                        'week_end' => null,
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            Log::error('Get budget summary error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget summary: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get remaining amount for a budget period
     * ✅ FIXED: Use GasSlip instead of FundIssuance
     */
    private function getRemainingAmount($periodId)
    {
        $period = DeptBudgetPeriod::find($periodId);
        if (!$period) {
            return 0;
        }
        
        $spent = GasSlip::where('period_id', $periodId)
            ->whereNotNull('acknowledged_at')
            ->sum('amount_released');
        return $period->allocated_amount - $spent;
    }
}