<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            DepartmentSeeder::class,
            UserSeeder::class,
            DriverSeeder::class,
            VehicleSeeder::class,
            BudgetSeeder::class,
            SystemSettingSeeder::class,
        ]);
    }
}