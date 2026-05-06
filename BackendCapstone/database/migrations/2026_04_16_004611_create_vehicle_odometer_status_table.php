<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vehicle_odometer_status', function (Blueprint $table) {
            $table->id('status_id');
            $table->foreignId('vehicle_id')->constrained('vehicles', 'vehicle_id');
            $table->enum('status', ['functional', 'non_functional']);
            $table->foreignId('reported_by')->constrained('users', 'user_id');
            $table->timestamp('reported_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('vehicle_odometer_status');
    }
};