<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BudgetPolicyController extends Controller
{
    /**
     * Get all budget policies
     */
    public function index()
    {
        try {
            $policies = DB::table('dept_budget_policy as dbp')
                ->join('departments as d', 'dbp.department_id', '=', 'd.department_id')
                ->select('dbp.*', 'd.department_name', 'd.department_code')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $policies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch budget policies: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Create a new budget policy
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,department_id',
            'default_weekly_allocation' => 'required|numeric|min:0'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = $request->user();
        
        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        DB::beginTransaction();
        
        try {
            // Insert or update policy
            $existingPolicy = DB::table('dept_budget_policy')
                ->where('department_id', $request->department_id)
                ->first();
            
            if ($existingPolicy) {
                DB::table('dept_budget_policy')
                    ->where('department_id', $request->department_id)
                    ->update(['default_weekly_allocation' => $request->default_weekly_allocation]);
            } else {
                DB::table('dept_budget_policy')->insert([
                    'department_id' => $request->department_id,
                    'default_weekly_allocation' => $request->default_weekly_allocation,
                    'created_at' => now(),
                ]);
            }
            
            // Check if period already exists for this week
            $existingPeriod = DB::table('dept_budget_period')
                ->where('department_id', $request->department_id)
                ->where('week_start', now()->startOfWeek())
                ->first();
            
            if ($existingPeriod) {
                // Update existing period
                DB::table('dept_budget_period')
                    ->where('department_id', $request->department_id)
                    ->where('week_start', now()->startOfWeek())
                    ->update([
                        'week_end' => now()->endOfWeek(),
                        'allocated_amount' => $request->default_weekly_allocation,
                        'status' => 'closed'
                    ]);
            } else {
                // Insert new period
                DB::table('dept_budget_period')->insert([
                    'department_id' => $request->department_id,
                    'week_start' => now()->startOfWeek(),
                    'week_end' => now()->endOfWeek(),
                    'allocated_amount' => $request->default_weekly_allocation,
                    'status' => 'active',
                    'created_at' => now(),
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Budget policy created with active period'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create policy: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update a budget policy
     */
    public function update(Request $request, $departmentId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'default_weekly_allocation' => 'required|numeric|min:0'
            ]);
            
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            
            $updated = DB::table('dept_budget_policy')
                ->where('department_id', $departmentId)
                ->update([
                    'default_weekly_allocation' => $request->default_weekly_allocation,
                    'updated_at' => now(),
                ]);
            
            if ($updated === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Budget policy not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Budget policy updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update budget policy: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete a budget policy
     */
    public function destroy($departmentId)
    {
        try {
            $deleted = DB::table('dept_budget_policy')
                ->where('department_id', $departmentId)
                ->delete();
            
            if ($deleted === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Budget policy not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Budget policy deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete budget policy: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ✅ NEW: Force activate a budget period for a specific department
     * This creates a new active budget period for the department
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
            
            if ($user->role !== 'superadmin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $departmentId = $request->department_id;
            $amount = $request->amount;
            
            DB::beginTransaction();
            
            // Close any existing active periods for this department
            DB::table('dept_budget_period')
                ->where('department_id', $departmentId)
                ->where('status', 'active')
                ->update([
                    'status' => 'closed', 
                    'closed_at' => now()
                ]);
            
            // Get the department's policy to check if it exists
            $policy = DB::table('dept_budget_policy')
                ->where('department_id', $departmentId)
                ->first();
            
            if (!$policy) {
                // Create a policy if it doesn't exist
                DB::table('dept_budget_policy')->insert([
                    'department_id' => $departmentId,
                    'default_weekly_allocation' => $amount,
                    'created_at' => now(),
                ]);
            }
            
            // Create new active period starting today
            DB::table('dept_budget_period')->insert([
                'department_id' => $departmentId,
                'week_start' => now()->startOfWeek(),
                'week_end' => now()->endOfWeek(),
                'allocated_amount' => $amount,
                'status' => 'active',
                'created_at' => now(),
            ]);
            
            DB::commit();
            
            // Log the activation
            Log::info('Budget period force activated', [
                'department_id' => $departmentId,
                'amount' => $amount,
                'activated_by' => $user->user_id,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Budget period activated successfully',
                'data' => [
                    'department_id' => $departmentId,
                    'allocated_amount' => $amount,
                    'week_start' => now()->startOfWeek()->toDateString(),
                    'week_end' => now()->endOfWeek()->toDateString(),
                ]
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
     * ✅ NEW: Run weekly reset for all departments
     */
    public function runWeeklyReset(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'superadmin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            DB::beginTransaction();
            
            // Close all active periods
            $closedCount = DB::table('dept_budget_period')
                ->where('status', 'active')
                ->update([
                    'status' => 'closed', 
                    'closed_at' => now()
                ]);
            
            // Get all policies
            $policies = DB::table('dept_budget_policy')->get();
            $createdCount = 0;
            
            $weekStart = now()->startOfWeek();
            $weekEnd = now()->endOfWeek();
            
            // Create new active periods for each policy
            foreach ($policies as $policy) {
                // Check if period already exists for this week
                $exists = DB::table('dept_budget_period')
                    ->where('department_id', $policy->department_id)
                    ->where('week_start', $weekStart)
                    ->exists();
                
                if (!$exists) {
                    DB::table('dept_budget_period')->insert([
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
                'event_name' => 'weekly_budget_reset',
                'run_at' => now(),
                'status' => 'success',
                'periods_closed' => $closedCount,
                'periods_created' => $createdCount,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Weekly budget reset completed successfully',
                'periods_closed' => $closedCount,
                'periods_created' => $createdCount
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Weekly reset error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to run weekly reset: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get budget status for all departments
     */
    public function getBudgetStatus()
    {
        try {
            $status = DB::table('dept_budget_period as dbp')
                ->join('departments as d', 'dbp.department_id', '=', 'd.department_id')
                ->select(
                    'dbp.department_id',
                    'd.department_name',
                    'd.department_code',
                    'dbp.allocated_amount',
                    'dbp.week_start',
                    'dbp.week_end',
                    'dbp.status'
                )
                ->where('dbp.status', 'active')
                ->get();
            
            // Calculate spent and remaining amounts
            foreach ($status as $item) {
                $spent = DB::table('fund_issuance as fi')
                    ->join('dept_budget_period as dbp2', 'fi.period_id', '=', 'dbp2.period_id')
                    ->where('dbp2.department_id', $item->department_id)
                    ->where('dbp2.status', 'active')
                    ->sum('fi.amount_released');
                
                $item->spent_amount = $spent ?? 0;
                $item->remaining_amount = $item->allocated_amount - ($spent ?? 0);
            }
            
            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }
    
    /**
     * Get event run logs
     */
    public function getEventLogs()
    {
        try {
            $logs = DB::table('event_run_log')
                ->orderBy('run_at', 'desc')
                ->limit(50)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }
}