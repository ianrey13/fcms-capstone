<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemSettingSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('system_setting')->truncate();
        Schema::enableForeignKeyConstraints();

        DB::table('system_setting')->insert([
            ['setting_key' => 'mayor_name', 'setting_value' => 'Roy Macua'],
            ['setting_key' => 'contracted_station_name', 'setting_value' => 'Petrol Station'],
            ['setting_key' => 'gps_ping_interval_seconds', 'setting_value' => '30'],
            ['setting_key' => 'gps_accuracy_threshold_meters', 'setting_value' => '50'],
            ['setting_key' => 'gps_distance_odometer_tolerance_pct', 'setting_value' => '20'],
            ['setting_key' => 'minimum_gps_pings_threshold', 'setting_value' => '5'],
            ['setting_key' => 'budget_week_start_day', 'setting_value' => '0'],
            ['setting_key' => 'mayor_office_phone', 'setting_value' => '(088) 123-4567'],
            ['setting_key' => 'mayor_office_email', 'setting_value' => 'mayor@laguindingan.gov.ph'],
            ['setting_key' => 'system_name', 'setting_value' => 'FCMS'],
            ['setting_key' => 'system_timezone', 'setting_value' => 'Asia/Manila'],
            ['setting_key' => 'date_format', 'setting_value' => 'Y-m-d'],
            ['setting_key' => 'gso_head_name', 'setting_value' => 'GSO Head'],
            ['setting_key' => 'gso_office_phone', 'setting_value' => '(088) 123-4568'],
            ['setting_key' => 'gso_office_email', 'setting_value' => 'gso@laguindingan.gov.ph'],
            ['setting_key' => 'max_trip_duration_hours', 'setting_value' => '24'],
            ['setting_key' => 'max_idle_minutes', 'setting_value' => '30'],
            ['setting_key' => 'contracted_station_address', 'setting_value' => 'Laguindingan, Misamis Oriental'],
            ['setting_key' => 'contracted_station_contact', 'setting_value' => '09123456789'],
            ['setting_key' => 'alternate_station_name', 'setting_value' => 'Alternate Petrol Station'],
            ['setting_key' => 'diesel_price_per_liter', 'setting_value' => '88.00'],
            ['setting_key' => 'premium_price_per_liter', 'setting_value' => '85.00'],
            ['setting_key' => 'regular_price_per_liter', 'setting_value' => '88.98'],
            ['setting_key' => 'email_notifications_enabled', 'setting_value' => '1'],
            ['setting_key' => 'push_notifications_enabled', 'setting_value' => '1'],
            ['setting_key' => 'notification_retention_days', 'setting_value' => '30'],
        ]);
    }
}