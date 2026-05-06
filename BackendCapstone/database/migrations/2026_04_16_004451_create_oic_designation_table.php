<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('oic_designation', function (Blueprint $table) {
            $table->id('designation_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('head_of_office_id')->constrained('users', 'user_id');
            $table->foreignId('oic_user_id')->constrained('users', 'user_id');
            $table->boolean('is_active')->default(true);
            $table->timestamp('designated_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('oic_designation');
    }
};