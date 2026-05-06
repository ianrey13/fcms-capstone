<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingSeeder extends Seeder
{
    public function run()
    {
        if (DB::table('system_setting')->count() === 0) {
            DB::table('system_setting')->insert([
                ['setting_key' => 'mayor_name', 'setting_value' => 'Mayor Name'],
                ['setting_key' => 'contracted_station_name', 'setting_value' => 'Petrol Station'],
                ['setting_key' => 'gps_ping_interval_seconds', 'setting_value' => '30'],
                ['setting_key' => 'gps_accuracy_threshold_meters', 'setting_value' => '50'],
                ['setting_key' => 'gps_distance_odometer_tolerance_pct', 'setting_value' => '20'],
                ['setting_key' => 'minimum_gps_pings_threshold', 'setting_value' => '5'],
                ['setting_key' => 'budget_week_start_day', 'setting_value' => '0'],
            ]);
        }
    }
}