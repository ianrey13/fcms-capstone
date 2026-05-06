<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('gps_ping', function (Blueprint $table) {
            $table->id('ping_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->decimal('speed_kmh', 6, 2)->nullable();
            $table->decimal('heading_degrees', 5, 2)->nullable();
            $table->boolean('is_low_accuracy')->default(false);
            $table->boolean('is_queued_upload')->default(false);
            $table->boolean('has_mock_location_flag')->default(false);
            $table->timestamp('recorded_at');
            $table->timestamp('received_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('gps_ping');
    }
};