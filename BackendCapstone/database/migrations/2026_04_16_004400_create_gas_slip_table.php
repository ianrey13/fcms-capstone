<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('gas_slip', function (Blueprint $table) {
            $table->id('gas_slip_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->foreignId('created_by')->constrained('users', 'user_id');
            $table->decimal('amount_released', 10, 2)->nullable();
            $table->enum('reconciliation_status', ['pending', 'verified', 'discrepancy'])->default('pending');
            $table->text('reconciliation_note')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('receipt_acknowledged_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('receipt_acknowledged_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('gas_slip');
    }
};