<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BudgetSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('dept_budget_policy')->truncate();
        DB::table('dept_budget_period')->truncate();
        Schema::enableForeignKeyConstraints();

        // Budget Policies
        DB::table('dept_budget_policy')->insert([
            [
                'department_id' => 3, // Engineering Office
                'default_weekly_allocation' => 10000.00,
                'created_at' => now(),
            ],
            [
                'department_id' => 4, // RHU
                'default_weekly_allocation' => 5000.00,
                'created_at' => now(),
            ],
            [
                'department_id' => 5, // PNP
                'default_weekly_allocation' => 5000.00,
                'created_at' => now(),
            ],
            [
                'department_id' => 1, // System Administration
                'default_weekly_allocation' => 1000.00,
                'created_at' => now(),
            ],
        ]);

        // Budget Periods
        $weekStart = now()->startOfWeek();
        DB::table('dept_budget_period')->insert([
            [
                'department_id' => 3,
                'week_start' => $weekStart,
                'allocated_amount' => 10000.00,
                'status' => 'active',
                'created_at' => now(),
            ],
            [
                'department_id' => 4,
                'week_start' => $weekStart,
                'allocated_amount' => 5000.00,
                'status' => 'active',
                'created_at' => now(),
            ],
            [
                'department_id' => 5,
                'week_start' => $weekStart,
                'allocated_amount' => 5000.00,
                'status' => 'active',
                'created_at' => now(),
            ],
            [
                'department_id' => 1,
                'week_start' => $weekStart,
                'allocated_amount' => 1000.00,
                'status' => 'active',
                'created_at' => now(),
            ],
        ]);
    }
}