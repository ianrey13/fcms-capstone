<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id('vehicle_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->string('vehicle_model', 120);
            $table->string('plate_number', 20)->unique();
            $table->enum('fuel_type', ['regular', 'premium', 'diesel']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->enum('odometer_status', ['functional', 'non_functional'])->default('functional');
            $table->boolean('maintenance_flag')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->unsignedBigInteger('deactivated_by')->nullable();
            $table->string('deactivation_reason', 255)->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('vehicles');
    }
};