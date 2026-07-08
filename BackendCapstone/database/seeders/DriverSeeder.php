<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DriverSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('drivers')->truncate();
        Schema::enableForeignKeyConstraints();

        DB::table('drivers')->insert([
            [
                'driver_id' => 1,
                'user_id' => 5, // Nilo Botay
                'license_number' => 'N10-12-123456',
                'license_expiry' => '2028-12-31',
                'status' => 'active',
                'created_at' => now(),
            ],
            [
                'driver_id' => 2,
                'user_id' => 6, // RHU Driver
                'license_number' => 'R10-12-654321',
                'license_expiry' => '2027-06-30',
                'status' => 'active',
                'created_at' => now(),
            ],
        ]);
    }
}