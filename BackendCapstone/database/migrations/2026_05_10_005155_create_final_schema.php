<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // ============================================
        // DROP EXISTING PROCEDURE FIRST (FIX)
        // ============================================
        DB::unprepared('DROP PROCEDURE IF EXISTS proc_weekly_budget_reset');

        // ============================================
        // 1. DEPARTMENTS TABLE
        // ============================================
        Schema::create('departments', function (Blueprint $table) {
            $table->id('department_id');
            $table->string('department_name', 150)->unique();
            $table->string('department_code', 20)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
        });

        // ============================================
        // 2. USERS TABLE
        // ============================================
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->string('first_name', 50);
            $table->string('middle_name', 50)->nullable();
            $table->string('last_name', 50);
            $table->string('email', 150)->unique();
            $table->string('employee_number', 50)->nullable()->unique();

            $table->string('password_hash', 255)->nullable();
            $table->enum('role', [
                'gso_office',
                'mayors_office',
                'staff',
                'driver'
            ]);
            $table->boolean('can_drive')->default(false);
            $table->string('esignature_path', 500)->nullable();
            $table->string('esignature_hash', 64)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->tinyInteger('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('account_locked_until')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->foreignId('deactivated_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->string('deactivation_reason', 255)->nullable();
            $table->timestamp('password_changed_at')->nullable();

            
            $table->index('role');
            $table->index('department_id');
        });

        // ============================================
        // 3. DRIVERS TABLE
        // ============================================
        Schema::create('drivers', function (Blueprint $table) {
            $table->id('driver_id');
            $table->foreignId('user_id')->unique()->constrained('users', 'user_id');
            $table->string('license_number', 50)->nullable();
            $table->date('license_expiry')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        // ============================================
        // 4. VEHICLES TABLE
        // ============================================
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id('vehicle_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->string('vehicle_model', 120);
            $table->string('plate_number', 20)->unique();
            $table->enum('fuel_type', ['regular', 'premium', 'diesel']);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->enum('odometer_status', ['functional', 'non_functional'])->default('functional');
            $table->boolean('maintenance_flag')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->date('odometer_broken_since')->nullable();
            $table->boolean('odometer_repair_requested')->default(false);
            $table->timestamp('odometer_repair_completed_at')->nullable();
            
            $table->index('department_id');
        });

        // ============================================
        // 5. DEPT BUDGET POLICY TABLE
        // ============================================
        Schema::create('dept_budget_policy', function (Blueprint $table) {
            $table->foreignId('department_id')->primary()->constrained('departments', 'department_id');
            $table->decimal('default_weekly_allocation', 12, 2)->default(0.00);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });

        // ============================================
        // 6. DEPT BUDGET PERIOD TABLE
        // ============================================
        Schema::create('dept_budget_period', function (Blueprint $table) {
            $table->id('period_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->date('week_start');
            $table->date('week_end')->virtualAs('week_start + interval 4 day');
            $table->decimal('allocated_amount', 12, 2)->default(0.00);
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->unique(['department_id', 'week_start']);
            $table->index(['department_id', 'status', 'week_start'], 'idx_budget_period_dept_status');
        });

        // ============================================
        // 7. TRIP TICKET TABLE
        // ============================================
        Schema::create('trip_ticket', function (Blueprint $table) {
            $table->id('trip_ticket_id');
            $table->string('trip_ticket_number', 20)->unique()->nullable();
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('submitted_by')->constrained('users', 'user_id');
            $table->foreignId('driver_id')->nullable()->constrained('drivers', 'driver_id');
            $table->foreignId('vehicle_id')->constrained('vehicles', 'vehicle_id');
            $table->foreignId('created_by_mo_user_id')->nullable()->constrained('users', 'user_id');
            $table->boolean('submitted_by_staff')->default(true);
            $table->timestamp('submitted_at')->useCurrent();
            $table->date('trip_date');
            $table->text('purpose');
            $table->string('destination', 255);
            $table->string('charge_to', 20);
            $table->string('passenger_name', 120)->nullable();
            $table->enum('status', [
                'draft',
                'pending_mayors_office',  // ✅ GSO creates directly - no GSO review
                'returned_for_revision',
                'funds_issued',
                'in_transit',
                'pending_reconciliation',
                'closed',
                'rejected',
                'cancelled',
                'acknowledged'
            ])->default('draft');
            $table->string('original_charge_to', 20)->nullable();
            $table->foreignId('charge_to_modified_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('charge_to_modified_at')->nullable();
            $table->text('charge_to_modification_reason')->nullable();
            $table->boolean('odometer_exception')->default(false);
            $table->text('odometer_exception_note')->nullable();
            $table->foreignId('odometer_exception_approved_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('odometer_exception_approved_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->decimal('estimated_distance_km', 10, 2)->nullable();
            $table->decimal('estimated_fuel_liters', 10, 2)->nullable();
            $table->boolean('has_insufficient_budget')->default(false);
            $table->decimal('budget_shortage', 12, 2)->default(0.00);
            $table->integer('original_department_id')->nullable();
            
            $table->index('status');
            $table->index(['status', 'submitted_at'], 'idx_tt_status_date');
            $table->index('charge_to');
            $table->foreign('charge_to')->references('department_code')->on('departments');
        });


        // ============================================
        // 8. GAS SLIP TABLE
        // ============================================
        Schema::create('gas_slip', function (Blueprint $table) {
            $table->id('gas_slip_id');
            $table->foreignId('trip_ticket_id')->unique()->constrained('trip_ticket', 'trip_ticket_id');
            $table->foreignId('created_by')->constrained('users', 'user_id');
            $table->decimal('amount_released', 10, 2);
            $table->decimal('budget_before', 12, 2);
            $table->decimal('budget_after', 12, 2);
            $table->foreignId('period_id')->constrained('dept_budget_period', 'period_id');
            $table->enum('reconciliation_status', ['pending', 'verified', 'discrepancy'])->default('pending');
            $table->text('reconciliation_note')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('receipt_acknowledged_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('receipt_acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('acknowledged_at')->nullable();
            $table->decimal('acknowledgement_gps_lat', 10, 7)->nullable();
            $table->decimal('acknowledgement_gps_lng', 10, 7)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            
            $table->index('created_by');
            $table->index('acknowledged_by');
            $table->index('period_id');
            $table->index(['period_id', 'amount_released'], 'idx_gas_slip_period_amount');
        });

        // ============================================
        // 9. FUEL LOG TABLE
        // ============================================
        Schema::create('fuel_log', function (Blueprint $table) {
            $table->id('fuel_log_id');
            $table->foreignId('gas_slip_id')->unique()->constrained('gas_slip', 'gas_slip_id');
            $table->decimal('liters_availed', 8, 2)->default(0.00);
            $table->decimal('amount_on_receipt', 10, 2)->default(0.00);
            $table->string('receipt_photo_path', 500)->nullable();
            $table->unsignedInteger('odometer_start')->nullable();
            $table->unsignedInteger('odometer_end')->nullable();
            $table->decimal('trip_start_gps_lat', 10, 7)->nullable();
            $table->decimal('trip_start_gps_lng', 10, 7)->nullable();
            $table->decimal('trip_start_gps_accuracy', 8, 2)->nullable();
            $table->timestamp('trip_started_at')->nullable();
            $table->timestamp('trip_ended_at')->nullable();
            $table->unsignedInteger('trip_elapsed_minutes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->enum('distance_calculation_method', ['odometer', 'gps', 'manual_estimate'])->default('odometer');
            $table->decimal('gps_distance_km', 8, 2)->nullable();
        });

        // ============================================
        // 10. TRIP TICKET CANCELLATION TABLE
        // ============================================
        Schema::create('trip_ticket_cancellation', function (Blueprint $table) {
            $table->id('cancellation_id');
            $table->foreignId('trip_ticket_id')->unique()->constrained('trip_ticket', 'trip_ticket_id');
            $table->foreignId('cancelled_by')->constrained('users', 'user_id');
            $table->text('cancellation_reason');
            $table->timestamp('cancelled_at')->useCurrent();
            $table->boolean('fund_return_required')->default(false);
            $table->timestamp('fund_returned_at')->nullable();
            $table->foreignId('fund_returned_by')->nullable()->constrained('users', 'user_id');
            $table->tinyInteger('review_cycle')->unsigned()->default(1);
            
            $table->index('cancelled_by');
        });

        // ============================================
        // 11. TRIP VEHICLE SNAPSHOT TABLE
        // ============================================
        Schema::create('trip_vehicle_snapshot', function (Blueprint $table) {
            $table->foreignId('trip_ticket_id')->primary()->constrained('trip_ticket', 'trip_ticket_id');
            $table->enum('vehicle_status', ['active', 'inactive']);
            $table->enum('odometer_status', ['functional', 'non_functional']);
            $table->enum('fuel_type', ['regular', 'premium', 'diesel']);
            $table->timestamp('snapshot_taken_at')->useCurrent();
        });

        // ============================================
        // 12. TRIP TICKET RETURN TABLE
        // ============================================
        Schema::create('trip_ticket_return', function (Blueprint $table) {
            $table->id('return_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->enum('return_type', [
                'rejected_by_mo',        // ✅ Only MO returns/rejects now
                'returned_by_mo',
                'resubmitted_by_staff'
            ]);
            $table->text('return_note')->nullable();
            $table->json('fields_changed')->nullable();
            $table->foreignId('actioned_by')->constrained('users', 'user_id');
            $table->timestamp('actioned_at')->useCurrent();
        });

        // ============================================
        // 13. NOTIFICATIONS TABLE
        // ============================================
        Schema::create('notifications', function (Blueprint $table) {
            $table->id('notification_id');
            $table->foreignId('recipient_user_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->enum('notification_type', [
                'trip_submitted',
                'gso_approved', 'gso_rejected',
                'forwarded_to_mo', 'batch_forwarded_to_mo',
                'mo_approved', 'mo_rejected',
                'fund_issued',
                'trip_started', 'trip_completed',
                'reconciliation_closed',
                'duplicate_receipt_flag',
                'signature_integrity_violation',
                'crud_request_submitted', 'crud_request_approved', 'crud_request_rejected',
                'budget_low_warning', 'fund_return_pending',
                'budget_assistance_request', 'mo_created_ticket',
                'trip_created'  // ✅ Added for GSO created trips
            ]);
            $table->enum('entity_type', [
                'trip_ticket', 'gas_slip', 'fund_issuance',
                'department_request', 'dept_crud_request',
                'oic_designation', 'trip_ticket_esignature',
                'mo_request'
            ]);
            $table->integer('entity_id');
            $table->string('message', 500);
            $table->enum('channel', ['in_app', 'push'])->default('in_app');
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('read_at')->nullable();
            
            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });

        // ============================================
        // 14. AUDIT LOG TABLE
        // ============================================
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->string('action', 50);
            $table->string('table_name', 50);
            $table->unsignedInteger('record_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('user_id');
        });

        // ============================================
        // 15. SYSTEM SETTINGS TABLE
        // ============================================
        Schema::create('system_setting', function (Blueprint $table) {
            $table->increments('setting_id');
            $table->string('setting_key', 80)->unique();
            $table->text('setting_value');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('updated_at')->nullable();
        });

        // ============================================
        // 16. FILE STORAGE TABLE
        // ============================================
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
            $table->foreignId('deleted_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
        });

        // ============================================
     

        // ============================================
        // TRIGGERS (No GSO Verification Triggers)
        // ============================================

        DB::unprepared("
            CREATE TRIGGER trg_trip_odometer_check BEFORE INSERT ON trip_ticket
            FOR EACH ROW
            BEGIN
                DECLARE v_odometer_status VARCHAR(20);
                
                SELECT odometer_status INTO v_odometer_status
                FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
                
                IF v_odometer_status = 'non_functional' THEN
                    SET NEW.odometer_exception = 1;
                    SET NEW.odometer_exception_note = CONCAT(
                        'Vehicle odometer reported broken since ',
                        (SELECT odometer_broken_since FROM vehicles WHERE vehicle_id = NEW.vehicle_id)
                    );
                END IF;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER trg_log_charge_to_change BEFORE UPDATE ON trip_ticket
            FOR EACH ROW
            BEGIN
                IF OLD.charge_to != NEW.charge_to AND OLD.charge_to IS NOT NULL THEN
                    SET NEW.original_charge_to = COALESCE(OLD.original_charge_to, OLD.charge_to);
                    SET NEW.charge_to_modified_by = @current_user_id;
                    SET NEW.charge_to_modified_at = NOW();
                END IF;
            END
        ");

        // ❌ REMOVED: trg_gso_approve_odometer_exception (GSO no longer approves)

        DB::unprepared("
            CREATE TRIGGER trg_fuel_receipt_validation BEFORE UPDATE ON fuel_log
            FOR EACH ROW
            BEGIN
                IF (NEW.liters_availed > 0 OR NEW.amount_on_receipt > 0) 
                   AND (NEW.receipt_photo_path IS NULL OR NEW.receipt_photo_path = '') THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Receipt photo required when fuel amount is recorded';
                END IF;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER trg_fuel_require_distance BEFORE UPDATE ON fuel_log
            FOR EACH ROW
            BEGIN
                DECLARE v_odometer_status VARCHAR(20);
                DECLARE v_odometer_exception TINYINT;
                
                SELECT v.odometer_status, tt.odometer_exception 
                INTO v_odometer_status, v_odometer_exception
                FROM vehicles v
                JOIN trip_ticket tt ON tt.vehicle_id = v.vehicle_id
                JOIN gas_slip gs ON gs.trip_ticket_id = tt.trip_ticket_id
                WHERE gs.gas_slip_id = NEW.gas_slip_id;
                
                IF NEW.trip_ended_at IS NOT NULL AND OLD.trip_ended_at IS NULL THEN
                    
                    IF v_odometer_status = 'functional' AND v_odometer_exception = 0 THEN
                        IF NEW.odometer_start IS NULL OR NEW.odometer_end IS NULL THEN
                            SIGNAL SQLSTATE '45000'
                            SET MESSAGE_TEXT = 'Odometer readings required for vehicles with functional odometer';
                        END IF;
                        SET NEW.distance_calculation_method = 'odometer';
                        
                    ELSEIF v_odometer_exception = 1 THEN
                        IF NEW.gps_distance_km IS NULL THEN
                            SIGNAL SQLSTATE '45000'
                            SET MESSAGE_TEXT = 'GPS distance required for trips with broken odometer';
                        END IF;
                        SET NEW.distance_calculation_method = 'gps';
                    END IF;
                END IF;
            END
        ");

        DB::unprepared("
            CREATE TRIGGER trg_gas_slip_budget_immutable BEFORE UPDATE ON gas_slip
            FOR EACH ROW
            BEGIN
                IF NEW.budget_before != OLD.budget_before OR NEW.budget_after != OLD.budget_after THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'gas_slip.budget_before and budget_after are write-once and cannot be modified.';
                END IF;
            END
        ");

        // ❌ REMOVED: trg_gso_no_self_verify (no gso_verification table)
        // ❌ REMOVED: trg_gso_note_required (no gso_verification table)

        // ============================================
        // STORED PROCEDURE
        // ============================================

        DB::unprepared("
            CREATE PROCEDURE proc_weekly_budget_reset()
            BEGIN
                DECLARE v_week_start DATE;
                
                IF WEEKDAY(CURDATE()) = 0 THEN
                    
                    SET v_week_start = CURDATE();
                    
                    START TRANSACTION;
                    
                    UPDATE dept_budget_period 
                    SET status = 'closed', closed_at = NOW() 
                    WHERE status = 'active';
                    
                    INSERT INTO dept_budget_period (department_id, week_start, allocated_amount, status)
                    SELECT department_id, v_week_start, default_weekly_allocation, 'active'
                    FROM dept_budget_policy
                    WHERE NOT EXISTS (
                        SELECT 1 FROM dept_budget_period p2
                        WHERE p2.department_id = dept_budget_policy.department_id
                            AND p2.week_start = v_week_start
                    );
                    
                    COMMIT;
                    
                END IF;
                
            END
        ");

        // ============================================
        // EVENTS
        // ============================================

        DB::unprepared("
            CREATE EVENT evt_weekly_budget_reset
            ON SCHEDULE EVERY 1 WEEK
            STARTS '2026-06-21 00:00:00'
            ON COMPLETION PRESERVE
            ENABLE
            DO CALL proc_weekly_budget_reset()
        ");

        DB::unprepared("
            CREATE EVENT evt_escalate_broken_odometer
            ON SCHEDULE EVERY 1 DAY
            STARTS '2026-06-21 06:00:00'
            ON COMPLETION NOT PRESERVE
            ENABLE
            DO
            BEGIN
                UPDATE vehicles v
                SET v.maintenance_flag = 1,
                    v.odometer_repair_requested = 1
                WHERE v.odometer_status = 'non_functional'
                    AND v.odometer_repair_completed_at IS NULL
                    AND DATEDIFF(NOW(), v.odometer_broken_since) > 30;
            END
        ");

        // ============================================
        // VIEWS
        // ============================================

        DB::statement("
            CREATE VIEW v_remaining_budget AS
            SELECT 
                p.period_id,
                p.department_id,
                d.department_name,
                d.department_code,
                p.week_start,
                p.week_end,
                p.allocated_amount,
                COALESCE(SUM(gs.amount_released), 0) AS total_spent_amount,
                (p.allocated_amount - COALESCE(SUM(gs.amount_released), 0)) AS remaining_amount,
                ROUND(((COALESCE(SUM(gs.amount_released), 0) / NULLIF(p.allocated_amount, 0)) * 100), 2) AS utilization_percentage,
                CASE WHEN COALESCE(SUM(gs.amount_released), 0) > p.allocated_amount THEN 1 ELSE 0 END AS is_over_budget,
                CASE WHEN (((p.allocated_amount - COALESCE(SUM(gs.amount_released), 0)) / NULLIF(p.allocated_amount, 0)) * 100) < 10 THEN 1 ELSE 0 END AS is_critical_low_warning,
                CASE WHEN (((p.allocated_amount - COALESCE(SUM(gs.amount_released), 0)) / NULLIF(p.allocated_amount, 0)) * 100) < 20 THEN 1 ELSE 0 END AS is_low_warning,
                p.status,
                p.created_at,
                p.closed_at,
                (TO_DAYS(p.week_end) - TO_DAYS(CURDATE())) AS days_remaining_in_period,
                ROUND((COALESCE(SUM(gs.amount_released), 0) / NULLIF((TO_DAYS(CURDATE()) - TO_DAYS(p.week_start)), 0)), 2) AS avg_daily_spend,
                ROUND(((COALESCE(SUM(gs.amount_released), 0) / NULLIF((TO_DAYS(CURDATE()) - TO_DAYS(p.week_start)), 0)) * 7), 2) AS projected_week_total
            FROM dept_budget_period p
            JOIN departments d ON d.department_id = p.department_id
            LEFT JOIN gas_slip gs ON gs.period_id = p.period_id
            GROUP BY p.period_id, p.department_id, d.department_name, d.department_code,
                     p.week_start, p.week_end, p.allocated_amount, p.status, p.created_at, p.closed_at
        ");

        DB::statement("
            CREATE VIEW v_active_trips AS
            SELECT 
                tt.trip_ticket_id,
                tt.trip_ticket_number,
                d.department_name,
                CONCAT(u.first_name, ' ', u.last_name) AS driver_name,
                v.vehicle_model,
                v.plate_number,
                tt.destination,
                tt.purpose,
                tt.trip_date,
                tt.submitted_at,
                TIMESTAMPDIFF(HOUR, tt.submitted_at, NOW()) AS hours_in_status,
                fl.trip_started_at,
                fl.trip_ended_at,
                CASE 
                    WHEN fl.trip_started_at IS NOT NULL AND fl.trip_ended_at IS NULL THEN 'In Transit'
                    WHEN fl.trip_started_at IS NULL THEN 'Not Started'
                    ELSE 'Completed'
                END AS trip_progress
            FROM trip_ticket tt
            JOIN departments d ON tt.department_id = d.department_id
            JOIN drivers dr ON tt.driver_id = dr.driver_id
            JOIN users u ON dr.user_id = u.user_id
            JOIN vehicles v ON tt.vehicle_id = v.vehicle_id
            LEFT JOIN gas_slip gs ON tt.trip_ticket_id = gs.trip_ticket_id
            LEFT JOIN fuel_log fl ON gs.gas_slip_id = fl.gas_slip_id
            WHERE tt.status IN ('in_transit', 'funds_issued', 'pending_reconciliation')
            ORDER BY tt.submitted_at DESC
        ");

        DB::statement("
            CREATE VIEW v_department_budget_summary AS
            SELECT 
                d.department_id,
                d.department_name,
                d.department_code,
                COUNT(p.period_id) AS total_periods,
                SUM(p.allocated_amount) AS total_allocated,
                SUM(COALESCE(gs.amount_released, 0)) AS total_spent,
                (SUM(p.allocated_amount) - SUM(COALESCE(gs.amount_released, 0))) AS total_remaining,
                MAX(CASE WHEN p.status = 'active' THEN p.allocated_amount ELSE 0 END) AS current_weekly_budget,
                MAX(CASE WHEN p.status = 'active' THEN p.week_start ELSE NULL END) AS current_week_start,
                MAX(CASE WHEN p.status = 'active' THEN p.week_end ELSE NULL END) AS current_week_end
            FROM departments d
            LEFT JOIN dept_budget_period p ON d.department_id = p.department_id
            LEFT JOIN gas_slip gs ON p.period_id = gs.period_id
            WHERE d.is_active = 1
            GROUP BY d.department_id, d.department_name, d.department_code
        ");

        DB::statement("
            CREATE VIEW v_fuel_efficiency AS
            SELECT 
                v.vehicle_id,
                v.vehicle_model,
                v.plate_number,
                v.fuel_type,
                d.department_name AS owner_department,
                COUNT(DISTINCT tt.trip_ticket_id) AS total_trips,
                COUNT(fl.fuel_log_id) AS trips_with_fuel_data,
                ROUND(SUM(fl.liters_availed), 2) AS total_liters,
                ROUND(AVG(fl.liters_availed), 2) AS avg_liters_per_trip,
                ROUND(SUM(fl.amount_on_receipt), 2) AS total_fuel_cost,
                ROUND(SUM(
                    CASE 
                        WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                        WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                        WHEN fl.odometer_end IS NOT NULL AND fl.odometer_start IS NOT NULL THEN (fl.odometer_end - fl.odometer_start)
                        ELSE 0
                    END
                ), 2) AS total_km,
                ROUND(AVG(
                    CASE 
                        WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                        WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                        WHEN fl.odometer_end IS NOT NULL AND fl.odometer_start IS NOT NULL THEN (fl.odometer_end - fl.odometer_start)
                        ELSE NULL
                    END
                ), 2) AS avg_km_per_trip,
                ROUND(SUM(
                    CASE 
                        WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                        WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                        WHEN fl.odometer_end IS NOT NULL AND fl.odometer_start IS NOT NULL THEN (fl.odometer_end - fl.odometer_start)
                        ELSE 0
                    END
                ) / NULLIF(SUM(fl.liters_availed), 0), 2) AS km_per_liter,
                ROUND(((SUM(fl.liters_availed) / NULLIF(SUM(
                    CASE 
                        WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                        WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                        WHEN fl.odometer_end IS NOT NULL AND fl.odometer_start IS NOT NULL THEN (fl.odometer_end - fl.odometer_start)
                        ELSE 0
                    END
                ), 0)) * 100), 2) AS liters_per_100km,
                ROUND(SUM(fl.amount_on_receipt) / NULLIF(SUM(
                    CASE 
                        WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                        WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                        WHEN fl.odometer_end IS NOT NULL AND fl.odometer_start IS NOT NULL THEN (fl.odometer_end - fl.odometer_start)
                        ELSE 0
                    END
                ), 0), 2) AS peso_per_km,
                CASE 
                    WHEN COUNT(CASE WHEN tt.odometer_exception = 1 THEN 1 END) > 0 THEN 'Includes GPS/Manual distance data'
                    ELSE 'All odometer-based'
                END AS distance_data_source,
                CASE 
                    WHEN ROUND(SUM(
                        CASE 
                            WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                            WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                            ELSE 0
                        END
                    ) / NULLIF(SUM(fl.liters_availed), 0), 2) >= 10 THEN 'Excellent'
                    WHEN ROUND(SUM(
                        CASE 
                            WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                            WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                            ELSE 0
                        END
                    ) / NULLIF(SUM(fl.liters_availed), 0), 2) >= 7 THEN 'Good'
                    WHEN ROUND(SUM(
                        CASE 
                            WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                            WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                            ELSE 0
                        END
                    ) / NULLIF(SUM(fl.liters_availed), 0), 2) >= 5 THEN 'Average'
                    WHEN ROUND(SUM(
                        CASE 
                            WHEN v.odometer_status = 'functional' AND tt.odometer_exception = 0 THEN (fl.odometer_end - fl.odometer_start)
                            WHEN tt.odometer_exception = 1 AND fl.gps_distance_km IS NOT NULL THEN fl.gps_distance_km
                            ELSE 0
                        END
                    ) / NULLIF(SUM(fl.liters_availed), 0), 2) >= 3 THEN 'Poor'
                    ELSE 'Critical - Needs Maintenance'
                END AS efficiency_rating,
                MIN(fl.trip_started_at) AS first_trip_recorded,
                MAX(fl.trip_ended_at) AS last_trip_recorded
            FROM vehicles v
            JOIN departments d ON v.department_id = d.department_id
            LEFT JOIN trip_ticket tt ON v.vehicle_id = tt.vehicle_id
            LEFT JOIN gas_slip gs ON tt.trip_ticket_id = gs.trip_ticket_id
            LEFT JOIN fuel_log fl ON gs.gas_slip_id = fl.gas_slip_id
            WHERE v.status = 'active' AND fl.liters_availed > 0
            GROUP BY v.vehicle_id, v.vehicle_model, v.plate_number, v.fuel_type, d.department_name
        ");
    }

    public function down()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Drop views
        DB::statement('DROP VIEW IF EXISTS v_remaining_budget');
        DB::statement('DROP VIEW IF EXISTS v_active_trips');
        DB::statement('DROP VIEW IF EXISTS v_department_budget_summary');
        DB::statement('DROP VIEW IF EXISTS v_fuel_efficiency');

        // Drop events
        DB::unprepared('DROP EVENT IF EXISTS evt_weekly_budget_reset');
        DB::unprepared('DROP EVENT IF EXISTS evt_escalate_broken_odometer');

        // Drop procedure
        DB::unprepared('DROP PROCEDURE IF EXISTS proc_weekly_budget_reset');

        // Drop triggers
        DB::unprepared('DROP TRIGGER IF EXISTS trg_trip_odometer_check');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_log_charge_to_change');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_fuel_receipt_validation');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_fuel_require_distance');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_gas_slip_budget_immutable');
        // ❌ REMOVED GSO triggers

        // Drop tables
        Schema::dropIfExists('file_storage');
        Schema::dropIfExists('system_setting');
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('trip_vehicle_snapshot');
        Schema::dropIfExists('trip_ticket_return');
        Schema::dropIfExists('trip_ticket_cancellation');
        Schema::dropIfExists('fuel_log');
        Schema::dropIfExists('gas_slip');
        // ❌ REMOVED: gso_verification
        Schema::dropIfExists('trip_ticket');
        Schema::dropIfExists('dept_budget_period');
        Schema::dropIfExists('dept_budget_policy');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('users');
        Schema::dropIfExists('departments');

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
};