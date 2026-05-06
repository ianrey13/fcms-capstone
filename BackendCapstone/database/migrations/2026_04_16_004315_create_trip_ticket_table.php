<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trip_ticket', function (Blueprint $table) {
            $table->id('trip_ticket_id');
            $table->string('trip_ticket_number', 20)->unique();
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('driver_id')->constrained('drivers', 'driver_id');
            $table->foreignId('vehicle_id')->constrained('vehicles', 'vehicle_id');
            $table->foreignId('submitted_by')->constrained('users', 'user_id');
            $table->foreignId('created_by_mo_user_id')->nullable()->constrained('users', 'user_id');
            $table->boolean('submitted_by_head')->default(false);
            $table->timestamp('submitted_at')->useCurrent();
            $table->date('trip_date');
            $table->text('purpose');
            $table->string('destination', 255);
            $table->string('charge_to', 120);
            $table->string('passenger_name', 120)->nullable();
            $table->string('status', 40)->default('draft');
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('trip_ticket');
    }
};