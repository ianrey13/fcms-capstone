<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    public function up()
    {
        Schema::create('lookup_request_types', function (Blueprint $table) {
            $table->string('type_code', 50)->primary();
            $table->enum('category', ['department', 'crud']);
            $table->string('type_name', 100);
            $table->text('description')->nullable();
            $table->boolean('requires_attachment')->default(false);
            $table->string('approval_workflow', 100)->default('superadmin');
        });

        DB::table('lookup_request_types')->insert([
            ['type_code' => 'vehicle_breakdown', 'category' => 'department', 'type_name' => 'Vehicle Breakdown', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'vehicle_repaired', 'category' => 'department', 'type_name' => 'Vehicle Repaired', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'odometer_non_functional', 'category' => 'department', 'type_name' => 'Odometer Non-Functional', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'odometer_restored', 'category' => 'department', 'type_name' => 'Odometer Restored', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'new_vehicle_registration', 'category' => 'department', 'type_name' => 'New Vehicle Registration', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'driver_activation', 'category' => 'department', 'type_name' => 'Driver Activation', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'driver_deactivation', 'category' => 'department', 'type_name' => 'Driver Deactivation', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'other', 'category' => 'department', 'type_name' => 'Other Request', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'add_vehicle', 'category' => 'crud', 'type_name' => 'Add Vehicle', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'edit_vehicle', 'category' => 'crud', 'type_name' => 'Edit Vehicle', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'deactivate_vehicle', 'category' => 'crud', 'type_name' => 'Deactivate Vehicle', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'reactivate_vehicle', 'category' => 'crud', 'type_name' => 'Reactivate Vehicle', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'register_driver', 'category' => 'crud', 'type_name' => 'Register Driver', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'deactivate_driver', 'category' => 'crud', 'type_name' => 'Deactivate Driver', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'reactivate_driver', 'category' => 'crud', 'type_name' => 'Reactivate Driver', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'add_staff', 'category' => 'crud', 'type_name' => 'Add Staff', 'approval_workflow' => 'superadmin'],
            ['type_code' => 'deactivate_staff', 'category' => 'crud', 'type_name' => 'Deactivate Staff', 'approval_workflow' => 'superadmin'],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('lookup_request_types');
    }
};