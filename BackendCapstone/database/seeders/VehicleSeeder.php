<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VehicleSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('vehicles')->truncate();
        Schema::enableForeignKeyConstraints();

        DB::table('vehicles')->insert([
            [
                'vehicle_id' => 1,
                'department_id' => 3, // Engineering Office
                'vehicle_model' => 'Donsal Coaster',
                'plate_number' => 'HIJ-2565',
                'fuel_type' => 'regular',
                'status' => 'active',
                'odometer_status' => 'functional',
                'maintenance_flag' => false,
                'created_at' => now(),
            ],
            [
                'vehicle_id' => 2,
                'department_id' => 4, // RHU
                'vehicle_model' => 'Ambulance',
                'plate_number' => 'SJA-2805',
                'fuel_type' => 'diesel',
                'status' => 'active',
                'odometer_status' => 'functional',
                'maintenance_flag' => false,
                'created_at' => now(),
            ],
            [
                'vehicle_id' => 3,
                'department_id' => 5, // PNP
                'vehicle_model' => 'Patrol Car',
                'plate_number' => 'AED-2562',
                'fuel_type' => 'diesel',
                'status' => 'active',
                'odometer_status' => 'functional',
                'maintenance_flag' => false,
                'created_at' => now(),
            ],
            [
                'vehicle_id' => 4,
                'department_id' => 3, // Engineering Office
                'vehicle_model' => 'Ford Raptor',
                'plate_number' => 'PSA-3123',
                'fuel_type' => 'diesel',
                'status' => 'active',
                'odometer_status' => 'functional',
                'maintenance_flag' => false,
                'created_at' => now(),
            ],
        ]);
    }
}