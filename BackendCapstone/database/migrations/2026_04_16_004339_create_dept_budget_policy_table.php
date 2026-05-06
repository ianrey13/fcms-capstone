<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('dept_budget_policy', function (Blueprint $table) {
            $table->id('policy_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->decimal('default_weekly_allocation', 12, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('dept_budget_policy');
    }
};