<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('gso_verification', function (Blueprint $table) {
            $table->id('verification_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->tinyInteger('review_cycle')->default(1);
            $table->foreignId('gso_verified_by')->constrained('users', 'user_id');
            $table->timestamp('verified_at')->useCurrent();
            $table->enum('decision', ['approved', 'rejected']);
            $table->text('gso_note')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('gso_verification');
    }
};