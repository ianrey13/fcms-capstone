<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DriverSeeder extends Seeder
{
    public function run()
    {
        if (DB::table('drivers')->count() === 0) {
            DB::table('drivers')->insert([
                ['driver_id' => 1, 'user_id' => 4, 'status' => 'active'],
                ['driver_id' => 2, 'user_id' => 6, 'status' => 'active'],
            ]);
        }
    }
}