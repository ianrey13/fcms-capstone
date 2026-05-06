<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('dept_budget_period', function (Blueprint $table) {
            $table->id('period_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->date('week_start');
            $table->date('week_end')->nullable();
            $table->decimal('allocated_amount', 12, 2)->default(0);
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('dept_budget_period');
    }
};