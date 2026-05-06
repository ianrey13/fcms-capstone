<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('gps_distance_result', function (Blueprint $table) {
            $table->id('result_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->decimal('gps_total_km', 8, 2);
            $table->integer('ping_count');
            $table->timestamp('computed_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('gps_distance_result');
    }
};