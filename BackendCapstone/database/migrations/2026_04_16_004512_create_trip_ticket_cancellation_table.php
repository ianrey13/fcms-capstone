<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trip_ticket_cancellation', function (Blueprint $table) {
            $table->id('cancellation_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->foreignId('cancelled_by')->constrained('users', 'user_id');
            $table->text('cancellation_reason');
            $table->boolean('fund_return_required')->default(false);
            $table->timestamp('fund_returned_at')->nullable();
            $table->foreignId('fund_returned_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('cancelled_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('trip_ticket_cancellation');
    }
};