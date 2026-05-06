<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    public function up()
    {
        Schema::create('lookup_trip_status', function (Blueprint $table) {
            $table->string('status_code', 40)->primary();
            $table->string('status_name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_terminal')->default(false);
            $table->tinyInteger('display_order')->default(0);
            $table->string('color_code', 7)->default('#000000');
        });

        DB::table('lookup_trip_status')->insert([
            ['status_code' => 'draft', 'status_name' => 'Draft', 'display_order' => 1, 'color_code' => '#6c757d'],
            ['status_code' => 'pending_head_approval', 'status_name' => 'Pending Head Approval', 'display_order' => 2, 'color_code' => '#ffc107'],
            ['status_code' => 'pending_gso_review', 'status_name' => 'Pending GSO Review', 'display_order' => 3, 'color_code' => '#fd7e14'],
            ['status_code' => 'pending_mayors_office', 'status_name' => 'Pending Mayors Office', 'display_order' => 4, 'color_code' => '#17a2b8'],
            ['status_code' => 'returned_for_revision', 'status_name' => 'Returned for Revision', 'display_order' => 5, 'color_code' => '#6f42c1'],
            ['status_code' => 'funds_issued', 'status_name' => 'Funds Issued', 'display_order' => 6, 'color_code' => '#28a745'],
            ['status_code' => 'in_transit', 'status_name' => 'In Transit', 'display_order' => 7, 'color_code' => '#007bff'],
            ['status_code' => 'pending_reconciliation', 'status_name' => 'Pending Reconciliation', 'display_order' => 8, 'color_code' => '#20c997'],
            ['status_code' => 'closed', 'status_name' => 'Closed', 'display_order' => 9, 'color_code' => '#198754'],
            ['status_code' => 'rejected', 'status_name' => 'Rejected', 'display_order' => 10, 'color_code' => '#dc3545'],
            ['status_code' => 'cancelled', 'status_name' => 'Cancelled', 'display_order' => 11, 'color_code' => '#adb5bd'],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('lookup_trip_status');
    }
};