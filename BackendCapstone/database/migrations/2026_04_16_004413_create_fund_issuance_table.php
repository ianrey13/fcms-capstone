<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fund_issuance', function (Blueprint $table) {
            $table->id('issuance_id');
            $table->foreignId('gas_slip_id')->constrained('gas_slip', 'gas_slip_id');
            $table->foreignId('period_id')->constrained('dept_budget_period', 'period_id');
            $table->foreignId('issued_by')->constrained('users', 'user_id');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users', 'user_id');
            $table->decimal('amount_released', 12, 2);
            $table->decimal('budget_before', 12, 2);
            $table->decimal('budget_after', 12, 2);
            $table->enum('acknowledgement_method', ['tap_to_sign'])->default('tap_to_sign');
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamp('acknowledged_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fund_issuance');
    }
};