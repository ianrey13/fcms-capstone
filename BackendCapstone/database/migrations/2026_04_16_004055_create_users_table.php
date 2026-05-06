<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);
            $table->string('email', 150)->unique();
            $table->string('password_hash', 255)->nullable();
            $table->string('role', 30);
            $table->enum('head_active_status', ['active', 'inactive'])->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->unsignedBigInteger('deactivated_by')->nullable();
            $table->string('deactivation_reason', 255)->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->tinyInteger('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};