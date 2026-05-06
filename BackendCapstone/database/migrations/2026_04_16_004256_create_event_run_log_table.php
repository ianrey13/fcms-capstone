<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('event_run_log', function (Blueprint $table) {
            $table->id('log_id');
            $table->string('event_name', 80);
            $table->timestamp('run_at')->useCurrent();
            $table->enum('status', ['skipped', 'success', 'partial', 'error']);
            $table->smallInteger('periods_closed')->default(0);
            $table->smallInteger('periods_created')->default(0);
            $table->text('error_message')->nullable();
            $table->text('notes')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('event_run_log');
    }
};