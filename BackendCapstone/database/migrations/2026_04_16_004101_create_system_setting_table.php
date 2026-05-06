<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('system_setting', function (Blueprint $table) {
            $table->id('setting_id');
            $table->string('setting_key', 80)->unique();
            $table->text('setting_value');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('updated_at')->nullable();
        });

        DB::table('system_setting')->insert([
            ['setting_key' => 'mayor_name', 'setting_value' => ''],
            ['setting_key' => 'contracted_station_name', 'setting_value' => ''],
            ['setting_key' => 'gps_ping_interval_seconds', 'setting_value' => '30'],
            ['setting_key' => 'gps_accuracy_threshold_meters', 'setting_value' => '50'],
            ['setting_key' => 'gps_distance_odometer_tolerance_pct', 'setting_value' => '20'],
            ['setting_key' => 'minimum_gps_pings_threshold', 'setting_value' => '5'],
            ['setting_key' => 'budget_week_start_day', 'setting_value' => '0'],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('system_setting');
    }
};