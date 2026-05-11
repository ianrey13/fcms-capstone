<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BudgetSeeder extends Seeder
{
    public function run()
    {
        // Budget Policies
        if (DB::table('dept_budget_policy')->count() === 0) {
            DB::table('dept_budget_policy')->insert([
  ['department_id' => 3, 'default_weekly_allocation' => 10000],
    ['department_id' => 4, 'default_weekly_allocation' => 5000],
    ['department_id' => 5, 'default_weekly_allocation' => 5000],
            ]);
        }

        // Budget Periods
        if (DB::table('dept_budget_period')->count() === 0) {
            DB::table('dept_budget_period')->insert([
                [
                    'period_id' => 1,
                    'department_id' => 3,
                    'week_start' => now()->startOfWeek(),
                    'week_end' => now()->endOfWeek(),
                    'allocated_amount' => 10000,
                    'status' => 'active',
                ],
                [
                    'period_id' => 2,
                    'department_id' => 4,
                    'week_start' => now()->startOfWeek(),
                    'week_end' => now()->endOfWeek(),
                    'allocated_amount' => 5000,
                    'status' => 'active',
                ],
                [
                    'period_id' => 3,
                    'department_id' => 5,
                    'week_start' => now()->startOfWeek(),
                    'week_end' => now()->endOfWeek(),
                    'allocated_amount' => 5000,
                    'status' => 'active',
                ],
            ]);
        }
    }
}