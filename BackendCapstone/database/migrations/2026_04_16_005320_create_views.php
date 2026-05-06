<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // View 1: v_active_trips_gps - Real-time GPS tracking view
        DB::statement("
            CREATE OR REPLACE VIEW v_active_trips_gps AS
            SELECT 
                tt.trip_ticket_id,
                tt.trip_ticket_number,
                tt.department_id,
                d.department_name,
                tt.driver_id,
                CONCAT(u.last_name, ', ', u.first_name) AS driver_name,
                tt.vehicle_id,
                v.vehicle_model,
                v.plate_number,
                tt.destination,
                tt.purpose,
                fl.gps_tracking_started_at,
                fl.trip_elapsed_minutes,
                gp.latitude AS last_latitude,
                gp.longitude AS last_longitude,
                gp.speed_kmh AS last_speed_kmh,
                gp.received_at AS last_ping_at,
                gp.has_mock_location_flag,
                gdr.gps_total_km,
                TIMESTAMPDIFF(MINUTE, gp.received_at, NOW()) AS minutes_since_last_ping,
                CASE 
                    WHEN TIMESTAMPDIFF(MINUTE, gp.received_at, NOW()) > 5 THEN 1 
                    ELSE 0 
                END AS is_gps_stale
            FROM trip_ticket tt
            JOIN departments d ON tt.department_id = d.department_id
            JOIN drivers dr ON tt.driver_id = dr.driver_id
            JOIN users u ON dr.user_id = u.user_id
            JOIN vehicles v ON tt.vehicle_id = v.vehicle_id
            LEFT JOIN fuel_log fl ON fl.gas_slip_id = (SELECT gas_slip_id FROM gas_slip WHERE trip_ticket_id = tt.trip_ticket_id LIMIT 1)
            LEFT JOIN (
                SELECT DISTINCT trip_ticket_id, latitude, longitude, speed_kmh, received_at, has_mock_location_flag
                FROM gps_ping gp1
                WHERE received_at = (SELECT MAX(received_at) FROM gps_ping gp2 WHERE gp2.trip_ticket_id = gp1.trip_ticket_id)
            ) gp ON tt.trip_ticket_id = gp.trip_ticket_id
            LEFT JOIN gps_distance_result gdr ON tt.trip_ticket_id = gdr.trip_ticket_id
            WHERE tt.status = 'in_transit'
        ");

        // View 2: v_driver_vehicle_history - Driver vehicle history
        DB::statement("
            CREATE OR REPLACE VIEW v_driver_vehicle_history AS
            SELECT 
                tt.driver_id,
                CONCAT(u.last_name, ', ', u.first_name) AS driver_name,
                tt.vehicle_id,
                v.vehicle_model,
                v.plate_number,
                COUNT(*) AS total_trip_count,
                SUM(CASE WHEN tt.status = 'closed' THEN 1 ELSE 0 END) AS completed_trips,
                SUM(CASE WHEN tt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_trips,
                SUM(CASE WHEN tt.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_trips,
                MAX(tt.submitted_at) AS last_trip_date,
                MIN(tt.submitted_at) AS first_trip_date,
                DATEDIFF(MAX(tt.submitted_at), MIN(tt.submitted_at)) / NULLIF(COUNT(*), 0) AS avg_days_between_trips,
                (SELECT destination FROM trip_ticket t2 
                 WHERE t2.driver_id = tt.driver_id 
                 GROUP BY destination 
                 ORDER BY COUNT(*) DESC LIMIT 1) AS most_common_destination
            FROM trip_ticket tt
            JOIN drivers d ON tt.driver_id = d.driver_id
            JOIN users u ON d.user_id = u.user_id
            JOIN vehicles v ON tt.vehicle_id = v.vehicle_id
            GROUP BY tt.driver_id, u.last_name, u.first_name, tt.vehicle_id, v.vehicle_model, v.plate_number
        ");

        // View 3: v_fuel_log_computed - Fuel efficiency calculations
        DB::statement("
            CREATE OR REPLACE VIEW v_fuel_log_computed AS
            SELECT 
                fl.fuel_log_id,
                fl.gas_slip_id,
                fl.liters_availed,
                fl.amount_on_receipt,
                fl.receipt_photo_path,
                fl.receipt_phash,
                fl.receipt_uploaded_at,
                fl.duplicate_receipt_flag,
                fl.odometer_out,
                fl.odometer_in,
                CASE 
                    WHEN fl.odometer_in IS NOT NULL AND fl.odometer_out IS NOT NULL 
                    THEN CAST(fl.odometer_in - fl.odometer_out AS DECIMAL(8,2))
                    ELSE NULL 
                END AS total_odometer_km,
                CASE 
                    WHEN fl.odometer_in IS NOT NULL AND fl.odometer_out IS NOT NULL AND fl.liters_availed > 0 
                    THEN ROUND((fl.odometer_in - fl.odometer_out) / fl.liters_availed, 2)
                    ELSE NULL 
                END AS fuel_efficiency_kmpl,
                CASE 
                    WHEN fl.amount_on_receipt IS NOT NULL AND fl.liters_availed > 0 
                    THEN ROUND(fl.amount_on_receipt / fl.liters_availed, 2)
                    ELSE NULL 
                END AS cost_per_km,
                CASE 
                    WHEN fl.odometer_in IS NOT NULL AND fl.odometer_out IS NOT NULL AND fl.odometer_in < fl.odometer_out 
                    THEN 1 ELSE 0 
                END AS odometer_anomaly_flag,
                CASE 
                    WHEN fl.liters_availed > 0 AND (fl.odometer_in - fl.odometer_out) / fl.liters_availed < 3 
                    THEN 1 ELSE 0 
                END AS low_efficiency_flag,
                CASE 
                    WHEN fl.liters_availed > 0 AND (fl.odometer_in - fl.odometer_out) / fl.liters_availed > 10 
                    THEN 1 ELSE 0 
                END AS high_efficiency_flag,
                fl.distance_source,
                fl.odometer_continuity_flag,
                fl.has_movement_flag,
                fl.trip_elapsed_minutes,
                fl.gps_tracking_started_at,
                fl.gps_tracking_ended_at,
                CASE 
                    WHEN fl.trip_elapsed_minutes > 0 AND gdr.gps_total_km > 0 
                    THEN ROUND(gdr.gps_total_km / (fl.trip_elapsed_minutes / 60), 2)
                    ELSE NULL 
                END AS average_speed_kmh,
                fl.created_at,
                fl.updated_at,
                CASE 
                    WHEN fl.receipt_uploaded_at IS NOT NULL THEN 30
                    WHEN fl.odometer_in IS NOT NULL AND fl.odometer_out IS NOT NULL THEN 20
                    WHEN fl.liters_availed IS NOT NULL THEN 10
                    ELSE 0
                END AS data_completeness_score
            FROM fuel_log fl
            LEFT JOIN gps_distance_result gdr ON gdr.trip_ticket_id = (SELECT trip_ticket_id FROM gas_slip WHERE gas_slip_id = fl.gas_slip_id)
        ");

        // View 4: v_gas_slip_full - Complete gas slip information (FIXED - removed full_name)
        DB::statement("
            CREATE OR REPLACE VIEW v_gas_slip_full AS
            SELECT 
                gs.gas_slip_id,
                gs.trip_ticket_id,
                tt.trip_ticket_number AS control_number,
                gs.amount_released,
                gs.reconciliation_status,
                gs.reconciliation_note,
                gs.reconciled_by,
                gs.reconciled_at,
                gs.receipt_acknowledged_by,
                gs.receipt_acknowledged_at,
                gs.created_by,
                gs.created_at,
                u_drv.first_name AS driver_first_name,
                u_drv.middle_name AS driver_middle_name,
                u_drv.last_name AS driver_last_name,
                CONCAT(u_drv.last_name, ', ', u_drv.first_name) AS driver_full_name,
                ss_mayor.setting_value AS mayor_name,
                ss_station.setting_value AS contracted_station_name,
                v.vehicle_model,
                v.plate_number,
                COALESCE(snap.fuel_type, v.fuel_type) AS fuel_type,
                tt.trip_date,
                tt.purpose,
                tt.destination,
                tt.charge_to,
                tt.department_id,
                tt.driver_id,
                tt.vehicle_id,
                tt.submitted_by,
                tt.status AS trip_status,
                ha.approved_by AS head_of_office_id,
                CONCAT(u_head.last_name, ', ', u_head.first_name) AS head_of_office_name,
                ha.decision AS head_decision,
                ha.review_note AS head_review_note,
                ha.reviewed_at AS head_reviewed_at,
                ha.is_oic_action,
                ha.review_cycle AS approval_cycle,
                uesig.signature_image AS head_esig_image,
                uesig.signature_hash AS head_esig_hash,
                tesig.signed_at AS head_signed_at,
                tesig.signed_ip AS head_signed_ip,
                gv.decision AS gso_decision,
                gv.gso_note,
                gv.verified_at AS gso_verified_at,
                CONCAT(u_gso.last_name, ', ', u_gso.first_name) AS gso_verified_by_name,
                mr.decision AS mo_decision,
                mr.review_note AS mo_review_note,
                mr.reviewed_at AS mo_reviewed_at,
                CONCAT(u_mo.last_name, ', ', u_mo.first_name) AS mo_reviewed_by_name,
                fl.fuel_log_id,
                fl.liters_availed,
                fl.amount_on_receipt,
                fl.receipt_photo_path,
                fl.receipt_uploaded_at,
                fl.odometer_out,
                fl.odometer_in,
                fl.distance_source,
                fl.duplicate_receipt_flag,
                fl.trip_elapsed_minutes,
                vfc.fuel_efficiency_kmpl AS computed_fuel_efficiency_kmpl,
                fi.issuance_id,
                fi.amount_released AS fund_amount_released,
                fi.budget_before,
                fi.budget_after,
                fi.issued_at,
                fi.acknowledged_at,
                CONCAT(u_issuer.last_name, ', ', u_issuer.first_name) AS issued_by_name,
                CONCAT(u_ack.last_name, ', ', u_ack.first_name) AS acknowledged_by_name
            FROM gas_slip gs
            JOIN trip_ticket tt ON tt.trip_ticket_id = gs.trip_ticket_id
            JOIN drivers d ON d.driver_id = tt.driver_id
            JOIN users u_drv ON u_drv.user_id = d.user_id
            JOIN vehicles v ON v.vehicle_id = tt.vehicle_id
            LEFT JOIN trip_ticket_vehicle_snapshot snap ON snap.trip_ticket_id = tt.trip_ticket_id
            LEFT JOIN system_setting ss_mayor ON ss_mayor.setting_key = 'mayor_name'
            LEFT JOIN system_setting ss_station ON ss_station.setting_key = 'contracted_station_name'
            LEFT JOIN head_approval ha ON ha.trip_ticket_id = tt.trip_ticket_id AND ha.review_cycle = (
                SELECT MAX(review_cycle) FROM head_approval WHERE trip_ticket_id = tt.trip_ticket_id
            )
            LEFT JOIN users u_head ON u_head.user_id = ha.approved_by
            LEFT JOIN trip_ticket_esignature tesig ON tesig.head_approval_id = ha.approval_id
            LEFT JOIN user_esignature uesig ON uesig.esig_id = tesig.esig_id AND uesig.is_active = 1
            LEFT JOIN gso_verification gv ON gv.trip_ticket_id = tt.trip_ticket_id AND gv.review_cycle = (
                SELECT MAX(review_cycle) FROM gso_verification WHERE trip_ticket_id = tt.trip_ticket_id
            )
            LEFT JOIN users u_gso ON u_gso.user_id = gv.gso_verified_by
            LEFT JOIN mo_review mr ON mr.trip_ticket_id = tt.trip_ticket_id AND mr.review_cycle = (
                SELECT MAX(review_cycle) FROM mo_review WHERE trip_ticket_id = tt.trip_ticket_id
            )
            LEFT JOIN users u_mo ON u_mo.user_id = mr.reviewed_by
            LEFT JOIN fuel_log fl ON fl.gas_slip_id = gs.gas_slip_id
            LEFT JOIN v_fuel_log_computed vfc ON vfc.fuel_log_id = fl.fuel_log_id
            LEFT JOIN fund_issuance fi ON fi.gas_slip_id = gs.gas_slip_id
            LEFT JOIN users u_issuer ON u_issuer.user_id = fi.issued_by
            LEFT JOIN users u_ack ON u_ack.user_id = fi.acknowledged_by
        ");

        // View 5: v_remaining_budget - Budget calculation with warnings
        DB::statement("
            CREATE OR REPLACE VIEW v_remaining_budget AS
            SELECT 
                p.period_id,
                p.department_id,
                d.department_name,
                d.department_code,
                p.week_start,
                p.week_end,
                p.allocated_amount,
                COALESCE(SUM(fi.amount_released), 0) AS total_spent_amount,
                p.allocated_amount - COALESCE(SUM(fi.amount_released), 0) AS remaining_amount,
                ROUND((COALESCE(SUM(fi.amount_released), 0) / NULLIF(p.allocated_amount, 0)) * 100, 2) AS utilization_percentage,
                CASE WHEN COALESCE(SUM(fi.amount_released), 0) > p.allocated_amount THEN 1 ELSE 0 END AS is_over_budget,
                CASE WHEN (p.allocated_amount - COALESCE(SUM(fi.amount_released), 0)) / NULLIF(p.allocated_amount, 0) * 100 < 10 THEN 1 ELSE 0 END AS is_critical_low_warning,
                CASE WHEN (p.allocated_amount - COALESCE(SUM(fi.amount_released), 0)) / NULLIF(p.allocated_amount, 0) * 100 < 20 THEN 1 ELSE 0 END AS is_low_warning,
                p.status,
                p.created_at,
                p.closed_at,
                DATEDIFF(p.week_end, CURDATE()) AS days_remaining_in_period,
                ROUND(COALESCE(SUM(fi.amount_released), 0) / NULLIF(DATEDIFF(CURDATE(), p.week_start), 0), 2) AS avg_daily_spend,
                ROUND(COALESCE(SUM(fi.amount_released), 0) / NULLIF(DATEDIFF(CURDATE(), p.week_start), 0) * 7, 2) AS projected_week_total
            FROM dept_budget_period p
            JOIN departments d ON d.department_id = p.department_id
            LEFT JOIN fund_issuance fi ON fi.period_id = p.period_id
            GROUP BY p.period_id, p.department_id, d.department_name, d.department_code, p.week_start, p.week_end, p.allocated_amount, p.status, p.created_at, p.closed_at
        ");
    }

    public function down()
    {
        DB::statement("DROP VIEW IF EXISTS v_active_trips_gps");
        DB::statement("DROP VIEW IF EXISTS v_driver_vehicle_history");
        DB::statement("DROP VIEW IF EXISTS v_fuel_log_computed");
        DB::statement("DROP VIEW IF EXISTS v_gas_slip_full");
        DB::statement("DROP VIEW IF EXISTS v_remaining_budget");
    }
};