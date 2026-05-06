<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_esignature', function (Blueprint $table) {
            $table->id('esig_id');
            $table->foreignId('user_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->string('signature_image', 500);
            $table->string('signature_hash', 64);
            $table->boolean('is_active')->default(true);
            $table->timestamp('enrolled_at')->useCurrent();
            $table->string('enrolled_ip', 45)->nullable();
            $table->timestamp('superseded_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_esignature');
    }
};