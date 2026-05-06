<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('department_request', function (Blueprint $table) {
            $table->id('request_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('submitted_by')->constrained('users', 'user_id');
            $table->enum('request_type', [
                'vehicle_breakdown', 'vehicle_repaired', 'odometer_non_functional',
                'odometer_restored', 'new_vehicle_registration', 'driver_activation',
                'driver_deactivation', 'other'
            ]);
            $table->foreignId('affected_vehicle_id')->nullable()->constrained('vehicles', 'vehicle_id');
            $table->foreignId('affected_driver_id')->nullable()->constrained('drivers', 'driver_id');
            $table->date('date_noticed')->nullable();
            $table->text('reason');
            $table->string('attachment_path', 255)->nullable();
            $table->enum('status', ['pending_superadmin', 'approved', 'rejected'])->default('pending_superadmin');
            $table->foreignId('reviewed_by')->nullable()->constrained('users', 'user_id');
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('department_request');
    }
};