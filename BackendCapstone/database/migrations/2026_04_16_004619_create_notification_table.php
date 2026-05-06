<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notification', function (Blueprint $table) {
            $table->id('notification_id');
            $table->foreignId('recipient_user_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->enum('notification_type', [
                'trip_submitted', 'head_approved', 'head_rejected', 'oic_activated', 'oic_deactivated',
                'gso_approved', 'gso_rejected', 'forwarded_to_mo', 'batch_forwarded_to_mo',
                'mo_approved', 'mo_rejected', 'fund_issued', 'trip_started', 'trip_completed',
                'reconciliation_closed', 'duplicate_receipt_flag', 'signature_integrity_violation',
                'crud_request_submitted', 'crud_request_approved', 'crud_request_rejected',
                'budget_low_warning', 'fund_return_pending'
            ]);
            $table->enum('entity_type', ['trip_ticket', 'gas_slip', 'fund_issuance', 'department_request', 'dept_crud_request', 'oic_designation', 'trip_ticket_esignature']);
            $table->integer('entity_id');
            $table->string('message', 500);
            $table->enum('channel', ['in_app', 'push'])->default('in_app');
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('read_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notification');
    }
};