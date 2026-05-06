<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lookup_state_transitions', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 50);
            $table->string('from_status', 40);
            $table->string('to_status', 40);
            $table->boolean('requires_note')->default(false);
            $table->string('allowed_roles', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        DB::table('lookup_state_transitions')->insert([
            ['entity_type' => 'trip_ticket', 'from_status' => 'draft', 'to_status' => 'pending_head_approval', 'requires_note' => 0, 'allowed_roles' => 'dept_office,head_of_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'draft', 'to_status' => 'cancelled', 'requires_note' => 0, 'allowed_roles' => 'dept_office,head_of_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'pending_gso_review', 'requires_note' => 0, 'allowed_roles' => 'head_of_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'head_of_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'rejected', 'requires_note' => 1, 'allowed_roles' => 'head_of_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'returned_for_revision', 'to_status' => 'pending_head_approval', 'requires_note' => 0, 'allowed_roles' => 'dept_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_gso_review', 'to_status' => 'pending_mayors_office', 'requires_note' => 0, 'allowed_roles' => 'gso_staff'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_gso_review', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'gso_staff'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_mayors_office', 'to_status' => 'funds_issued', 'requires_note' => 0, 'allowed_roles' => 'mayors_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_mayors_office', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'mayors_office'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'funds_issued', 'to_status' => 'in_transit', 'requires_note' => 0, 'allowed_roles' => 'driver,gso_staff'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'in_transit', 'to_status' => 'pending_reconciliation', 'requires_note' => 0, 'allowed_roles' => 'driver'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_reconciliation', 'to_status' => 'closed', 'requires_note' => 0, 'allowed_roles' => 'gso_staff'],
            ['entity_type' => 'trip_ticket', 'from_status' => 'pending_reconciliation', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'gso_staff'],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('lookup_state_transitions');
    }
};