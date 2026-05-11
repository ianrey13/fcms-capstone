<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
           // LookupTablesSeeder::class,
            DepartmentSeeder::class,
            UserSeeder::class,
            DriverSeeder::class,
            VehicleSeeder::class,
            SystemSettingSeeder::class,
            BudgetSeeder::class,
        ]);
    }
}