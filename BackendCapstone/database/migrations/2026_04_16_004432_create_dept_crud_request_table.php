<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('dept_crud_request', function (Blueprint $table) {
            $table->id('request_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('submitted_by')->constrained('users', 'user_id');
            $table->enum('request_type', [
                'add_vehicle', 'edit_vehicle', 'deactivate_vehicle', 'reactivate_vehicle',
                'register_driver', 'deactivate_driver', 'reactivate_driver',
                'add_staff', 'deactivate_staff'
            ]);
            $table->foreignId('affected_vehicle_id')->nullable()->constrained('vehicles', 'vehicle_id');
            $table->foreignId('affected_driver_id')->nullable()->constrained('drivers', 'driver_id');
            $table->foreignId('affected_user_id')->nullable()->constrained('users', 'user_id');
            $table->text('request_details');
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
        Schema::dropIfExists('dept_crud_request');
    }
};