<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('file_storage', function (Blueprint $table) {
            $table->id('file_id');
            $table->char('file_uuid', 36);
            $table->string('original_filename', 255);
            $table->string('stored_filename', 255);
            $table->string('mime_type', 100);
            $table->bigInteger('file_size');
            $table->string('file_hash', 64);
            $table->string('storage_path_hash', 64);
            $table->string('encryption_key_id', 50)->nullable();
            $table->foreignId('uploaded_by')->constrained('users', 'user_id');
            $table->timestamp('uploaded_at')->useCurrent();
            $table->boolean('is_malware_scanned')->default(false);
            $table->boolean('is_quarantined')->default(false);
            $table->integer('accessed_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->date('retention_until')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->foreignId('deleted_by')->nullable()->constrained('users', 'user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('file_storage');
    }
};