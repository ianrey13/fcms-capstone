<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('mo_review', function (Blueprint $table) {
            $table->id('review_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->tinyInteger('review_cycle')->default(1);
            $table->foreignId('reviewed_by')->constrained('users', 'user_id');
            $table->enum('decision', ['approved', 'rejected']);
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('mo_review');
    }
};