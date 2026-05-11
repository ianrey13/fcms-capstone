<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ============================================
        // 1. DEPARTMENTS TABLE
        // ============================================
        Schema::create('departments', function (Blueprint $table) {
            $table->id('department_id');
            $table->string('department_name', 150);
            $table->string('department_code', 20)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
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
            $table->string('password_hash', 255)->nullable();
            $table->enum('role', ['superadmin', 'dept_office', 'head_of_office', 'gso_staff', 'mayors_office', 'driver']);
            $table->enum('head_active_status', ['active', 'inactive'])->nullable();
            $table->string('esignature_path', 500)->nullable();
            $table->string('esignature_hash', 64)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('last_login_at')->nullable();
            
            $table->index('role');
            $table->index('department_id');
        });

        // ============================================
        // 3. VEHICLES TABLE
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
            $table->date('odometer_broken_since')->nullable();
            $table->boolean('odometer_repair_requested')->default(false);
            $table->timestamp('odometer_repair_completed_at')->nullable();
            
            $table->index('department_id');
        });

        // ============================================
        // 4. DRIVERS TABLE
        // ============================================
        Schema::create('drivers', function (Blueprint $table) {
            $table->id('driver_id');
            $table->foreignId('user_id')->unique()->constrained('users', 'user_id');
            $table->string('license_number', 50)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('created_at')->useCurrent();
        });

        // ============================================
        // 5. DEPT BUDGET POLICY TABLE
        // ============================================
        Schema::create('dept_budget_policy', function (Blueprint $table) {
            $table->foreignId('department_id')->primary()->constrained('departments', 'department_id');
            $table->decimal('default_weekly_allocation', 12, 2)->default(0.00);
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
            $table->foreignId('driver_id')->constrained('drivers', 'driver_id');
            $table->foreignId('vehicle_id')->constrained('vehicles', 'vehicle_id');
            $table->foreignId('submitted_by')->constrained('users', 'user_id');
            $table->foreignId('created_by_mo_user_id')->nullable()->constrained('users', 'user_id');
            $table->boolean('submitted_by_head')->default(false);
            $table->timestamp('submitted_at')->useCurrent();
            $table->date('trip_date');
            $table->text('purpose');
            $table->string('destination', 255);
            $table->string('charge_to', 20);
            $table->string('passenger_name', 120)->nullable();
            $table->enum('status', [
                'draft', 'pending_head_approval', 'pending_gso_review', 
                'pending_mayors_office', 'returned_for_revision', 'funds_issued', 
                'in_transit', 'pending_reconciliation', 'closed', 'rejected', 'cancelled'
            ])->default('draft');
            $table->string('original_charge_to', 20)->nullable();
            $table->foreignId('charge_to_modified_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('charge_to_modified_at')->nullable();
            $table->text('charge_to_modification_reason')->nullable();
            $table->boolean('odometer_exception')->default(false)->comment('1 = trip uses GPS distance (broken odometer)');
            $table->text('odometer_exception_note')->nullable()->comment('Driver/GSO note about broken odometer');
            $table->foreignId('odometer_exception_approved_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('odometer_exception_approved_at')->nullable();
            
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
            $table->foreignId('acknowledged_by')->nullable()->constrained('users', 'user_id');
            $table->timestamp('acknowledged_at')->nullable();
            $table->decimal('acknowledgement_gps_lat', 10, 7)->nullable();
            $table->decimal('acknowledgement_gps_lng', 10, 7)->nullable();
            $table->timestamp('created_at')->useCurrent();
            
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
            $table->enum('distance_calculation_method', ['odometer', 'gps', 'manual_estimate'])->default('odometer');
            $table->decimal('gps_distance_km', 8, 2)->nullable()->comment('GPS calculated distance when odometer broken');
        });

        // ============================================
        // 10. HEAD APPROVAL TABLE
        // ============================================
        Schema::create('head_approval', function (Blueprint $table) {
            $table->id('approval_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->tinyInteger('review_cycle')->unsigned()->default(1);
            $table->foreignId('approved_by')->constrained('users', 'user_id');
            $table->boolean('is_oic_action')->default(false);
            $table->enum('decision', ['approved', 'rejected', 'returned']);
            $table->text('review_note')->nullable();
            $table->string('esignature_path', 500)->nullable();
            $table->string('esignature_hash', 64)->nullable();
            $table->timestamp('reviewed_at')->useCurrent();
            
            $table->unique(['trip_ticket_id', 'review_cycle'], 'uq_head_approval_ticket_cycle');
            $table->index('approved_by');
        });

        // ============================================
        // 11. GSO VERIFICATION TABLE
        // ============================================
        Schema::create('gso_verification', function (Blueprint $table) {
            $table->id('verification_id');
            $table->foreignId('trip_ticket_id')->constrained('trip_ticket', 'trip_ticket_id');
            $table->tinyInteger('review_cycle')->unsigned()->default(1);
            $table->foreignId('verified_by')->constrained('users', 'user_id');
            $table->enum('decision', ['approved', 'rejected', 'returned']);
            $table->text('verification_note')->nullable();
            $table->string('assigned_number', 20)->nullable();
            $table->timestamp('verified_at')->useCurrent();
            
            $table->unique(['trip_ticket_id', 'review_cycle'], 'uq_gso_ticket_cycle');
            $table->index('verified_by');
        });

        // ============================================
        // 12. OIC DESIGNATION TABLE
        // ============================================
        Schema::create('oic_designation', function (Blueprint $table) {
            $table->id('designation_id');
            $table->foreignId('department_id')->constrained('departments', 'department_id');
            $table->foreignId('head_of_office_id')->constrained('users', 'user_id');
            $table->foreignId('oic_user_id')->constrained('users', 'user_id');
            $table->boolean('is_active')->default(true);
            $table->enum('reason', ['official_meeting', 'official_travel', 'medical_leave', 'personal_emergency', 'other_official_business']);
            $table->text('reason_details')->nullable();
            $table->date('expected_return_date')->nullable();
            $table->timestamp('designated_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
            
            $table->index('department_id');
            $table->index('head_of_office_id');
            $table->index('oic_user_id');
        });

        // ============================================
        // 13. TRIP TICKET CANCELLATION TABLE
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
        // 14. TRIP VEHICLE SNAPSHOT TABLE
        // ============================================
        Schema::create('trip_vehicle_snapshot', function (Blueprint $table) {
            $table->foreignId('trip_ticket_id')->primary()->constrained('trip_ticket', 'trip_ticket_id');
            $table->enum('vehicle_status', ['active', 'inactive']);
            $table->enum('odometer_status', ['functional', 'non_functional']);
            $table->enum('fuel_type', ['regular', 'premium', 'diesel']);
            $table->timestamp('snapshot_taken_at')->useCurrent();
        });

        // ============================================
        // 15. AUDIT LOG TABLE
        // ============================================
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id('log_id');
            $table->foreignId('user_id')->nullable()->constrained('users', 'user_id');
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
        // CREATE TRIGGERS
        // ============================================
        
        // Trigger: trg_trip_odometer_check (BEFORE INSERT on trip_ticket)
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

        // Trigger: trg_log_charge_to_change (BEFORE UPDATE on trip_ticket)
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

        // Trigger: trg_gso_approve_odometer_exception (BEFORE UPDATE on trip_ticket)
        DB::unprepared("
            CREATE TRIGGER trg_gso_approve_odometer_exception BEFORE UPDATE ON trip_ticket
            FOR EACH ROW
            BEGIN
                IF NEW.status = 'pending_mayors_office' 
                   AND OLD.status = 'pending_gso_review'
                   AND NEW.odometer_exception = 1
                   AND NEW.odometer_exception_approved_by IS NULL THEN
                    
                    SET NEW.odometer_exception_approved_at = NOW();
                END IF;
            END
        ");

        // Trigger: trg_fuel_require_distance (BEFORE UPDATE on fuel_log)
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

        // Trigger: trg_fuel_receipt_validation (BEFORE UPDATE on fuel_log)
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

        // Trigger: trg_gas_slip_budget_immutable (BEFORE UPDATE on gas_slip)
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

        // Trigger: trg_head_no_self_approve (BEFORE INSERT on head_approval)
        DB::unprepared("
            CREATE TRIGGER trg_head_no_self_approve BEFORE INSERT ON head_approval
            FOR EACH ROW
            BEGIN
                DECLARE v_sub INT UNSIGNED;
                SELECT submitted_by INTO v_sub FROM trip_ticket WHERE trip_ticket_id = NEW.trip_ticket_id;
                IF NEW.approved_by = v_sub THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Head of Office cannot approve a ticket they personally submitted.';
                END IF;
            END
        ");

        // Trigger: trg_head_approval_check_active (BEFORE INSERT on head_approval)
        DB::unprepared("
            CREATE TRIGGER trg_head_approval_check_active BEFORE INSERT ON head_approval
            FOR EACH ROW
            BEGIN
                DECLARE v_head_status VARCHAR(20);
                DECLARE v_is_oic_active INT;
                
                SELECT head_active_status INTO v_head_status
                FROM users WHERE user_id = NEW.approved_by;
                
                IF NEW.is_oic_action = 0 AND v_head_status = 'inactive' THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Head of Office is inactive (OIC delegated). Only OIC can approve tickets.';
                END IF;
            END
        ");

        // Trigger: trg_head_note_required (BEFORE INSERT on head_approval)
        DB::unprepared("
            CREATE TRIGGER trg_head_note_required BEFORE INSERT ON head_approval
            FOR EACH ROW
            BEGIN
                IF NEW.decision = 'rejected' AND (NEW.review_note IS NULL OR TRIM(NEW.review_note)='') THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'review_note is mandatory when rejecting at head approval stage.';
                END IF;
            END
        ");

        // Trigger: trg_gso_no_self_verify (BEFORE INSERT on gso_verification)
        DB::unprepared("
            CREATE TRIGGER trg_gso_no_self_verify BEFORE INSERT ON gso_verification
            FOR EACH ROW
            BEGIN
                DECLARE v_sub INT UNSIGNED;
                SELECT submitted_by INTO v_sub FROM trip_ticket WHERE trip_ticket_id = NEW.trip_ticket_id;
                IF NEW.verified_by = v_sub THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'GSO staff cannot verify a ticket they personally submitted.';
                END IF;
            END
        ");

        // Trigger: trg_gso_note_required (BEFORE INSERT on gso_verification)
        DB::unprepared("
            CREATE TRIGGER trg_gso_note_required BEFORE INSERT ON gso_verification
            FOR EACH ROW
            BEGIN
                IF NEW.decision = 'rejected' AND (NEW.verification_note IS NULL OR TRIM(NEW.verification_note)='') THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'verification_note is mandatory when rejecting at GSO stage.';
                END IF;
            END
        ");

        // Trigger: trg_oic_one_active_per_dept (BEFORE INSERT on oic_designation)
        DB::unprepared("
            CREATE TRIGGER trg_oic_one_active_per_dept BEFORE INSERT ON oic_designation
            FOR EACH ROW
            BEGIN
                IF NEW.is_active = 1 AND EXISTS (
                    SELECT 1 FROM oic_designation
                    WHERE department_id = NEW.department_id AND is_active = 1
                ) THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Department already has an active OIC. Revoke the current OIC first.';
                END IF;
                IF NEW.oic_user_id = NEW.head_of_office_id THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'The Head of Office cannot designate themselves as OIC.';
                END IF;
            END
        ");

        // Trigger: trg_oic_require_esignature (BEFORE INSERT on oic_designation)
        DB::unprepared("
            CREATE TRIGGER trg_oic_require_esignature BEFORE INSERT ON oic_designation
            FOR EACH ROW
            BEGIN
                DECLARE v_has_esignature INT;
                
                SELECT COUNT(*) INTO v_has_esignature
                FROM users 
                WHERE user_id = NEW.oic_user_id 
                    AND esignature_path IS NOT NULL 
                    AND esignature_path != '';
                
                IF v_has_esignature = 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Designated OIC must have an enrolled e-signature before assuming duties';
                END IF;
            END
        ");

        // Trigger: trg_oic_same_department (BEFORE INSERT on oic_designation)
        DB::unprepared("
            CREATE TRIGGER trg_oic_same_department BEFORE INSERT ON oic_designation
            FOR EACH ROW
            BEGIN
                DECLARE v_oic_dept INT;
                DECLARE v_head_dept INT;
                
                SELECT department_id INTO v_oic_dept
                FROM users WHERE user_id = NEW.oic_user_id;
                
                SELECT department_id INTO v_head_dept
                FROM users WHERE user_id = NEW.head_of_office_id;
                
                IF v_oic_dept != v_head_dept THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'OIC must belong to the same department as the Head of Office';
                END IF;
            END
        ");

        // ============================================
        // CREATE STORED PROCEDURE
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
        // CREATE EVENTS
        // ============================================
        
        // Event: evt_weekly_budget_reset
        DB::unprepared("
            CREATE EVENT evt_weekly_budget_reset
            ON SCHEDULE EVERY 1 WEEK
            STARTS '2026-05-11 00:00:00'
            ON COMPLETION PRESERVE
            ENABLE
            DO CALL proc_weekly_budget_reset()
        ");

        // Event: evt_escalate_broken_odometer
        DB::unprepared("
            CREATE EVENT evt_escalate_broken_odometer
            ON SCHEDULE EVERY 1 DAY
            STARTS '2026-05-10 06:03:18'
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

        // Event: evt_auto_revoke_oic
        DB::unprepared("
            CREATE EVENT evt_auto_revoke_oic
            ON SCHEDULE EVERY 1 DAY
            STARTS '2026-05-10 06:06:55'
            ON COMPLETION NOT PRESERVE
            ENABLE
            DO
            BEGIN
                UPDATE oic_designation 
                SET is_active = 0, 
                    revoked_at = NOW()
                WHERE is_active = 1 
                    AND expected_return_date IS NOT NULL 
                    AND expected_return_date < CURDATE();
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Drop events
        DB::unprepared('DROP EVENT IF EXISTS evt_weekly_budget_reset');
        DB::unprepared('DROP EVENT IF EXISTS evt_escalate_broken_odometer');
        DB::unprepared('DROP EVENT IF EXISTS evt_auto_revoke_oic');
        
        // Drop stored procedure
        DB::unprepared('DROP PROCEDURE IF EXISTS proc_weekly_budget_reset');
        
        // Drop triggers
        DB::unprepared('DROP TRIGGER IF EXISTS trg_trip_odometer_check');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_log_charge_to_change');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_gso_approve_odometer_exception');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_fuel_require_distance');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_fuel_receipt_validation');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_gas_slip_budget_immutable');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_head_no_self_approve');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_head_approval_check_active');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_head_note_required');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_gso_no_self_verify');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_gso_note_required');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_oic_one_active_per_dept');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_oic_require_esignature');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_oic_same_department');
        
        // Drop tables in reverse order (respecting foreign keys)
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('trip_vehicle_snapshot');
        Schema::dropIfExists('trip_ticket_cancellation');
        Schema::dropIfExists('oic_designation');
        Schema::dropIfExists('gso_verification');
        Schema::dropIfExists('head_approval');
        Schema::dropIfExists('fuel_log');
        Schema::dropIfExists('gas_slip');
        Schema::dropIfExists('trip_ticket');
        Schema::dropIfExists('dept_budget_period');
        Schema::dropIfExists('dept_budget_policy');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('departments');
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
};