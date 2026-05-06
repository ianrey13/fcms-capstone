<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trip_ticket_esignature', function (Blueprint $table) {
            $table->id('esig_record_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->foreignId('head_approval_id')->constrained('head_approval', 'approval_id');
            $table->foreignId('user_id')->constrained('users', 'user_id');
            $table->foreignId('esig_id')->constrained('user_esignature', 'esig_id');
            $table->string('signature_hash', 64);
            $table->timestamp('signed_at')->useCurrent();
            $table->string('signed_ip', 45)->nullable();
            $table->tinyInteger('review_cycle')->default(1);
        });
    }

    public function down()
    {
        Schema::dropIfExists('trip_ticket_esignature');
    }
};