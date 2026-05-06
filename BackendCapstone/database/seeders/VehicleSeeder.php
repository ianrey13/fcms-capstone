<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VehicleSeeder extends Seeder
{
    public function run()
    {
        if (DB::table('vehicles')->count() === 0) {
            DB::table('vehicles')->insert([
                [
                    'vehicle_id' => 1,
                    'department_id' => 3,
                    'vehicle_model' => 'Donsal Coaster',
                    'plate_number' => 'HIJ-2565',
                    'fuel_type' => 'regular',
                    'status' => 'active',
                    'odometer_status' => 'functional',
                ],
                [
                    'vehicle_id' => 2,
                    'department_id' => 4,
                    'vehicle_model' => 'Ambulance',
                    'plate_number' => 'DDD-11111',
                    'fuel_type' => 'regular',
                    'status' => 'active',
                    'odometer_status' => 'functional',
                ],
                [
                    'vehicle_id' => 3,
                    'department_id' => 5,
                    'vehicle_model' => 'Patrol Car',
                    'plate_number' => 'AED-2562',
                    'fuel_type' => 'diesel',
                    'status' => 'active',
                    'odometer_status' => 'functional',
                ],
            ]);
        }
    }
}