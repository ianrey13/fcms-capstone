<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trip_ticket_vehicle_snapshot', function (Blueprint $table) {
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id')->primary();
            $table->enum('vehicle_status', ['active', 'inactive']);
            $table->enum('odometer_status', ['functional', 'non_functional']);
            $table->enum('fuel_type', ['regular', 'premium', 'diesel']);
            $table->timestamp('snapshot_taken_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('trip_ticket_vehicle_snapshot');
    }
};