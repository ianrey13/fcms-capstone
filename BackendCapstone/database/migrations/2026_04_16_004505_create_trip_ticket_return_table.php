<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trip_ticket_return', function (Blueprint $table) {
            $table->id('return_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->enum('return_type', [
                'rejected_by_head', 'rejected_by_gso', 'rejected_by_mo', 'returned_by_mo',
                'resubmitted_to_head', 'resubmitted_to_gso', 'resubmitted_by_dept_office'
            ]);
            $table->text('return_note')->nullable();
            $table->json('fields_changed')->nullable();
            $table->foreignId('actioned_by')->constrained('users', 'user_id');
            $table->timestamp('actioned_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('trip_ticket_return');
    }
};