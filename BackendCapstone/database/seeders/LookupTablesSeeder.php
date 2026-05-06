<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LookupTablesSeeder extends Seeder
{
    public function run()
    {
        // ============ lookup_user_roles ============
        if (DB::table('lookup_user_roles')->count() === 0) {
            DB::table('lookup_user_roles')->insert([
                ['role_code' => 'superadmin', 'role_name' => 'Super Administrator', 'description' => 'Full system access', 'hierarchy_level' => 100, 'is_active' => 1],
                ['role_code' => 'mayors_office', 'role_name' => "Mayor's Office", 'description' => 'Fund release authority', 'hierarchy_level' => 60, 'is_active' => 1],
                ['role_code' => 'head_of_office', 'role_name' => 'Head of Office', 'description' => 'Department head approval', 'hierarchy_level' => 50, 'is_active' => 1],
                ['role_code' => 'gso_staff', 'role_name' => 'GSO Staff', 'description' => 'Trip verification', 'hierarchy_level' => 40, 'is_active' => 1],
                ['role_code' => 'dept_office', 'role_name' => 'Department Staff', 'description' => 'Trip request submission', 'hierarchy_level' => 10, 'is_active' => 1],
                ['role_code' => 'driver', 'role_name' => 'Driver', 'description' => 'Trip execution', 'hierarchy_level' => 5, 'is_active' => 1],
            ]);
        }

        // ============ lookup_trip_status ============
        if (DB::table('lookup_trip_status')->count() === 0) {
            DB::table('lookup_trip_status')->insert([
                ['status_code' => 'draft', 'status_name' => 'Draft', 'description' => 'Trip being prepared', 'is_terminal' => 0, 'display_order' => 1, 'color_code' => '#6c757d'],
                ['status_code' => 'pending_head_approval', 'status_name' => 'Pending Head Approval', 'description' => 'Awaiting department head approval', 'is_terminal' => 0, 'display_order' => 2, 'color_code' => '#ffc107'],
                ['status_code' => 'pending_gso_review', 'status_name' => 'Pending GSO Review', 'description' => 'Awaiting GSO verification', 'is_terminal' => 0, 'display_order' => 3, 'color_code' => '#fd7e14'],
                ['status_code' => 'pending_mayors_office', 'status_name' => "Pending Mayor's Office", 'description' => 'Awaiting Mayor\'s Office approval', 'is_terminal' => 0, 'display_order' => 4, 'color_code' => '#17a2b8'],
                ['status_code' => 'returned_for_revision', 'status_name' => 'Returned for Revision', 'description' => 'Sent back for corrections', 'is_terminal' => 0, 'display_order' => 5, 'color_code' => '#6f42c1'],
                ['status_code' => 'funds_issued', 'status_name' => 'Funds Issued', 'description' => 'Fuel funds released', 'is_terminal' => 0, 'display_order' => 6, 'color_code' => '#28a745'],
                ['status_code' => 'in_transit', 'status_name' => 'In Transit', 'description' => 'Trip currently active', 'is_terminal' => 0, 'display_order' => 7, 'color_code' => '#007bff'],
                ['status_code' => 'pending_reconciliation', 'status_name' => 'Pending Reconciliation', 'description' => 'Awaiting fuel receipt reconciliation', 'is_terminal' => 0, 'display_order' => 8, 'color_code' => '#20c997'],
                ['status_code' => 'closed', 'status_name' => 'Closed', 'description' => 'Trip completed and reconciled', 'is_terminal' => 1, 'display_order' => 9, 'color_code' => '#198754'],
                ['status_code' => 'rejected', 'status_name' => 'Rejected', 'description' => 'Trip request rejected', 'is_terminal' => 1, 'display_order' => 10, 'color_code' => '#dc3545'],
                ['status_code' => 'cancelled', 'status_name' => 'Cancelled', 'description' => 'Trip cancelled', 'is_terminal' => 1, 'display_order' => 11, 'color_code' => '#adb5bd'],
            ]);
        }

        // ============ lookup_state_transitions ============
        if (DB::table('lookup_state_transitions')->count() === 0) {
            DB::table('lookup_state_transitions')->insert([
                ['entity_type' => 'trip_ticket', 'from_status' => 'draft', 'to_status' => 'pending_head_approval', 'requires_note' => 0, 'allowed_roles' => 'dept_office,head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'draft', 'to_status' => 'cancelled', 'requires_note' => 0, 'allowed_roles' => 'dept_office,head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'pending_gso_review', 'requires_note' => 0, 'allowed_roles' => 'head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_head_approval', 'to_status' => 'rejected', 'requires_note' => 1, 'allowed_roles' => 'head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'returned_for_revision', 'to_status' => 'pending_head_approval', 'requires_note' => 0, 'allowed_roles' => 'dept_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'returned_for_revision', 'to_status' => 'cancelled', 'requires_note' => 0, 'allowed_roles' => 'dept_office,head_of_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_gso_review', 'to_status' => 'pending_mayors_office', 'requires_note' => 0, 'allowed_roles' => 'gso_staff'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_gso_review', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'gso_staff'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_gso_review', 'to_status' => 'rejected', 'requires_note' => 1, 'allowed_roles' => 'gso_staff'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_mayors_office', 'to_status' => 'funds_issued', 'requires_note' => 0, 'allowed_roles' => 'mayors_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_mayors_office', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'mayors_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_mayors_office', 'to_status' => 'rejected', 'requires_note' => 1, 'allowed_roles' => 'mayors_office'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'funds_issued', 'to_status' => 'in_transit', 'requires_note' => 0, 'allowed_roles' => 'driver,gso_staff'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'in_transit', 'to_status' => 'pending_reconciliation', 'requires_note' => 0, 'allowed_roles' => 'driver'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_reconciliation', 'to_status' => 'closed', 'requires_note' => 0, 'allowed_roles' => 'gso_staff'],
                ['entity_type' => 'trip_ticket', 'from_status' => 'pending_reconciliation', 'to_status' => 'returned_for_revision', 'requires_note' => 1, 'allowed_roles' => 'gso_staff'],
            ]);
        }

        // ============ lookup_request_types ============
        if (DB::table('lookup_request_types')->count() === 0) {
            DB::table('lookup_request_types')->insert([
                ['type_code' => 'vehicle_breakdown', 'category' => 'department', 'type_name' => 'Vehicle Breakdown', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'vehicle_repaired', 'category' => 'department', 'type_name' => 'Vehicle Repaired', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'odometer_non_functional', 'category' => 'department', 'type_name' => 'Odometer Non-Functional', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'odometer_restored', 'category' => 'department', 'type_name' => 'Odometer Restored', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'new_vehicle_registration', 'category' => 'department', 'type_name' => 'New Vehicle Registration', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'driver_activation', 'category' => 'department', 'type_name' => 'Driver Activation', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'driver_deactivation', 'category' => 'department', 'type_name' => 'Driver Deactivation', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'other', 'category' => 'department', 'type_name' => 'Other Request', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'add_vehicle', 'category' => 'crud', 'type_name' => 'Add Vehicle', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'edit_vehicle', 'category' => 'crud', 'type_name' => 'Edit Vehicle', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'deactivate_vehicle', 'category' => 'crud', 'type_name' => 'Deactivate Vehicle', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'reactivate_vehicle', 'category' => 'crud', 'type_name' => 'Reactivate Vehicle', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'register_driver', 'category' => 'crud', 'type_name' => 'Register Driver', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'deactivate_driver', 'category' => 'crud', 'type_name' => 'Deactivate Driver', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'reactivate_driver', 'category' => 'crud', 'type_name' => 'Reactivate Driver', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'add_staff', 'category' => 'crud', 'type_name' => 'Add Staff', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
                ['type_code' => 'deactivate_staff', 'category' => 'crud', 'type_name' => 'Deactivate Staff', 'requires_attachment' => 0, 'approval_workflow' => 'superadmin'],
            ]);
        }
    }
}