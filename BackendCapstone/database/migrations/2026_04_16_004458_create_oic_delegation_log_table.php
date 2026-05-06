<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('oic_delegation_log', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('head_of_office_id')->constrained('users', 'user_id');
            $table->foreignId('oic_user_id')->constrained('users', 'user_id');
            $table->enum('reason', ['official_meeting', 'official_travel', 'medical_leave', 'personal_emergency', 'other_official_business']);
            $table->text('reason_details')->nullable();
            $table->date('estimated_return')->nullable();
            $table->timestamp('delegated_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
            $table->smallInteger('tickets_handled')->default(0);
        });
    }

    public function down()
    {
        Schema::dropIfExists('oic_delegation_log');
    }
};