<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fuel_log', function (Blueprint $table) {
            $table->id('fuel_log_id');
            $table->foreignId('gas_slip_id')->constrained('gas_slip', 'gas_slip_id');
            $table->decimal('liters_availed', 10, 3)->nullable();
            $table->decimal('amount_on_receipt', 12, 2)->nullable();
            $table->string('receipt_photo_path', 255)->nullable();
            $table->string('receipt_phash', 120)->nullable();
            $table->timestamp('receipt_uploaded_at')->nullable();
            $table->integer('odometer_out')->unsigned()->nullable();
            $table->integer('odometer_in')->unsigned()->nullable();
            $table->enum('distance_source', ['gps_and_odometer', 'odometer', 'gps', 'partial_gps', 'unverified'])->nullable();
            $table->boolean('odometer_continuity_flag')->default(false);
            $table->boolean('has_movement_flag')->default(false);
            $table->boolean('duplicate_receipt_flag')->default(false);
            $table->integer('trip_elapsed_minutes')->unsigned()->nullable();
            $table->timestamp('gps_tracking_started_at')->nullable();
            $table->timestamp('gps_tracking_ended_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fuel_log');
    }
};