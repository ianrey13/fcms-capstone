-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 09, 2026 at 08:35 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fcms_dbv1`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `proc_weekly_budget_reset` ()   BEGIN
    DECLARE v_week_start DATE;
    DECLARE v_week_end DATE;
    
    -- Get current week dates (Monday to Sunday)
    SET v_week_start = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
    SET v_week_end = DATE_ADD(v_week_start, INTERVAL 6 DAY);
    
    -- Close all active budget periods (they are now expired)
    UPDATE dept_budget_period 
    SET 
        status = 'closed',
        closed_at = NOW()
    WHERE status = 'active';
    
    -- Insert new budget periods for each department that has a policy
    INSERT INTO dept_budget_period (department_id, week_start, week_end, allocated_amount, status, created_at)
    SELECT 
        dbp.department_id,
        v_week_start,
        v_week_end,
        dbp.default_weekly_allocation,
        'active',
        NOW()
    FROM dept_budget_policy dbp
    WHERE NOT EXISTS (
        -- Don't create duplicate periods for same week
        SELECT 1 FROM dept_budget_period existing 
        WHERE existing.department_id = dbp.department_id 
        AND existing.week_start = v_week_start
    );
    
    -- Log the reset event
    INSERT INTO event_run_log (event_name, run_at, status, periods_closed, periods_created, notes)
    VALUES (
        'proc_weekly_budget_reset',
        NOW(),
        'success',
        (SELECT COUNT(*) FROM dept_budget_period WHERE status = 'closed' AND closed_at >= NOW() - INTERVAL 1 MINUTE),
        (SELECT COUNT(*) FROM dept_budget_period WHERE created_at >= NOW() - INTERVAL 1 MINUTE AND status = 'active'),
        CONCAT('Weekly budget reset completed for week starting ', v_week_start)
    );
    
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `log_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` int NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `department_id` bigint UNSIGNED NOT NULL,
  `department_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`department_id`, `department_name`, `department_code`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`) VALUES
(1, 'System Administration', 'SYSADMIN', '2026-04-16 01:59:40', NULL, NULL, NULL),
(2, 'General Services Office', 'GSO', '2026-04-16 01:59:40', '2026-04-16 02:57:56', '2026-04-16 02:57:56', 1),
(3, 'Engineering Office', 'ENGR', '2026-04-16 01:59:40', NULL, NULL, NULL),
(4, 'Rural Health Center', 'RHU', '2026-04-16 01:59:40', NULL, NULL, NULL),
(5, 'Philippine National Police - Laguindingan', 'PNP', '2026-04-16 01:59:40', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `department_request`
--

CREATE TABLE `department_request` (
  `request_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `submitted_by` bigint UNSIGNED NOT NULL,
  `request_type` enum('vehicle_breakdown','vehicle_repaired','odometer_non_functional','odometer_restored','new_vehicle_registration','driver_activation','driver_deactivation','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `affected_vehicle_id` bigint UNSIGNED DEFAULT NULL,
  `affected_driver_id` bigint UNSIGNED DEFAULT NULL,
  `date_noticed` date DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending_superadmin','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_superadmin',
  `reviewed_by` bigint UNSIGNED DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dept_budget_period`
--

CREATE TABLE `dept_budget_period` (
  `period_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `week_start` date NOT NULL,
  `week_end` date DEFAULT NULL,
  `allocated_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `dept_budget_period`
--

INSERT INTO `dept_budget_period` (`period_id`, `department_id`, `week_start`, `week_end`, `allocated_amount`, `status`, `created_at`, `closed_at`) VALUES
(1, 3, '2026-04-13', '2026-04-19', '10000.00', 'closed', '2026-04-16 01:59:41', '2026-04-26 13:17:14'),
(2, 4, '2026-04-13', '2026-04-19', '5000.00', 'closed', '2026-04-16 01:59:41', '2026-04-26 13:17:14'),
(3, 5, '2026-04-13', '2026-04-19', '5000.00', 'closed', '2026-04-16 01:59:41', '2026-04-26 13:17:14'),
(4, 1, '2026-04-13', '2026-04-19', '1000.00', 'closed', '2026-04-16 14:34:26', '2026-04-26 13:17:14'),
(6, 3, '2026-04-20', '2026-04-26', '10000.00', 'closed', '2026-04-26 13:17:14', '2026-04-26 13:17:14'),
(7, 4, '2026-04-20', '2026-04-26', '5000.00', 'closed', '2026-04-26 13:17:14', '2026-04-26 13:17:14'),
(8, 5, '2026-04-20', '2026-04-26', '5000.00', 'closed', '2026-04-26 13:17:14', '2026-04-26 13:17:14'),
(9, 1, '2026-04-20', '2026-04-26', '1000.00', 'closed', '2026-04-26 13:17:14', '2026-04-26 13:17:14'),
(10, 3, '2026-04-27', '2026-05-03', '10000.00', 'closed', '2026-04-27 23:58:32', '2026-05-04 12:43:03'),
(11, 4, '2026-04-27', '2026-05-03', '5000.00', 'closed', '2026-04-27 23:58:42', '2026-05-04 12:43:03'),
(12, 5, '2026-04-27', '2026-05-03', '5000.00', 'closed', '2026-04-27 23:58:49', '2026-05-04 12:43:03'),
(13, 1, '2026-04-27', '2026-05-03', '1000.00', 'closed', '2026-04-27 23:58:57', '2026-05-04 12:43:03'),
(15, 3, '2026-05-04', '2026-05-10', '10000.00', 'active', '2026-05-04 12:43:03', NULL),
(16, 4, '2026-05-04', '2026-05-10', '5000.00', 'active', '2026-05-04 12:43:03', NULL),
(17, 5, '2026-05-04', '2026-05-10', '5000.00', 'active', '2026-05-04 12:43:03', NULL),
(18, 1, '2026-05-04', '2026-05-10', '1000.00', 'active', '2026-05-04 12:43:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dept_budget_policy`
--

CREATE TABLE `dept_budget_policy` (
  `policy_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `default_weekly_allocation` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dept_budget_policy`
--

INSERT INTO `dept_budget_policy` (`policy_id`, `department_id`, `default_weekly_allocation`, `created_at`, `updated_at`) VALUES
(1, 3, '10000.00', '2026-04-16 01:59:41', NULL),
(2, 4, '5000.00', '2026-04-16 01:59:41', NULL),
(3, 5, '5000.00', '2026-04-16 01:59:41', NULL),
(4, 1, '1000.00', '2026-04-16 14:34:26', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dept_crud_request`
--

CREATE TABLE `dept_crud_request` (
  `request_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `submitted_by` bigint UNSIGNED NOT NULL,
  `request_type` enum('add_vehicle','edit_vehicle','deactivate_vehicle','reactivate_vehicle','register_driver','deactivate_driver','reactivate_driver','add_staff','deactivate_staff') COLLATE utf8mb4_unicode_ci NOT NULL,
  `affected_vehicle_id` bigint UNSIGNED DEFAULT NULL,
  `affected_driver_id` bigint UNSIGNED DEFAULT NULL,
  `affected_user_id` bigint UNSIGNED DEFAULT NULL,
  `request_details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending_superadmin','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_superadmin',
  `reviewed_by` bigint UNSIGNED DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `driver_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `deactivated_by` bigint UNSIGNED DEFAULT NULL,
  `deactivation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `drivers`
--

INSERT INTO `drivers` (`driver_id`, `user_id`, `status`, `created_at`, `updated_at`, `deactivated_at`, `deactivated_by`, `deactivation_reason`, `deleted_at`, `deleted_by`) VALUES
(1, 4, 'active', '2026-04-16 01:59:41', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 6, 'active', '2026-04-16 01:59:41', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 12, 'active', '2026-04-22 18:19:07', '2026-04-22 18:19:07', NULL, NULL, NULL, NULL, NULL),
(4, 13, 'active', '2026-05-04 13:10:12', '2026-05-04 13:10:12', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `event_run_log`
--

CREATE TABLE `event_run_log` (
  `log_id` bigint UNSIGNED NOT NULL,
  `event_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `run_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('skipped','success','partial','error') COLLATE utf8mb4_unicode_ci NOT NULL,
  `periods_closed` smallint NOT NULL DEFAULT '0',
  `periods_created` smallint NOT NULL DEFAULT '0',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_run_log`
--

INSERT INTO `event_run_log` (`log_id`, `event_name`, `run_at`, `status`, `periods_closed`, `periods_created`, `error_message`, `notes`) VALUES
(1, 'proc_weekly_budget_reset', '2026-04-26 13:17:14', 'success', 5, 4, NULL, 'Weekly budget reset completed for week starting 2026-04-20'),
(2, 'proc_weekly_budget_reset', '2026-04-26 13:17:14', 'success', 9, 0, NULL, 'Weekly budget reset completed for week starting 2026-04-20'),
(3, 'weekly_budget_reset', '2026-05-04 12:43:03', 'success', 5, 5, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `file_storage`
--

CREATE TABLE `file_storage` (
  `file_id` bigint UNSIGNED NOT NULL,
  `file_uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `file_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `encryption_key_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` bigint UNSIGNED NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_malware_scanned` tinyint(1) NOT NULL DEFAULT '0',
  `is_quarantined` tinyint(1) NOT NULL DEFAULT '0',
  `accessed_count` int NOT NULL DEFAULT '0',
  `last_accessed_at` timestamp NULL DEFAULT NULL,
  `retention_until` date DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fuel_log`
--

CREATE TABLE `fuel_log` (
  `fuel_log_id` bigint UNSIGNED NOT NULL,
  `gas_slip_id` bigint UNSIGNED NOT NULL,
  `liters_availed` decimal(10,3) DEFAULT NULL,
  `amount_on_receipt` decimal(12,2) DEFAULT NULL,
  `receipt_photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_phash` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_uploaded_at` timestamp NULL DEFAULT NULL,
  `odometer_out` int UNSIGNED DEFAULT NULL,
  `odometer_in` int UNSIGNED DEFAULT NULL,
  `distance_source` enum('gps_and_odometer','odometer','gps','partial_gps','unverified') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `odometer_continuity_flag` tinyint(1) NOT NULL DEFAULT '0',
  `has_movement_flag` tinyint(1) NOT NULL DEFAULT '0',
  `duplicate_receipt_flag` tinyint(1) NOT NULL DEFAULT '0',
  `trip_elapsed_minutes` int UNSIGNED DEFAULT NULL,
  `gps_tracking_started_at` timestamp NULL DEFAULT NULL,
  `gps_tracking_ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `fund_issuance`
--

CREATE TABLE `fund_issuance` (
  `issuance_id` bigint UNSIGNED NOT NULL,
  `gas_slip_id` bigint UNSIGNED NOT NULL,
  `period_id` bigint UNSIGNED NOT NULL,
  `issued_by` bigint UNSIGNED NOT NULL,
  `acknowledged_by` bigint UNSIGNED DEFAULT NULL,
  `amount_released` decimal(12,2) NOT NULL,
  `budget_before` decimal(12,2) NOT NULL,
  `budget_after` decimal(12,2) NOT NULL,
  `acknowledgement_method` enum('tap_to_sign') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tap_to_sign',
  `issued_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledged_at` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `fund_issuance`
--

INSERT INTO `fund_issuance` (`issuance_id`, `gas_slip_id`, `period_id`, `issued_by`, `acknowledged_by`, `amount_released`, `budget_before`, `budget_after`, `acknowledgement_method`, `issued_at`, `acknowledged_at`) VALUES
(1, 1, 1, 10, 4, '500.00', '10000.00', '9500.00', 'tap_to_sign', '2026-04-17 02:12:13', '2026-04-17 04:58:11'),
(2, 2, 1, 10, 4, '5000.00', '9500.00', '4500.00', 'tap_to_sign', '2026-04-18 00:28:08', '2026-04-28 09:52:44'),
(3, 3, 1, 10, 4, '300.00', '4500.00', '4200.00', 'tap_to_sign', '2026-04-18 17:43:18', '2026-04-28 08:36:23'),
(4, 4, 1, 10, 4, '500.00', '4200.00', '3700.00', 'tap_to_sign', '2026-04-18 18:06:31', '2026-04-28 08:40:45'),
(6, 6, 1, 10, 4, '3700.00', '3700.00', '0.00', 'tap_to_sign', '2026-04-24 23:30:45', '2026-04-28 08:16:48'),
(7, 11, 10, 10, 4, '300.00', '10000.00', '9700.00', 'tap_to_sign', '2026-04-28 00:21:29', '2026-04-28 08:31:46'),
(8, 12, 15, 10, NULL, '10000.00', '10000.00', '0.00', 'tap_to_sign', '2026-05-06 19:45:41', NULL),
(9, 13, 17, 10, NULL, '500.00', '5000.00', '4500.00', 'tap_to_sign', '2026-05-06 22:24:38', NULL),
(10, 14, 16, 10, NULL, '300.00', '5000.00', '4700.00', 'tap_to_sign', '2026-05-06 23:27:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `gas_slip`
--

CREATE TABLE `gas_slip` (
  `gas_slip_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `amount_released` decimal(10,2) DEFAULT NULL,
  `reconciliation_status` enum('pending','verified','discrepancy') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reconciliation_note` text COLLATE utf8mb4_unicode_ci,
  `reconciled_by` bigint UNSIGNED DEFAULT NULL,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `receipt_acknowledged_by` bigint UNSIGNED DEFAULT NULL,
  `receipt_acknowledged_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gas_slip`
--

INSERT INTO `gas_slip` (`gas_slip_id`, `trip_ticket_id`, `created_by`, `amount_released`, `reconciliation_status`, `reconciliation_note`, `reconciled_by`, `reconciled_at`, `receipt_acknowledged_by`, `receipt_acknowledged_at`, `created_at`, `updated_at`) VALUES
(1, 1, 10, '500.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-17 02:12:13', '2026-04-17 02:12:13'),
(2, 2, 10, '5000.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-18 00:28:08', '2026-04-18 00:28:08'),
(3, 3, 10, '300.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-18 17:43:18', '2026-04-18 17:43:18'),
(4, 4, 10, '500.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-18 18:06:31', '2026-04-18 18:06:31'),
(6, 8, 10, '3700.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-24 23:30:45', '2026-04-24 23:30:45'),
(7, 9, 10, '55.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-24 23:57:37', '2026-04-24 23:57:37'),
(8, 10, 10, '50.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-25 01:17:09', '2026-04-25 01:17:09'),
(9, 11, 10, '165.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-26 02:19:30', '2026-04-26 02:19:30'),
(10, 12, 10, '55.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-26 02:26:28', '2026-04-26 02:26:28'),
(11, 5, 10, '300.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-04-28 00:21:29', '2026-04-28 00:21:29'),
(12, 17, 10, '10000.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-06 19:45:41', '2026-05-06 19:45:41'),
(13, 24, 10, '500.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-06 22:24:38', '2026-05-06 22:24:38'),
(14, 6, 10, '300.00', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-06 23:27:29', '2026-05-06 23:27:29');

-- --------------------------------------------------------

--
-- Table structure for table `gps_distance_result`
--

CREATE TABLE `gps_distance_result` (
  `result_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `gps_total_km` decimal(8,2) NOT NULL,
  `ping_count` int NOT NULL,
  `computed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gps_ping`
--

CREATE TABLE `gps_ping` (
  `ping_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy_meters` decimal(8,2) DEFAULT NULL,
  `speed_kmh` decimal(6,2) DEFAULT NULL,
  `heading_degrees` decimal(5,2) DEFAULT NULL,
  `is_low_accuracy` tinyint(1) NOT NULL DEFAULT '0',
  `is_queued_upload` tinyint(1) NOT NULL DEFAULT '0',
  `has_mock_location_flag` tinyint(1) NOT NULL DEFAULT '0',
  `recorded_at` timestamp NOT NULL,
  `received_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gps_ping`
--

INSERT INTO `gps_ping` (`ping_id`, `trip_ticket_id`, `latitude`, `longitude`, `accuracy_meters`, `speed_kmh`, `heading_degrees`, `is_low_accuracy`, `is_queued_upload`, `has_mock_location_flag`, `recorded_at`, `received_at`) VALUES
(1, 8, '8.5733545', '124.4370589', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 08:31:08', '2026-04-28 08:31:08'),
(2, 5, '8.5733545', '124.4370589', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 08:35:06', '2026-04-28 08:35:06'),
(3, 5, '8.5733545', '124.4370589', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 08:35:37', '2026-04-28 08:35:37'),
(4, 3, '8.5733545', '124.4370589', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 08:36:29', '2026-04-28 08:36:29'),
(5, 4, '8.5733544', '124.4370584', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 09:35:21', '2026-04-28 09:35:21'),
(6, 4, '8.5733544', '124.4370584', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-28 09:35:51', '2026-04-28 09:35:51'),
(7, 2, '8.5733546', '124.4370587', '100.00', '0.00', NULL, 0, 0, 0, '2026-04-30 22:59:42', '2026-04-30 22:59:42'),
(8, 11, '8.5740521', '124.4377984', '159.00', '0.00', NULL, 0, 0, 0, '2026-05-03 00:17:16', '2026-05-03 00:17:16'),
(9, 10, '8.5733547', '124.4370592', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 01:50:03', '2026-05-03 01:50:03'),
(10, 10, '8.5733547', '124.4370592', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 01:53:49', '2026-05-03 01:53:49'),
(11, 10, '8.5733543', '124.4370590', '20.00', '0.00', NULL, 0, 0, 0, '2026-05-03 01:54:16', '2026-05-03 01:54:16'),
(12, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:06:21', '2026-05-03 02:06:21'),
(13, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:06:51', '2026-05-03 02:06:51'),
(14, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:07:21', '2026-05-03 02:07:21'),
(15, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:07:52', '2026-05-03 02:07:52'),
(16, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:08:25', '2026-05-03 02:08:25'),
(17, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:08:51', '2026-05-03 02:08:51'),
(18, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:09:21', '2026-05-03 02:09:21'),
(19, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:09:52', '2026-05-03 02:09:52'),
(20, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:10:22', '2026-05-03 02:10:22'),
(21, 10, '8.5733543', '124.4370590', '100.00', '0.00', NULL, 0, 0, 0, '2026-05-03 02:10:54', '2026-05-03 02:10:54');

-- --------------------------------------------------------

--
-- Table structure for table `gso_verification`
--

CREATE TABLE `gso_verification` (
  `verification_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `review_cycle` tinyint NOT NULL DEFAULT '1',
  `gso_verified_by` bigint UNSIGNED NOT NULL,
  `verified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decision` enum('approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gso_note` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gso_verification`
--

INSERT INTO `gso_verification` (`verification_id`, `trip_ticket_id`, `review_cycle`, `gso_verified_by`, `verified_at`, `decision`, `gso_note`) VALUES
(1, 1, 1, 2, '2026-04-16 23:47:42', 'approved', NULL),
(2, 2, 1, 2, '2026-04-18 00:25:44', 'approved', NULL),
(3, 3, 1, 2, '2026-04-18 17:42:09', 'approved', NULL),
(4, 4, 1, 2, '2026-04-18 17:58:38', 'approved', NULL),
(5, 5, 1, 2, '2026-04-21 03:09:08', 'approved', NULL),
(6, 8, 1, 2, '2026-04-24 23:29:10', 'approved', NULL),
(7, 12, 1, 2, '2026-04-26 02:33:02', 'approved', NULL),
(8, 5, 2, 2, '2026-04-28 00:20:28', 'approved', NULL),
(9, 7, 1, 2, '2026-04-29 06:35:32', 'approved', NULL),
(10, 6, 1, 2, '2026-05-03 00:17:43', 'approved', NULL),
(11, 17, 1, 2, '2026-05-06 19:43:43', 'approved', NULL),
(12, 24, 1, 2, '2026-05-06 20:14:14', 'approved', NULL),
(13, 6, 2, 2, '2026-05-06 22:59:46', 'approved', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `head_approval`
--

CREATE TABLE `head_approval` (
  `approval_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `review_cycle` tinyint NOT NULL DEFAULT '1',
  `approved_by` bigint UNSIGNED NOT NULL,
  `is_oic_action` tinyint(1) NOT NULL DEFAULT '0',
  `decision` enum('approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `head_approval`
--

INSERT INTO `head_approval` (`approval_id`, `trip_ticket_id`, `review_cycle`, `approved_by`, `is_oic_action`, `decision`, `review_note`, `reviewed_at`) VALUES
(1, 1, 1, 9, 1, 'approved', NULL, '2026-04-16 23:16:48'),
(2, 2, 1, 9, 1, 'approved', NULL, '2026-04-18 00:23:50'),
(3, 3, 1, 9, 1, 'approved', NULL, '2026-04-18 17:41:37'),
(4, 4, 1, 9, 1, 'approved', NULL, '2026-04-18 17:58:20'),
(5, 5, 1, 9, 1, 'approved', NULL, '2026-04-20 07:37:49'),
(6, 8, 1, 9, 1, 'approved', NULL, '2026-04-24 23:28:43'),
(7, 5, 2, 9, 1, 'approved', NULL, '2026-04-28 00:19:34'),
(8, 7, 1, 9, 1, 'approved', NULL, '2026-04-29 06:34:46'),
(9, 6, 1, 7, 1, 'approved', NULL, '2026-05-03 00:08:32'),
(10, 13, 1, 9, 1, 'rejected', 'dsadasd', '2026-05-05 06:03:09'),
(11, 14, 1, 9, 1, 'rejected', 'ddsadsad', '2026-05-05 06:05:03'),
(12, 15, 1, 9, 1, 'rejected', 'mahal krudo', '2026-05-05 06:05:16'),
(13, 16, 1, 9, 1, 'rejected', 'dddddd', '2026-05-05 06:42:10'),
(14, 17, 1, 9, 1, 'approved', NULL, '2026-05-06 19:42:58'),
(15, 24, 1, 9, 1, 'approved', NULL, '2026-05-06 20:11:53'),
(16, 6, 2, 7, 1, 'approved', NULL, '2026-05-06 22:59:09');

-- --------------------------------------------------------

--
-- Table structure for table `lookup_request_types`
--

CREATE TABLE `lookup_request_types` (
  `type_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('department','crud') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `requires_attachment` tinyint(1) NOT NULL DEFAULT '0',
  `approval_workflow` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'superadmin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lookup_request_types`
--

INSERT INTO `lookup_request_types` (`type_code`, `category`, `type_name`, `description`, `requires_attachment`, `approval_workflow`) VALUES
('add_staff', 'crud', 'Add Staff', NULL, 0, 'superadmin'),
('add_vehicle', 'crud', 'Add Vehicle', NULL, 0, 'superadmin'),
('deactivate_driver', 'crud', 'Deactivate Driver', NULL, 0, 'superadmin'),
('deactivate_staff', 'crud', 'Deactivate Staff', NULL, 0, 'superadmin'),
('deactivate_vehicle', 'crud', 'Deactivate Vehicle', NULL, 0, 'superadmin'),
('driver_activation', 'department', 'Driver Activation', NULL, 0, 'superadmin'),
('driver_deactivation', 'department', 'Driver Deactivation', NULL, 0, 'superadmin'),
('edit_vehicle', 'crud', 'Edit Vehicle', NULL, 0, 'superadmin'),
('new_vehicle_registration', 'department', 'New Vehicle Registration', NULL, 0, 'superadmin'),
('odometer_non_functional', 'department', 'Odometer Non-Functional', NULL, 0, 'superadmin'),
('odometer_restored', 'department', 'Odometer Restored', NULL, 0, 'superadmin'),
('other', 'department', 'Other Request', NULL, 0, 'superadmin'),
('reactivate_driver', 'crud', 'Reactivate Driver', NULL, 0, 'superadmin'),
('reactivate_vehicle', 'crud', 'Reactivate Vehicle', NULL, 0, 'superadmin'),
('register_driver', 'crud', 'Register Driver', NULL, 0, 'superadmin'),
('vehicle_breakdown', 'department', 'Vehicle Breakdown', NULL, 0, 'superadmin'),
('vehicle_repaired', 'department', 'Vehicle Repaired', NULL, 0, 'superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `lookup_state_transitions`
--

CREATE TABLE `lookup_state_transitions` (
  `id` bigint UNSIGNED NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requires_note` tinyint(1) NOT NULL DEFAULT '0',
  `allowed_roles` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lookup_state_transitions`
--

INSERT INTO `lookup_state_transitions` (`id`, `entity_type`, `from_status`, `to_status`, `requires_note`, `allowed_roles`, `created_at`) VALUES
(1, 'trip_ticket', 'draft', 'pending_head_approval', 0, 'dept_office,head_of_office', '2026-04-16 01:59:36'),
(2, 'trip_ticket', 'draft', 'cancelled', 0, 'dept_office,head_of_office', '2026-04-16 01:59:36'),
(3, 'trip_ticket', 'pending_head_approval', 'pending_gso_review', 0, 'head_of_office', '2026-04-16 01:59:36'),
(4, 'trip_ticket', 'pending_head_approval', 'returned_for_revision', 1, 'head_of_office', '2026-04-16 01:59:36'),
(5, 'trip_ticket', 'pending_head_approval', 'rejected', 1, 'head_of_office', '2026-04-16 01:59:36'),
(6, 'trip_ticket', 'returned_for_revision', 'pending_head_approval', 0, 'dept_office', '2026-04-16 01:59:36'),
(7, 'trip_ticket', 'pending_gso_review', 'pending_mayors_office', 0, 'gso_staff', '2026-04-16 01:59:36'),
(8, 'trip_ticket', 'pending_gso_review', 'returned_for_revision', 1, 'gso_staff', '2026-04-16 01:59:36'),
(9, 'trip_ticket', 'pending_mayors_office', 'funds_issued', 0, 'mayors_office', '2026-04-16 01:59:36'),
(10, 'trip_ticket', 'pending_mayors_office', 'returned_for_revision', 1, 'mayors_office', '2026-04-16 01:59:36'),
(11, 'trip_ticket', 'funds_issued', 'in_transit', 0, 'driver,gso_staff', '2026-04-16 01:59:36'),
(12, 'trip_ticket', 'in_transit', 'pending_reconciliation', 0, 'driver', '2026-04-16 01:59:36'),
(13, 'trip_ticket', 'pending_reconciliation', 'closed', 0, 'gso_staff', '2026-04-16 01:59:36'),
(14, 'trip_ticket', 'pending_reconciliation', 'returned_for_revision', 1, 'gso_staff', '2026-04-16 01:59:36'),
(15, 'trip_ticket', 'returned_for_revision', 'cancelled', 0, 'dept_office,head_of_office', '2026-04-16 03:12:02'),
(16, 'trip_ticket', 'pending_gso_review', 'rejected', 1, 'gso_staff', '2026-04-16 03:12:02'),
(17, 'trip_ticket', 'pending_mayors_office', 'rejected', 1, 'mayors_office', '2026-04-16 03:12:02');

-- --------------------------------------------------------

--
-- Table structure for table `lookup_trip_status`
--

CREATE TABLE `lookup_trip_status` (
  `status_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_terminal` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` tinyint NOT NULL DEFAULT '0',
  `color_code` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#000000'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lookup_trip_status`
--

INSERT INTO `lookup_trip_status` (`status_code`, `status_name`, `description`, `is_terminal`, `display_order`, `color_code`) VALUES
('cancelled', 'Cancelled', NULL, 0, 11, '#adb5bd'),
('closed', 'Closed', NULL, 0, 9, '#198754'),
('draft', 'Draft', NULL, 0, 1, '#6c757d'),
('funds_issued', 'Funds Issued', NULL, 0, 6, '#28a745'),
('in_transit', 'In Transit', NULL, 0, 7, '#007bff'),
('pending_gso_review', 'Pending GSO Review', NULL, 0, 3, '#fd7e14'),
('pending_head_approval', 'Pending Head Approval', NULL, 0, 2, '#ffc107'),
('pending_mayors_office', 'Pending Mayors Office', NULL, 0, 4, '#17a2b8'),
('pending_reconciliation', 'Pending Reconciliation', NULL, 0, 8, '#20c997'),
('rejected', 'Rejected', NULL, 0, 10, '#dc3545'),
('returned_for_revision', 'Returned for Revision', NULL, 0, 5, '#6f42c1');

-- --------------------------------------------------------

--
-- Table structure for table `lookup_user_roles`
--

CREATE TABLE `lookup_user_roles` (
  `role_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `hierarchy_level` tinyint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lookup_user_roles`
--

INSERT INTO `lookup_user_roles` (`role_code`, `role_name`, `description`, `hierarchy_level`, `is_active`, `created_at`) VALUES
('dept_office', 'Department Staff', NULL, 10, 1, '2026-04-16 01:59:35'),
('driver', 'Driver', NULL, 5, 1, '2026-04-16 01:59:35'),
('gso_staff', 'GSO Staff', NULL, 40, 1, '2026-04-16 01:59:35'),
('head_of_office', 'Head of Office', NULL, 50, 1, '2026-04-16 01:59:35'),
('mayors_office', 'Mayors Office', NULL, 60, 1, '2026-04-16 01:59:35'),
('superadmin', 'Super Administrator', NULL, 100, 1, '2026-04-16 01:59:35');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2026_04_02_123056_create_password_reset_tokens_table', 1),
(3, '2026_04_16_004024_create_lookup_user_roles_table', 1),
(4, '2026_04_16_004029_create_lookup_trip_status_table', 1),
(5, '2026_04_16_004034_create_lookup_state_transitions_table', 1),
(6, '2026_04_16_004043_create_lookup_request_types_table', 1),
(7, '2026_04_16_004049_create_departments_table', 1),
(8, '2026_04_16_004055_create_users_table', 1),
(9, '2026_04_16_004101_create_system_setting_table', 1),
(10, '2026_04_16_004256_create_event_run_log_table', 1),
(11, '2026_04_16_004302_create_drivers_table', 1),
(12, '2026_04_16_004307_create_vehicles_table', 1),
(13, '2026_04_16_004311_create_user_esignature_table', 1),
(14, '2026_04_16_004315_create_trip_ticket_table', 1),
(15, '2026_04_16_004320_create_head_approval_table', 1),
(16, '2026_04_16_004325_create_gso_verification_table', 1),
(17, '2026_04_16_004329_create_mo_review_table', 1),
(18, '2026_04_16_004334_create_trip_ticket_esignature_table', 1),
(19, '2026_04_16_004339_create_dept_budget_policy_table', 1),
(20, '2026_04_16_004355_create_dept_budget_period_table', 1),
(21, '2026_04_16_004400_create_gas_slip_table', 1),
(22, '2026_04_16_004405_create_fuel_log_table', 1),
(23, '2026_04_16_004413_create_fund_issuance_table', 1),
(24, '2026_04_16_004419_create_gps_ping_table', 1),
(25, '2026_04_16_004423_create_gps_distance_result_table', 1),
(26, '2026_04_16_004428_create_department_request_table', 1),
(27, '2026_04_16_004432_create_dept_crud_request_table', 1),
(28, '2026_04_16_004451_create_oic_designation_table', 1),
(29, '2026_04_16_004458_create_oic_delegation_log_table', 1),
(30, '2026_04_16_004505_create_trip_ticket_return_table', 1),
(31, '2026_04_16_004512_create_trip_ticket_cancellation_table', 1),
(32, '2026_04_16_004516_create_trip_ticket_vehicle_snapshot_table', 1),
(33, '2026_04_16_004611_create_vehicle_odometer_status_table', 1),
(34, '2026_04_16_004619_create_notification_table', 1),
(35, '2026_04_16_004624_create_audit_log_table', 1),
(36, '2026_04_16_004631_create_file_storage_table', 1),
(37, '2026_04_16_005320_create_views', 1);

-- --------------------------------------------------------

--
-- Table structure for table `mo_review`
--

CREATE TABLE `mo_review` (
  `review_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `review_cycle` tinyint NOT NULL DEFAULT '1',
  `reviewed_by` bigint UNSIGNED NOT NULL,
  `decision` enum('approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mo_review`
--

INSERT INTO `mo_review` (`review_id`, `trip_ticket_id`, `review_cycle`, `reviewed_by`, `decision`, `review_note`, `reviewed_at`) VALUES
(1, 1, 1, 10, 'approved', NULL, '2026-04-17 02:12:13'),
(2, 2, 1, 10, 'approved', NULL, '2026-04-18 00:28:08'),
(3, 3, 1, 10, 'approved', NULL, '2026-04-18 17:43:18'),
(4, 4, 1, 10, 'approved', NULL, '2026-04-18 18:06:31'),
(5, 5, 1, 10, 'approved', NULL, '2026-04-22 18:16:44'),
(6, 8, 1, 10, 'approved', NULL, '2026-04-24 23:30:45'),
(7, 5, 2, 10, 'approved', NULL, '2026-04-28 00:21:29'),
(8, 17, 1, 10, 'approved', NULL, '2026-05-06 19:45:41'),
(9, 24, 1, 10, 'approved', NULL, '2026-05-06 22:24:38'),
(10, 6, 1, 10, 'rejected', 'dsadasd', '2026-05-06 22:57:17'),
(11, 7, 1, 10, 'rejected', 'sadasdasd', '2026-05-06 22:57:24'),
(12, 6, 2, 10, 'approved', NULL, '2026-05-06 23:27:29');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notification_id` bigint UNSIGNED NOT NULL,
  `recipient_user_id` bigint UNSIGNED NOT NULL,
  `notification_type` enum('trip_submitted','head_approved','head_rejected','oic_activated','oic_deactivated','gso_approved','gso_rejected','forwarded_to_mo','batch_forwarded_to_mo','mo_approved','mo_rejected','fund_issued','trip_started','trip_completed','reconciliation_closed','duplicate_receipt_flag','signature_integrity_violation','crud_request_submitted','crud_request_approved','crud_request_rejected','budget_low_warning','fund_return_pending','budget_assistance_request','mo_created_ticket') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` enum('trip_ticket','gas_slip','fund_issuance','department_request','dept_crud_request','oic_designation','trip_ticket_esignature','mo_request') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('in_app','push') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_app',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`notification_id`, `recipient_user_id`, `notification_type`, `entity_type`, `entity_id`, `message`, `channel`, `is_read`, `created_at`, `read_at`) VALUES
(1, 2, 'trip_submitted', 'trip_ticket', 1, 'Trip ticket 2026-04-001 is ready for GSO review', 'in_app', 0, '2026-04-16 23:16:48', NULL),
(2, 4, 'fund_issued', 'trip_ticket', 1, 'Funds of ₱500 have been released for trip ticket 2026-04-001', 'in_app', 0, '2026-04-17 02:12:13', NULL),
(3, 9, 'trip_submitted', 'trip_ticket', 2, 'Trip ticket 2026-04-002 requires your approval', 'in_app', 0, '2026-04-18 00:22:28', NULL),
(4, 2, 'trip_submitted', 'trip_ticket', 2, 'Trip ticket 2026-04-002 is ready for GSO review', 'in_app', 0, '2026-04-18 00:23:50', NULL),
(5, 10, 'forwarded_to_mo', 'trip_ticket', 2, 'Trip ticket 2026-04-002 is ready for fund release', 'in_app', 1, '2026-04-18 00:25:44', '2026-04-24 23:32:33'),
(6, 10, 'batch_forwarded_to_mo', 'trip_ticket', 2, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-18 00:26:10', '2026-04-24 23:32:33'),
(7, 4, 'fund_issued', 'trip_ticket', 2, 'Funds of ₱5000 have been released for trip ticket 2026-04-002', 'in_app', 0, '2026-04-18 00:28:08', NULL),
(8, 9, 'trip_submitted', 'trip_ticket', 3, 'Trip ticket 2026-04-003 requires your approval', 'in_app', 0, '2026-04-18 17:37:58', NULL),
(9, 2, 'trip_submitted', 'trip_ticket', 3, 'Trip ticket 2026-04-003 is ready for GSO review', 'in_app', 0, '2026-04-18 17:41:37', NULL),
(10, 10, 'forwarded_to_mo', 'trip_ticket', 3, 'Trip ticket 2026-04-003 is ready for fund release', 'in_app', 1, '2026-04-18 17:42:09', '2026-04-24 23:32:33'),
(11, 10, 'batch_forwarded_to_mo', 'trip_ticket', 3, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-18 17:42:20', '2026-04-24 23:32:33'),
(12, 4, 'fund_issued', 'trip_ticket', 3, 'Funds of ₱300 have been released for trip ticket 2026-04-003', 'in_app', 0, '2026-04-18 17:43:18', NULL),
(13, 9, 'trip_submitted', 'trip_ticket', 4, 'Trip ticket 2026-04-004 requires your approval', 'in_app', 0, '2026-04-18 17:57:24', NULL),
(14, 2, 'trip_submitted', 'trip_ticket', 4, 'Trip ticket 2026-04-004 is ready for GSO review', 'in_app', 0, '2026-04-18 17:58:20', NULL),
(15, 10, 'forwarded_to_mo', 'trip_ticket', 4, 'Trip ticket 2026-04-004 is ready for fund release', 'in_app', 1, '2026-04-18 17:58:38', '2026-04-24 23:32:33'),
(16, 10, 'batch_forwarded_to_mo', 'trip_ticket', 4, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-18 17:58:43', '2026-04-24 23:25:22'),
(17, 4, 'fund_issued', 'trip_ticket', 4, 'Funds of ₱500 have been released for trip ticket 2026-04-004', 'in_app', 0, '2026-04-18 18:06:31', NULL),
(18, 9, 'trip_submitted', 'trip_ticket', 5, 'Trip ticket 2026-04-005 requires your approval', 'in_app', 0, '2026-04-20 07:37:27', NULL),
(19, 2, 'trip_submitted', 'trip_ticket', 5, 'Trip ticket 2026-04-005 is ready for GSO review', 'in_app', 0, '2026-04-20 07:37:49', NULL),
(20, 10, 'forwarded_to_mo', 'trip_ticket', 5, 'Trip ticket 2026-04-005 is ready for fund release', 'in_app', 1, '2026-04-21 03:09:08', '2026-04-24 23:32:33'),
(21, 10, 'batch_forwarded_to_mo', 'trip_ticket', 5, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-21 03:13:44', '2026-04-24 23:32:33'),
(22, 4, 'fund_issued', 'trip_ticket', 5, 'Funds of ₱99999 have been released for trip ticket 2026-04-005', 'in_app', 0, '2026-04-22 18:16:44', NULL),
(23, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱-96,299.00\nEstimated Cost: ₱55.00\nShortage: ₱96,354.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 22:43:22', '2026-04-24 23:32:33'),
(24, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱-96,299.00\nEstimated Cost: ₱165.00\nShortage: ₱96,464.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 22:44:06', '2026-04-24 23:32:33'),
(25, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱-96,299.00\nEstimated Cost: ₱165.00\nShortage: ₱96,464.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 22:44:18', '2026-04-24 23:11:41'),
(26, 9, 'trip_submitted', 'trip_ticket', 7, 'Trip ticket 2026-04-007 requires your approval', 'in_app', 0, '2026-04-24 23:26:44', NULL),
(27, 9, 'trip_submitted', 'trip_ticket', 8, 'Trip ticket 2026-04-008 requires your approval', 'in_app', 0, '2026-04-24 23:27:43', NULL),
(28, 2, 'trip_submitted', 'trip_ticket', 8, 'Trip ticket 2026-04-008 is ready for GSO review', 'in_app', 0, '2026-04-24 23:28:43', NULL),
(29, 10, 'forwarded_to_mo', 'trip_ticket', 8, 'Trip ticket 2026-04-008 is ready for fund release', 'in_app', 1, '2026-04-24 23:29:10', '2026-04-24 23:32:33'),
(30, 10, 'batch_forwarded_to_mo', 'trip_ticket', 8, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-24 23:29:16', '2026-04-24 23:29:46'),
(31, 4, 'fund_issued', 'trip_ticket', 8, 'Funds of ₱3700 have been released for trip ticket 2026-04-008 (Department Budget)', 'in_app', 0, '2026-04-24 23:30:45', NULL),
(32, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱165.00\nShortage: ₱165.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 23:31:44', '2026-04-24 23:32:33'),
(33, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱165.00\nShortage: ₱165.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 23:31:56', '2026-04-24 23:38:21'),
(34, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱50.00\nShortage: ₱50.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 23:39:04', '2026-04-24 23:40:41'),
(35, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱165.00\nShortage: ₱165.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 23:41:37', '2026-04-24 23:56:13'),
(36, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱55.00\nShortage: ₱55.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-24 23:56:52', '2026-04-25 00:00:54'),
(37, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱50.00\nShortage: ₱50.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-25 01:15:13', '2026-04-25 01:16:42'),
(38, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱165.00\nShortage: ₱165.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-26 02:18:23', '2026-05-06 18:35:34'),
(39, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱55.00\nShortage: ₱55.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-26 02:25:58', '2026-05-07 01:31:19'),
(40, 3, 'mo_created_ticket', 'trip_ticket', 12, '✅ Mayor\'s Office has created a trip ticket for your department.\n\nTicket #: 2026-04-012\nCharge To: ddd\nThis trip is funded by Mayor\'s Office (no budget deduction from your department).', 'in_app', 1, '2026-04-26 02:26:28', '2026-04-26 02:30:40'),
(41, 2, 'trip_submitted', 'trip_ticket', 12, 'Trip ticket 2026-04-012 (MO Funded) is ready for GSO review', 'in_app', 1, '2026-04-26 02:26:28', '2026-04-26 02:31:52'),
(42, 10, 'forwarded_to_mo', 'trip_ticket', 12, 'Trip ticket 2026-04-012 is ready for fund release', 'in_app', 1, '2026-04-26 02:33:02', '2026-05-07 01:31:19'),
(43, 10, 'batch_forwarded_to_mo', 'trip_ticket', 12, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-26 02:33:13', '2026-05-07 01:31:19'),
(44, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱165.00\nShortage: ₱165.00\n\nPlease create a trip ticket for this department.', 'in_app', 1, '2026-04-27 23:05:10', '2026-05-07 01:31:19'),
(45, 9, 'trip_submitted', 'trip_ticket', 13, 'Trip ticket 2026-04-013 requires your approval', 'in_app', 0, '2026-04-28 00:14:14', NULL),
(46, 9, 'trip_submitted', 'trip_ticket', 14, 'Trip ticket 2026-04-014 requires your approval', 'in_app', 0, '2026-04-28 00:18:13', NULL),
(47, 2, 'trip_submitted', 'trip_ticket', 5, 'Trip ticket 2026-04-005 is ready for GSO review', 'in_app', 0, '2026-04-28 00:19:34', NULL),
(48, 10, 'forwarded_to_mo', 'trip_ticket', 5, 'Trip ticket 2026-04-005 is ready for fund release', 'in_app', 1, '2026-04-28 00:20:28', '2026-05-07 01:31:19'),
(49, 10, 'batch_forwarded_to_mo', 'trip_ticket', 5, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-28 00:20:35', '2026-05-07 01:31:19'),
(50, 4, 'fund_issued', 'trip_ticket', 5, 'Funds of ₱300 have been released for trip ticket 2026-04-005 (Department Budget)', 'in_app', 0, '2026-04-28 00:21:29', NULL),
(51, 2, 'trip_submitted', 'trip_ticket', 7, 'Trip ticket 2026-04-007 is ready for GSO review', 'in_app', 0, '2026-04-29 06:34:46', NULL),
(52, 10, 'forwarded_to_mo', 'trip_ticket', 7, 'Trip ticket 2026-04-007 is ready for fund release', 'in_app', 1, '2026-04-29 06:35:32', '2026-05-07 01:31:19'),
(53, 10, 'batch_forwarded_to_mo', 'trip_ticket', 7, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-04-29 06:35:39', '2026-05-07 01:31:19'),
(54, 2, 'trip_submitted', 'trip_ticket', 6, 'Trip ticket 2026-04-006 is ready for GSO review', 'in_app', 0, '2026-05-03 00:08:32', NULL),
(55, 10, 'forwarded_to_mo', 'trip_ticket', 6, 'Trip ticket 2026-04-006 is ready for fund release', 'in_app', 1, '2026-05-03 00:17:43', '2026-05-07 01:31:19'),
(56, 10, 'batch_forwarded_to_mo', 'trip_ticket', 6, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-05-03 00:18:19', '2026-05-07 01:31:19'),
(57, 9, 'trip_submitted', 'trip_ticket', 15, 'Trip ticket 2026-05-001 requires your approval', 'in_app', 0, '2026-05-04 15:20:24', NULL),
(58, 9, 'trip_submitted', 'trip_ticket', 16, 'Trip ticket 2026-05-002 requires your approval', 'in_app', 0, '2026-05-04 20:01:01', NULL),
(59, 9, 'trip_submitted', 'trip_ticket', 17, 'Trip ticket 2026-05-003 requires your approval', 'in_app', 0, '2026-05-04 20:47:02', NULL),
(60, 9, 'trip_submitted', 'trip_ticket', 18, 'Trip ticket 2026-05-004 requires your approval', 'in_app', 0, '2026-05-05 05:14:27', NULL),
(61, 9, 'trip_submitted', 'trip_ticket', 19, 'Trip ticket 2026-05-005 requires your approval', 'in_app', 0, '2026-05-05 05:19:51', NULL),
(62, 9, 'trip_submitted', 'trip_ticket', 20, 'Trip ticket 2026-05-006 requires your approval', 'in_app', 0, '2026-05-05 05:28:45', NULL),
(63, 9, 'trip_submitted', 'trip_ticket', 21, 'Trip ticket 2026-05-007 requires your approval', 'in_app', 0, '2026-05-05 05:42:44', NULL),
(64, 3, 'head_rejected', 'trip_ticket', 13, 'Trip ticket 2026-04-013 was rejected: dsadasd', 'in_app', 0, '2026-05-05 06:03:09', NULL),
(65, 3, 'head_rejected', 'trip_ticket', 14, 'Trip ticket 2026-04-014 was rejected: ddsadsad', 'in_app', 0, '2026-05-05 06:05:03', NULL),
(66, 3, 'head_rejected', 'trip_ticket', 15, 'Trip ticket 2026-05-001 was rejected: mahal krudo', 'in_app', 0, '2026-05-05 06:05:16', NULL),
(67, 3, 'head_rejected', 'trip_ticket', 16, 'Trip ticket 2026-05-002 was rejected: dddddd', 'in_app', 1, '2026-05-05 06:42:10', '2026-05-05 06:42:47'),
(68, 9, 'trip_submitted', 'trip_ticket', 14, 'Trip ticket 2026-04-014 requires your approval', 'in_app', 0, '2026-05-05 07:13:12', NULL),
(69, 2, 'trip_submitted', 'trip_ticket', 22, 'Trip ticket 2026-05-008 is ready for GSO review (Created by Department Head)', 'in_app', 0, '2026-05-05 19:37:39', NULL),
(70, 2, 'trip_submitted', 'trip_ticket', 23, 'Trip ticket 2026-05-009 is ready for GSO review (Created by Department Head)', 'in_app', 0, '2026-05-05 19:48:58', NULL),
(71, 2, 'trip_submitted', 'trip_ticket', 17, 'Trip ticket 2026-05-003 is ready for GSO review', 'in_app', 0, '2026-05-06 19:42:58', NULL),
(72, 10, 'forwarded_to_mo', 'trip_ticket', 17, 'Trip ticket 2026-05-003 is ready for fund release', 'in_app', 1, '2026-05-06 19:43:43', '2026-05-07 01:31:19'),
(73, 10, 'batch_forwarded_to_mo', 'trip_ticket', 17, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-05-06 19:44:21', '2026-05-07 01:31:19'),
(74, 13, 'fund_issued', 'trip_ticket', 17, 'Funds of ₱10000 have been released for trip ticket 2026-05-003 (Charged to: Engineering Office)', 'in_app', 0, '2026-05-06 19:45:41', NULL),
(75, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱45.00\nShortage: ₱45.00', 'in_app', 1, '2026-05-06 19:47:48', '2026-05-07 01:31:19'),
(76, 10, 'budget_assistance_request', 'mo_request', 0, '🆘 BUDGET ASSISTANCE REQUEST\n\nDepartment: Engineering Office\nRemaining Budget: ₱0.00\nEstimated Cost: ₱350.00\nShortage: ₱350.00', 'in_app', 1, '2026-05-06 20:10:22', '2026-05-07 01:31:19'),
(77, 9, 'trip_submitted', 'trip_ticket', 24, 'Trip ticket 2026-05-010 requires your approval', 'in_app', 0, '2026-05-06 20:10:24', NULL),
(78, 2, 'trip_submitted', 'trip_ticket', 24, 'Trip ticket 2026-05-010 is ready for GSO review', 'in_app', 0, '2026-05-06 20:11:53', NULL),
(79, 10, 'forwarded_to_mo', 'trip_ticket', 24, 'Trip ticket 2026-05-010 is ready for fund release', 'in_app', 1, '2026-05-06 20:14:14', '2026-05-07 01:31:19'),
(80, 10, 'batch_forwarded_to_mo', 'trip_ticket', 24, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-05-06 20:14:21', '2026-05-07 01:31:19'),
(81, 13, 'fund_issued', 'trip_ticket', 24, 'Funds of ₱500 have been released for trip ticket 2026-05-010 (Charged to: Philippine National Police - Laguindingan)', 'in_app', 0, '2026-05-06 22:24:38', NULL),
(82, 5, 'mo_rejected', 'trip_ticket', 6, 'Trip ticket 2026-04-006 was rejected by Mayor\'s Office: dsadasd', 'in_app', 0, '2026-05-06 22:57:17', NULL),
(83, 3, 'mo_rejected', 'trip_ticket', 7, 'Trip ticket 2026-04-007 was rejected by Mayor\'s Office: sadasdasd', 'in_app', 0, '2026-05-06 22:57:24', NULL),
(84, 7, 'trip_submitted', 'trip_ticket', 6, 'Trip ticket 2026-04-006 requires your approval', 'in_app', 0, '2026-05-06 22:58:37', NULL),
(85, 2, 'trip_submitted', 'trip_ticket', 6, 'Trip ticket 2026-04-006 is ready for GSO review', 'in_app', 0, '2026-05-06 22:59:09', NULL),
(86, 10, 'forwarded_to_mo', 'trip_ticket', 6, 'Trip ticket 2026-04-006 is ready for fund release', 'in_app', 1, '2026-05-06 22:59:46', '2026-05-07 01:31:19'),
(87, 10, 'batch_forwarded_to_mo', 'trip_ticket', 6, '1 trip ticket(s) have been forwarded for fund release', 'in_app', 1, '2026-05-06 22:59:52', '2026-05-06 23:28:25'),
(88, 6, 'fund_issued', 'trip_ticket', 6, 'Funds of ₱300 have been released for trip ticket 2026-04-006 (Charged to: Rural Health Center)', 'in_app', 0, '2026-05-06 23:27:29', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `oic_delegation_log`
--

CREATE TABLE `oic_delegation_log` (
  `log_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `head_of_office_id` bigint UNSIGNED NOT NULL,
  `oic_user_id` bigint UNSIGNED NOT NULL,
  `reason` enum('official_meeting','official_travel','medical_leave','personal_emergency','other_official_business') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason_details` text COLLATE utf8mb4_unicode_ci,
  `estimated_return` date DEFAULT NULL,
  `delegated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `tickets_handled` smallint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oic_designation`
--

CREATE TABLE `oic_designation` (
  `designation_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `head_of_office_id` bigint UNSIGNED NOT NULL,
  `oic_user_id` bigint UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `designated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oic_designation`
--

INSERT INTO `oic_designation` (`designation_id`, `department_id`, `head_of_office_id`, `oic_user_id`, `is_active`, `designated_at`, `revoked_at`) VALUES
(1, 4, 7, 7, 0, '2026-04-16 02:51:52', '2026-04-16 03:01:44'),
(2, 2, 7, 7, 1, '2026-04-16 02:52:59', NULL),
(3, 4, 7, 7, 0, '2026-04-16 03:01:44', '2026-04-16 11:04:15'),
(4, 4, 7, 7, 0, '2026-04-16 03:03:00', '2026-04-16 11:04:15'),
(5, 4, 7, 7, 0, '2026-04-16 03:05:01', '2026-04-16 03:10:03'),
(6, 4, 7, 7, 0, '2026-04-16 03:10:03', '2026-04-16 03:19:01'),
(7, 4, 7, 7, 0, '2026-04-16 03:19:01', '2026-04-16 03:21:19'),
(8, 4, 7, 7, 0, '2026-04-16 03:21:19', '2026-04-16 03:43:44'),
(9, 3, 9, 9, 1, '2026-04-16 23:15:02', NULL),
(10, 4, 7, 7, 1, '2026-04-21 19:10:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `password_history`
--

CREATE TABLE `password_history` (
  `history_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `password_history`
--

INSERT INTO `password_history` (`history_id`, `user_id`, `password_hash`, `created_at`) VALUES
(1, 8, '$2y$12$8DNOYFy4wI/kXfObiI/sM.9e6fjKAJVerKq7Z8rwdnoeqlucyp/KO', '2026-04-16 02:37:36'),
(2, 9, '$2y$12$mfO1dz7hBp1XoaBNZP3JyeuM5J94tnv6sL8Mm02LEy60xr3lDPGKS', '2026-04-16 23:13:31'),
(3, 10, '$2y$12$vS0IgfyybghmMpfOhivx6.dd/3Mioa62ae18lDLBKlehZxoxS7A2e', '2026-04-17 01:30:06'),
(4, 4, '$2y$12$NzYRa5OY3dKKYfhETjCCH.h.TRsQvsddGmGbDa58fvvIQ36osqgZm', '2026-04-17 03:28:04'),
(6, 12, '$2y$12$gXhCKXzbTsefa7lmaNx5KeX4ffKbibr9Q6HgGw1tscL.wkQJdCTLi', '2026-04-22 18:19:07'),
(7, 12, '$2y$12$gXhCKXzbTsefa7lmaNx5KeX4ffKbibr9Q6HgGw1tscL.wkQJdCTLi', '2026-04-22 20:14:02'),
(8, 12, '$2y$12$eiKdceFJcfLTHRilCWHxq.QNdb1mKlVhHAnRddlZjM5davvrhd2AS', '2026-04-22 20:14:04'),
(9, 12, '$2y$12$YkmgCut7aHqMLALiD9ZAduKobJYocB4Zt3w1vRayZPZEMaPv1UYRm', '2026-04-22 20:14:06'),
(10, 12, '$2y$12$/KxCSeSZucnFmc10MoVph.ZMYWE/oRrziFaADiWMvqvASt.ufUH6.', '2026-04-22 20:14:08'),
(11, 12, '$2y$12$AR4P2LmVPCFbTMFdf/tdX.akIxCWOlA3J9bhw56FMfXoOzZmqV4D.', '2026-04-22 20:14:13'),
(12, 12, '$2y$12$cCBjDulh4nR9SzKHFGiXx.kubbIvcKGbb0XVFd3LVd9fwf72S.i4W', '2026-05-02 01:42:28'),
(13, 13, '$2y$12$HAUiqyDW8IAlTpGNbslWGuqlZYww1tmgmVtMDtd4jlX7EZ4KGBb3K', '2026-05-04 13:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'web', '95f6631633d598233c313efb664ce51eaf36a536ab931c363c90e75d44728cc7', '[\"*\"]', '2026-04-16 01:43:07', NULL, '2026-04-16 01:38:49', '2026-04-16 01:43:07'),
(2, 'App\\Models\\User', 3, 'web', '6747110a6c61e027da0c0ff2bd1e4bf7bfde75845f6254d250baab9a58eaf25e', '[\"*\"]', NULL, NULL, '2026-04-16 01:44:36', '2026-04-16 01:44:36'),
(3, 'App\\Models\\User', 3, 'web', '75bb9141c257c55750b1530a8d0a718af34377ea0bbc537d3998f690a51885b4', '[\"*\"]', '2026-04-16 01:49:57', NULL, '2026-04-16 01:48:34', '2026-04-16 01:49:57'),
(4, 'App\\Models\\User', 7, 'web', 'e5a5c2cce49711c99dc9a3bce5ce44b99ff73f50a1491876b4935db93e815d6a', '[\"*\"]', '2026-04-16 01:51:13', NULL, '2026-04-16 01:50:22', '2026-04-16 01:51:13'),
(5, 'App\\Models\\User', 2, 'web', 'b691fc171469b382e33b2bb1317c26ef9eef53680b0b3b134d758a12b649f6f3', '[\"*\"]', '2026-04-16 01:52:10', NULL, '2026-04-16 01:51:38', '2026-04-16 01:52:10'),
(6, 'App\\Models\\User', 1, 'web', '2503783cf84e107af1b9df72a33ed5beecbb9a2876d12a8fbd86d9c71e81c997', '[\"*\"]', NULL, NULL, '2026-04-16 02:04:31', '2026-04-16 02:04:31'),
(7, 'App\\Models\\User', 1, 'web', '53403261fdd25ad1775b1c99eb3def9a9edee1b869d8fdd5a12e88f1de7ded43', '[\"*\"]', NULL, NULL, '2026-04-16 02:05:19', '2026-04-16 02:05:19'),
(8, 'App\\Models\\User', 1, 'web', 'e71908675f233c4200868d62b82ee716c4976a904065659637d18bd0e4c0b778', '[\"*\"]', NULL, NULL, '2026-04-16 02:06:49', '2026-04-16 02:06:49'),
(9, 'App\\Models\\User', 1, 'web', 'e03531e28568d5e38588cf49f2f46be8b0385d35dc40b16c9097bca69707f8d6', '[\"*\"]', NULL, NULL, '2026-04-16 02:09:33', '2026-04-16 02:09:33'),
(10, 'App\\Models\\User', 1, 'web', 'b54016cc19a9c7399d42a1c0d0193b7ad57f68d5765c5e37820fa4cd72c27a00', '[\"*\"]', NULL, NULL, '2026-04-16 02:09:55', '2026-04-16 02:09:55'),
(11, 'App\\Models\\User', 1, 'web', '35bdbcd96983954d59ea1b0989443736f943f138a28b98f3e3e1e2c36786d4de', '[\"*\"]', NULL, NULL, '2026-04-16 02:10:22', '2026-04-16 02:10:22'),
(12, 'App\\Models\\User', 1, 'web', '782ef507cccac2bd53d0e0e54467839a92d5c90556d7c126c2774966c213336d', '[\"*\"]', NULL, NULL, '2026-04-16 02:12:15', '2026-04-16 02:12:15'),
(13, 'App\\Models\\User', 1, 'web', 'c24dd63b0e384f42009f354bee9f947d27f1049b53989d016454598beb8ad42c', '[\"*\"]', NULL, NULL, '2026-04-16 02:12:32', '2026-04-16 02:12:32'),
(16, 'App\\Models\\User', 7, 'web', '0938a0a28e154236082f6d12e10885695df69a719dc15f7bf7b9b2e3aad60046', '[\"*\"]', NULL, NULL, '2026-04-16 02:15:15', '2026-04-16 02:15:15'),
(17, 'App\\Models\\User', 7, 'web', '6d013566f5372256e2a8d480f452cf98c4b2c0fb12910bab82024e20dfeea254', '[\"*\"]', NULL, NULL, '2026-04-16 02:15:23', '2026-04-16 02:15:23'),
(18, 'App\\Models\\User', 7, 'web', '11ebda5148ebf98276799b2060afe5f5398ac968826f3980286eb6c979687ef7', '[\"*\"]', NULL, NULL, '2026-04-16 02:15:38', '2026-04-16 02:15:38'),
(20, 'App\\Models\\User', 7, 'web', '0c1396be05a8083008a386b8faa4eae754d0841f375a9783e455aec5b980e903', '[\"*\"]', NULL, NULL, '2026-04-16 02:17:01', '2026-04-16 02:17:01'),
(21, 'App\\Models\\User', 7, 'web', '2529fac64a41ad93471e7b2ac38e8cbd0a72a619e1852bf863beb5ba0bc37b54', '[\"*\"]', NULL, NULL, '2026-04-16 02:18:37', '2026-04-16 02:18:37'),
(25, 'App\\Models\\User', 1, 'web', 'b57925e7c3793e41bb084d2459c8b0b94fce907ca7fb96e88ebf0994f2330e9b', '[\"*\"]', NULL, NULL, '2026-04-16 03:13:47', '2026-04-16 03:13:47'),
(26, 'App\\Models\\User', 1, 'web', '5b1fea9ac56a0a41248d7174b94e089fedca877820301eccd43e49a1a19c5903', '[\"*\"]', '2026-04-16 03:16:39', NULL, '2026-04-16 03:14:45', '2026-04-16 03:16:39'),
(27, 'App\\Models\\User', 1, 'web', '542f26cbcdd4459f6379c8f3ff67cfb25b3207738b1b02f34f4575caf372efaa', '[\"*\"]', '2026-04-16 03:19:01', NULL, '2026-04-16 03:17:52', '2026-04-16 03:19:01'),
(30, 'App\\Models\\User', 3, 'web', '169648bb8b898a12f8effe69b5ec7e023133332ea406df9783eaf5e287cd8c78', '[\"*\"]', '2026-04-16 07:03:11', NULL, '2026-04-16 06:49:10', '2026-04-16 07:03:11'),
(32, 'App\\Models\\User', 3, 'web', '0d63045559ffe2d4457fb1e7638b4939322ed44668e43e5c3f5e7d391910bc98', '[\"*\"]', '2026-04-16 17:50:56', NULL, '2026-04-16 17:49:30', '2026-04-16 17:50:56'),
(43, 'App\\Models\\User', 2, 'web', '6382ef438de42e582a2f9db550303c7cdf4a6a85363eb22e4a6618ff14ec72c7', '[\"*\"]', '2026-04-17 00:24:23', NULL, '2026-04-16 23:50:38', '2026-04-17 00:24:23'),
(46, 'App\\Models\\User', 10, 'web', '0cfe8d6e1600e657d0bc29aff7a5a17f9c859b7d93b229c5a7fd537d3ea283e8', '[\"*\"]', NULL, NULL, '2026-04-17 01:30:27', '2026-04-17 01:30:27'),
(47, 'App\\Models\\User', 10, 'web', 'ed36e84a119d06adc7bc2933515898a61f68acf1aaecde5803f01e1e3193fbf5', '[\"*\"]', NULL, NULL, '2026-04-17 01:33:48', '2026-04-17 01:33:48'),
(48, 'App\\Models\\User', 10, 'web', '9d8d076011352729b426750a6a9b45890183021721f7c72e90d1311e236cd322', '[\"*\"]', NULL, NULL, '2026-04-17 01:34:48', '2026-04-17 01:34:48'),
(49, 'App\\Models\\User', 10, 'web', '61195cedd21a1c11e21d4a6352098ae834d497a89a57115fa01ebc5fd12e49f2', '[\"*\"]', NULL, NULL, '2026-04-17 01:35:20', '2026-04-17 01:35:20'),
(50, 'App\\Models\\User', 10, 'web', '2b858e3dc7a7b30f4447a641732e9f4cc909ba07f9c7965e76f73d89dc8b0b88', '[\"*\"]', '2026-04-17 01:48:35', NULL, '2026-04-17 01:36:01', '2026-04-17 01:48:35'),
(51, 'App\\Models\\User', 10, 'web', '330246e3859843d85760d28a0c47a726367bbcdb245ac0366c439af9a50bbb10', '[\"*\"]', '2026-04-17 01:51:55', NULL, '2026-04-17 01:50:05', '2026-04-17 01:51:55'),
(53, 'App\\Models\\User', 3, 'web', '574fe89bbb3c9ccc6f93baaf6c1ed64015656ba9f076ec5aefb20bf36a1ab153', '[\"*\"]', '2026-04-17 02:13:12', NULL, '2026-04-17 02:12:52', '2026-04-17 02:13:12'),
(55, 'App\\Models\\User', 4, 'mobile', 'e97f0cfd86ecae02a4884caa4e16e774336d5518643668734f424c5f86c2ce42', '[\"*\"]', NULL, NULL, '2026-04-17 03:42:52', '2026-04-17 03:42:52'),
(56, 'App\\Models\\User', 4, 'mobile', '2a4e0a68584f8017f071a233c4e1714f1f7d3f1dce973ea081ab06b30ca0bd0d', '[\"*\"]', '2026-04-17 03:45:26', NULL, '2026-04-17 03:45:25', '2026-04-17 03:45:26'),
(57, 'App\\Models\\User', 4, 'mobile', 'c27df212f70ce809c86a32132ab4be8aa970578a99ceef4e97e0d124ddf57b1b', '[\"*\"]', '2026-04-17 04:39:35', NULL, '2026-04-17 04:39:24', '2026-04-17 04:39:35'),
(58, 'App\\Models\\User', 4, 'mobile', 'fbddb8672a9dbf3f050422c1c3a710785661d4be9535881b5f315d8ca36c964e', '[\"*\"]', NULL, NULL, '2026-04-17 04:42:49', '2026-04-17 04:42:49'),
(59, 'App\\Models\\User', 4, 'mobile', '7a13e0f0023b252535574963ae9762d7669f658f4d3509f0321f99a1fe77e67d', '[\"*\"]', NULL, NULL, '2026-04-17 04:49:52', '2026-04-17 04:49:52'),
(60, 'App\\Models\\User', 4, 'mobile', '50c15589d9b74044fe1a9179d753f94e08ee314cef6ca64e79f30cb0a2a50aa7', '[\"*\"]', NULL, NULL, '2026-04-17 04:50:37', '2026-04-17 04:50:37'),
(61, 'App\\Models\\User', 2, 'web', 'a3c2e6065a4187d7c3ba5405847466bff810214679b6eaaba34c96aee9697220', '[\"*\"]', '2026-04-17 04:55:44', NULL, '2026-04-17 04:55:29', '2026-04-17 04:55:44'),
(62, 'App\\Models\\User', 3, 'web', '7c186860e47e603fdf4d47fa38d1d28da6cd9edd77557a2651fed422a03bcf88', '[\"*\"]', '2026-04-17 05:51:31', NULL, '2026-04-17 04:56:02', '2026-04-17 05:51:31'),
(63, 'App\\Models\\User', 4, 'mobile', 'b9e1abece69ba0579b9d0df2c8db19dcbb3bb56c70b420689b40f35f01e869fb', '[\"*\"]', '2026-04-17 04:59:03', NULL, '2026-04-17 04:58:00', '2026-04-17 04:59:03'),
(64, 'App\\Models\\User', 4, 'mobile', '8649b0e79d6d98c06d166d52325c8bad00ff76ac612e6f67176b3acb56d867cb', '[\"*\"]', '2026-04-17 05:17:30', NULL, '2026-04-17 05:02:02', '2026-04-17 05:17:30'),
(65, 'App\\Models\\User', 4, 'mobile', '4baf4451abae002dbac380d33094d01b4cb56d940067dc8765cf044a84b4e4cf', '[\"*\"]', '2026-04-17 05:42:31', NULL, '2026-04-17 05:41:42', '2026-04-17 05:42:31'),
(66, 'App\\Models\\User', 4, 'mobile', '2e480777a33ad6229bf1ba3f7017c563c7015d402cbb144dd6f085902d79e3fb', '[\"*\"]', '2026-04-17 05:46:42', NULL, '2026-04-17 05:46:32', '2026-04-17 05:46:42'),
(68, 'App\\Models\\User', 3, 'web', '32e2a5576ef39a4039bbb064460f437c7b6c4c718471f93930954b32e90d4cae', '[\"*\"]', '2026-04-18 00:28:24', NULL, '2026-04-18 00:21:41', '2026-04-18 00:28:24'),
(69, 'App\\Models\\User', 9, 'web', 'd05e038d23cc70ed234f054f0219abd15428e508a2ee071d908e1899a690705d', '[\"*\"]', '2026-04-18 00:24:34', NULL, '2026-04-18 00:23:24', '2026-04-18 00:24:34'),
(70, 'App\\Models\\User', 2, 'web', 'a241d2d8a0b4505eab4ac56e565d2826041dce9d87041e0b2f909a8e10439bac', '[\"*\"]', '2026-04-18 00:26:30', NULL, '2026-04-18 00:25:06', '2026-04-18 00:26:30'),
(71, 'App\\Models\\User', 10, 'web', '979e71280b159505ad83fafc6b91b17b58a2afeff71b04ce5b57f354d10240aa', '[\"*\"]', '2026-04-18 00:28:12', NULL, '2026-04-18 00:27:53', '2026-04-18 00:28:12'),
(72, 'App\\Models\\User', 4, 'mobile', 'd12223539d266cd01795c1b69d9291454af713ee746e7b7cc990a2d31489d512', '[\"*\"]', '2026-04-18 00:38:01', NULL, '2026-04-18 00:37:04', '2026-04-18 00:38:01'),
(73, 'App\\Models\\User', 4, 'mobile', 'b7fe91ba75dfb9ad788e21ee4797c03a0bd41c08a5665e57d30738e8c295362b', '[\"*\"]', '2026-04-28 08:03:35', NULL, '2026-04-18 17:10:54', '2026-04-28 08:03:35'),
(86, 'App\\Models\\User', 10, 'web', 'ca4dd9c60f3dc9687aa7e0b8a654277514672d406c85df747f5a6f6af0bfd1d3', '[\"*\"]', '2026-04-18 18:11:37', NULL, '2026-04-18 17:59:07', '2026-04-18 18:11:37'),
(87, 'App\\Models\\User', 10, 'web', 'bcc26e6a209460ede0ebdec510fe8c5365bc771f2d623b5892a68e14c7261f84', '[\"*\"]', '2026-04-19 02:39:32', NULL, '2026-04-19 02:16:13', '2026-04-19 02:39:32'),
(96, 'App\\Models\\User', 1, 'web', '84950b8514f5fa051606d4fc8fa11e7c3f4332ab0a2f1f9c6768a5b7eda509f9', '[\"*\"]', '2026-04-21 04:10:30', NULL, '2026-04-21 04:06:26', '2026-04-21 04:10:30'),
(98, 'App\\Models\\User', 2, 'web', 'fa072bdd49f4d17ccc4ed511bb23248e68fb1b27f15b687828a37a72f1af9860', '[\"*\"]', '2026-04-21 05:29:20', NULL, '2026-04-21 04:47:35', '2026-04-21 05:29:20'),
(104, 'App\\Models\\User', 7, 'web', '04fa8d4441457b2ad7e2b8e60dc24620c2343624a5d330ba27c3687ff66bd79f', '[\"*\"]', '2026-04-21 19:12:43', NULL, '2026-04-21 19:11:47', '2026-04-21 19:12:43'),
(105, 'App\\Models\\User', 2, 'web', '657807669d2bf37ce1f8a0121ec085f38d8373ef82b64a2fc6d6e2d18606e651', '[\"*\"]', '2026-04-22 01:32:57', NULL, '2026-04-22 01:12:23', '2026-04-22 01:32:57'),
(119, 'App\\Models\\User', 10, 'web', '9fdbaec84299a1716c3256f3631f0ea8bdd5b4330b5dd14cb128f8a6d5281690', '[\"*\"]', '2026-04-24 22:17:48', NULL, '2026-04-24 22:15:14', '2026-04-24 22:17:48'),
(138, 'App\\Models\\User', 10, 'web', 'ba5ad0d3c7c888982b44f5cf4f0dc9bfa469898ae2299a3f7fa8410caa08e82c', '[\"*\"]', '2026-04-26 02:17:49', NULL, '2026-04-25 01:15:55', '2026-04-26 02:17:49'),
(146, 'App\\Models\\User', 3, 'web', 'cf3e9fd27d95f4800a067a56a45326fe92097b973269b29c726d39879abbc7c3', '[\"*\"]', '2026-04-27 23:00:32', NULL, '2026-04-27 06:41:58', '2026-04-27 23:00:32'),
(150, 'App\\Models\\User', 1, 'web', '3027a438e64563e94527cafb6c78ca331b7eb2f1a52d9fdc05d52a432c577b0f', '[\"*\"]', '2026-04-27 23:18:26', NULL, '2026-04-27 23:10:59', '2026-04-27 23:18:26'),
(161, 'App\\Models\\User', 10, 'web', '27b015ebf674613a2e5be30d50844862c7516a3b81d89ac3459280ef9b41ec74', '[\"*\"]', '2026-04-28 09:45:29', NULL, '2026-04-28 00:20:59', '2026-04-28 09:45:29'),
(162, 'App\\Models\\User', 4, 'mobile', '45463a68ec9f892238d926dbb8ab52124010c683e33aad08832d6092143bbe56', '[\"*\"]', '2026-04-28 08:08:42', NULL, '2026-04-28 08:08:41', '2026-04-28 08:08:42'),
(163, 'App\\Models\\User', 4, 'mobile', 'e4130c49de049f46ee96e4edb7fe043a855fd5d62f7cab7ae81eddcc5fffadde', '[\"*\"]', '2026-04-28 08:24:01', NULL, '2026-04-28 08:12:06', '2026-04-28 08:24:01'),
(164, 'App\\Models\\User', 4, 'mobile', '3db587936210730450ec8dd7bb4838b414f7ca333a5ecafd928e327554f5bfb5', '[\"*\"]', '2026-04-28 08:42:43', NULL, '2026-04-28 08:28:30', '2026-04-28 08:42:43'),
(165, 'App\\Models\\User', 4, 'mobile', '36448a41d0adee8a7913eacdbcc76610c307c9b4424845b00e20fc12a66b19df', '[\"*\"]', '2026-04-28 09:01:22', NULL, '2026-04-28 08:44:57', '2026-04-28 09:01:22'),
(166, 'App\\Models\\User', 4, 'mobile', '1677f2f2ad364b2b4752b70eb3cccfc0e8880197152532ebc01b0b9254e885fc', '[\"*\"]', '2026-04-28 09:30:45', NULL, '2026-04-28 09:04:17', '2026-04-28 09:30:45'),
(167, 'App\\Models\\User', 4, 'mobile', '467a462e0494ba464454a3ef1e76c29bdd38cf3e67b079dab0466e3fd350513d', '[\"*\"]', '2026-05-03 01:25:18', NULL, '2026-04-28 09:32:46', '2026-05-03 01:25:18'),
(180, 'App\\Models\\User', 3, 'web', '3b2b7e11c944d56613d32338bde72bc949694869130a59764d8d4e442221db64', '[\"*\"]', '2026-04-30 21:37:44', NULL, '2026-04-30 21:22:08', '2026-04-30 21:37:44'),
(188, 'App\\Models\\User', 4, 'mobile', '06d4ba64ec833376bc6469d696921496ed3c96e872c49cd1423188d093b9626e', '[\"*\"]', '2026-05-07 23:37:22', NULL, '2026-05-01 18:44:28', '2026-05-07 23:37:22'),
(197, 'App\\Models\\User', 4, 'mobile', 'ce8fdc22831c4d92ab0a31f37baa3c938d756d65c2e9246be052df7216320a8f', '[\"*\"]', '2026-05-03 01:29:12', NULL, '2026-05-03 01:28:49', '2026-05-03 01:29:12'),
(198, 'App\\Models\\User', 4, 'mobile', '264deee70e832664bd77c60b4c6b784d6bcd7e22a9a3167d8cae9a1c6a8f71ea', '[\"*\"]', '2026-05-03 02:47:03', NULL, '2026-05-03 01:32:54', '2026-05-03 02:47:03'),
(206, 'App\\Models\\User', 3, 'web', 'ca913e69590e5b74c90303298be002434c0a65f350249107a069a9790cb329b4', '[\"*\"]', '2026-05-04 20:39:58', NULL, '2026-05-04 20:39:20', '2026-05-04 20:39:58'),
(210, 'App\\Models\\User', 3, 'web', '9825f7d4b1170a2e7123e0d23b6fa52ef09c5f5d60456ef5d3ee343bf7f355ea', '[\"*\"]', '2026-05-05 07:15:22', NULL, '2026-05-05 06:42:34', '2026-05-05 07:15:22'),
(237, 'App\\Models\\User', 6, 'mobile', '7c171c3fda7a6df41d835d2915fcb9773249ad7ee1466f3edb1062363c5f3b64', '[\"*\"]', '2026-05-07 23:40:33', NULL, '2026-05-07 23:40:30', '2026-05-07 23:40:33'),
(238, 'App\\Models\\User', 4, 'mobile', '587f8f11f15b75cbd8a9d063632f11c7b14854f42f2dc11c725797439abbd91d', '[\"*\"]', '2026-05-07 23:43:33', NULL, '2026-05-07 23:41:34', '2026-05-07 23:43:33'),
(239, 'App\\Models\\User', 4, 'mobile', '5dfa9099236cedc76db6dab7ec42313094af3f17385332845147b2a063d45114', '[\"*\"]', '2026-05-07 23:56:30', NULL, '2026-05-07 23:53:18', '2026-05-07 23:56:30'),
(240, 'App\\Models\\User', 4, 'mobile', '26daa443b2b15d50c7f5f6b0186904d75d786b4198de1802bcf9c2b5aad1cdec', '[\"*\"]', '2026-05-08 01:03:49', NULL, '2026-05-08 00:06:26', '2026-05-08 01:03:49'),
(249, 'App\\Models\\User', 10, 'web', 'a5111528a67d8641c46d77be9dd80fce11711bfa0f27fc19daa8f95b4004f852', '[\"*\"]', '2026-05-08 07:01:08', NULL, '2026-05-08 06:11:31', '2026-05-08 07:01:08');

-- --------------------------------------------------------

--
-- Table structure for table `system_setting`
--

CREATE TABLE `system_setting` (
  `setting_id` bigint UNSIGNED NOT NULL,
  `setting_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_setting`
--

INSERT INTO `system_setting` (`setting_id`, `setting_key`, `setting_value`, `updated_by`, `updated_at`) VALUES
(1, 'mayor_name', 'Roy Macua', 1, NULL),
(2, 'contracted_station_name', '', 1, NULL),
(3, 'gps_ping_interval_seconds', '30', 1, NULL),
(4, 'gps_accuracy_threshold_meters', '50', 1, NULL),
(5, 'gps_distance_odometer_tolerance_pct', '20', 1, NULL),
(6, 'minimum_gps_pings_threshold', '5', 1, NULL),
(7, 'budget_week_start_day', '0', 1, NULL),
(8, 'mayor_office_phone', '', 1, NULL),
(9, 'mayor_office_email', '', 1, NULL),
(10, 'system_name', 'FCMS', 1, NULL),
(11, 'system_timezone', 'Asia/Manila', 1, NULL),
(12, 'date_format', 'Y-m-d', 1, NULL),
(13, 'gso_head_name', '', 1, NULL),
(14, 'gso_office_phone', '', 1, NULL),
(15, 'gso_office_email', '', 1, NULL),
(16, 'max_trip_duration_hours', '24', 1, NULL),
(17, 'max_idle_minutes', '30', 1, NULL),
(18, 'contracted_station_address', '', 1, NULL),
(19, 'contracted_station_contact', '', 1, NULL),
(20, 'alternate_station_name', '', 1, NULL),
(21, 'diesel_price_per_liter', '87.4', 1, NULL),
(22, 'premium_price_per_liter', '85.7', 1, NULL),
(23, 'regular_price_per_liter', '85.6', 1, NULL),
(24, 'email_notifications_enabled', '1', 1, NULL),
(25, 'push_notifications_enabled', '1', 1, NULL),
(26, 'notification_retention_days', '30', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `trip_ticket`
--

CREATE TABLE `trip_ticket` (
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `driver_id` bigint UNSIGNED NOT NULL,
  `vehicle_id` bigint UNSIGNED NOT NULL,
  `submitted_by` bigint UNSIGNED NOT NULL,
  `created_by_mo_user_id` bigint UNSIGNED DEFAULT NULL,
  `submitted_by_head` tinyint(1) NOT NULL DEFAULT '0',
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `trip_date` date NOT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `charge_to` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passenger_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `has_insufficient_budget` tinyint(1) DEFAULT '0',
  `budget_shortage` decimal(12,2) DEFAULT '0.00',
  `original_department_id` int DEFAULT NULL,
  `charge_to_department_id` bigint UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `estimated_distance_km` decimal(10,2) DEFAULT NULL,
  `estimated_fuel_liters` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trip_ticket`
--

INSERT INTO `trip_ticket` (`trip_ticket_id`, `trip_ticket_number`, `department_id`, `driver_id`, `vehicle_id`, `submitted_by`, `created_by_mo_user_id`, `submitted_by_head`, `submitted_at`, `trip_date`, `purpose`, `destination`, `charge_to`, `passenger_name`, `status`, `has_insufficient_budget`, `budget_shortage`, `original_department_id`, `charge_to_department_id`, `updated_at`, `estimated_distance_km`, `estimated_fuel_liters`) VALUES
(1, '2026-04-001', 3, 1, 4, 3, NULL, 0, '2026-04-16 07:01:50', '2026-04-16', 'a', 'Alubijid', 'a', NULL, 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(2, '2026-04-002', 3, 1, 4, 3, NULL, 0, '2026-04-18 00:22:28', '2026-04-18', 'asdasd', 'Alubijid', 'asdasd', 'sdfsdfsdf', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(3, '2026-04-003', 3, 1, 1, 3, NULL, 0, '2026-04-18 17:37:58', '2026-04-19', 'asdasd', 'sda', 'sadsad', 'sadsad', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(4, '2026-04-004', 3, 1, 4, 3, NULL, 0, '2026-04-18 17:57:24', '2026-04-19', 'asdasd', 'dasd', 'asdsad', 'asdasd', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(5, '2026-04-005', 3, 1, 1, 3, NULL, 0, '2026-04-20 07:37:27', '2026-04-20', 'd', 'Alubijid', 'd', 'd', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(6, '2026-04-006', 4, 2, 2, 5, NULL, 0, '2026-04-21 19:09:14', '2026-05-07', 'd', 'Cagayan de Oro', 'Rural Health Center', 'asdasd', 'funds_issued', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(7, '2026-04-007', 3, 1, 4, 3, NULL, 0, '2026-04-24 23:26:44', '2026-04-25', 'd', 'dasd', 'asdd', 'asdsd', 'returned_for_revision', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(8, '2026-04-008', 3, 1, 1, 3, NULL, 0, '2026-04-24 23:27:43', '2026-04-25', 'asdsad', 'dsad', 'adasd', 'asdsad', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(9, '2026-04-009', 3, 1, 1, 10, 10, 1, '2026-04-24 23:57:37', '2026-04-25', 'a', 'Alubijid', 'a', NULL, 'funds_issued', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(10, '2026-04-010', 3, 1, 4, 10, 10, 1, '2026-04-25 01:17:09', '2026-04-25', 's', 'Alubijid', 'd', NULL, 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(11, '2026-04-011', 3, 1, 1, 10, 10, 1, '2026-04-26 02:19:30', '2026-04-26', 'dsad', 'aaaa', 'asdsad', 'sadsad', 'pending_reconciliation', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(12, '2026-04-012', 3, 1, 1, 10, 10, 1, '2026-04-26 02:26:28', '2026-04-26', 'd', 'Alubijid', 'ddd', 'asdasd', 'acknowledged', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(13, '2026-04-013', 3, 1, 1, 3, NULL, 0, '2026-04-28 00:14:14', '2026-04-28', 'a', 'sadasd', 'Engineering Office', NULL, 'returned_for_revision', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(14, '2026-04-014', 3, 1, 4, 3, NULL, 0, '2026-04-28 00:18:13', '2026-05-05', 'dsadsd', 'Alubijid', 'Engineering Office', 'ddd', 'pending_head_approval', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(15, '2026-05-001', 3, 4, 4, 3, NULL, 0, '2026-05-04 15:20:24', '2026-05-05', 'meeting', 'cdo', 'Engineering Office', 'cdo', 'returned_for_revision', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(16, '2026-05-002', 3, 4, 4, 3, NULL, 0, '2026-05-04 20:01:01', '2026-05-05', 'd', 'Alubijid', 'Engineering Office', 'd', 'returned_for_revision', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(17, '2026-05-003', 3, 4, 1, 3, NULL, 0, '2026-05-04 20:47:02', '2026-05-05', 'd', 'Alubijid', 'Engineering Office', 's', 'funds_issued', 0, '0.00', NULL, NULL, NULL, NULL, NULL),
(18, '2026-05-004', 3, 1, 1, 3, NULL, 0, '2026-05-05 05:14:27', '2026-05-05', 'd', 'Alubijid', 'Engineering Office', NULL, 'pending_head_approval', 0, '0.00', NULL, NULL, NULL, '20.00', '2.20'),
(19, '2026-05-005', 3, 4, 1, 3, NULL, 0, '2026-05-05 05:19:51', '2026-05-05', 'd', 'Alubijid', 'Engineering Office', 'asdasd', 'pending_head_approval', 0, '0.00', NULL, NULL, NULL, '20.00', '2.20'),
(20, '2026-05-006', 3, 4, 1, 3, NULL, 0, '2026-05-05 05:28:45', '2026-05-05', 'D', 'Alubijid', 'Engineering Office', NULL, 'pending_head_approval', 0, '0.00', NULL, NULL, NULL, '20.00', '2.20'),
(21, '2026-05-007', 3, 4, 1, 3, NULL, 0, '2026-05-05 05:42:44', '2026-05-05', 'd', 'Alubijid', 'Engineering Office', NULL, 'pending_head_approval', 0, '0.00', NULL, NULL, NULL, '7.40', '0.80'),
(22, '2026-05-008', 3, 1, 1, 9, NULL, 1, '2026-05-05 19:37:39', '2026-05-06', 'D', 'Alubijid', 'Engineering Office', NULL, 'pending_gso_review', 0, '0.00', NULL, NULL, NULL, '7.40', '0.80'),
(23, '2026-05-009', 3, 1, 1, 9, NULL, 1, '2026-05-05 19:48:58', '2026-05-06', 'test', 'Alubijid', 'Engineering Office', NULL, 'pending_gso_review', 0, '0.00', NULL, NULL, NULL, '7.40', '0.80'),
(24, '2026-05-010', 3, 4, 4, 3, NULL, 0, '2026-05-06 20:10:24', '2026-05-07', 'Byqahe', 'Cagayan de Oro', 'Engineering Office', NULL, 'funds_issued', 0, '5000.00', NULL, 5, NULL, '58.00', '7.00');

--
-- Triggers `trip_ticket`
--
DELIMITER $$
CREATE TRIGGER `before_insert_check_trip_date` BEFORE INSERT ON `trip_ticket` FOR EACH ROW BEGIN
    IF NEW.trip_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'trip_date cannot be in the future';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_update_check_trip_date` BEFORE UPDATE ON `trip_ticket` FOR EACH ROW BEGIN
    IF NEW.trip_date > CURDATE() THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'trip_date cannot be in the future';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `trip_ticket_cancellation`
--

CREATE TABLE `trip_ticket_cancellation` (
  `cancellation_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `cancelled_by` bigint UNSIGNED NOT NULL,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fund_return_required` tinyint(1) NOT NULL DEFAULT '0',
  `fund_returned_at` timestamp NULL DEFAULT NULL,
  `fund_returned_by` bigint UNSIGNED DEFAULT NULL,
  `cancelled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_ticket_esignature`
--

CREATE TABLE `trip_ticket_esignature` (
  `esig_record_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `head_approval_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `esig_id` bigint UNSIGNED NOT NULL,
  `signature_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `signed_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_cycle` tinyint NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trip_ticket_return`
--

CREATE TABLE `trip_ticket_return` (
  `return_id` bigint UNSIGNED NOT NULL,
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `return_type` enum('rejected_by_head','rejected_by_gso','rejected_by_mo','returned_by_mo','resubmitted_to_head','resubmitted_to_gso','resubmitted_by_dept_office') COLLATE utf8mb4_unicode_ci NOT NULL,
  `return_note` text COLLATE utf8mb4_unicode_ci,
  `fields_changed` json DEFAULT NULL,
  `actioned_by` bigint UNSIGNED NOT NULL,
  `actioned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trip_ticket_return`
--

INSERT INTO `trip_ticket_return` (`return_id`, `trip_ticket_id`, `return_type`, `return_note`, `fields_changed`, `actioned_by`, `actioned_at`) VALUES
(1, 13, 'rejected_by_head', 'dsadasd', NULL, 9, '2026-05-05 06:03:09'),
(2, 14, 'rejected_by_head', 'ddsadsad', NULL, 9, '2026-05-05 06:05:03'),
(3, 15, 'rejected_by_head', 'mahal krudo', NULL, 9, '2026-05-05 06:05:16'),
(4, 16, 'rejected_by_head', 'dddddd', NULL, 9, '2026-05-05 06:42:10'),
(5, 14, 'resubmitted_to_head', NULL, '\"{\\\"vehicle_id\\\":4,\\\"trip_date\\\":\\\"2026-05-05 00:00:00\\\",\\\"purpose\\\":\\\"dsadsd\\\",\\\"passenger_name\\\":\\\"ddd\\\"}\"', 3, '2026-05-05 07:13:12'),
(6, 6, 'resubmitted_to_head', NULL, '\"{\\\"trip_date\\\":\\\"2026-05-07 00:00:00\\\",\\\"purpose\\\":\\\"d\\\",\\\"destination\\\":\\\"Cagayan de Oro\\\",\\\"charge_to\\\":\\\"Rural Health Center\\\",\\\"passenger_name\\\":\\\"asdasd\\\"}\"', 5, '2026-05-06 22:58:37');

-- --------------------------------------------------------

--
-- Table structure for table `trip_ticket_vehicle_snapshot`
--

CREATE TABLE `trip_ticket_vehicle_snapshot` (
  `trip_ticket_id` bigint UNSIGNED NOT NULL,
  `vehicle_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL,
  `odometer_status` enum('functional','non_functional') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fuel_type` enum('regular','premium','diesel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshot_taken_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `trip_ticket_vehicle_snapshot`
--

INSERT INTO `trip_ticket_vehicle_snapshot` (`trip_ticket_id`, `vehicle_status`, `odometer_status`, `fuel_type`, `snapshot_taken_at`) VALUES
(1, 'active', 'functional', 'diesel', '2026-04-16 07:01:50'),
(2, 'active', 'functional', 'diesel', '2026-04-18 00:22:28'),
(3, 'active', 'non_functional', 'regular', '2026-04-18 17:37:58'),
(4, 'active', 'functional', 'diesel', '2026-04-18 17:57:24'),
(5, 'active', 'non_functional', 'regular', '2026-04-20 07:37:27'),
(6, 'active', 'functional', 'regular', '2026-04-21 19:09:14'),
(7, 'active', 'functional', 'diesel', '2026-04-24 23:26:44'),
(8, 'active', 'non_functional', 'regular', '2026-04-24 23:27:43'),
(9, 'active', 'non_functional', 'regular', '2026-04-24 23:57:37'),
(10, 'active', 'functional', 'diesel', '2026-04-25 01:17:09'),
(11, 'active', 'non_functional', 'regular', '2026-04-26 02:19:30'),
(12, 'active', 'non_functional', 'regular', '2026-04-26 02:26:28'),
(13, 'active', 'non_functional', 'regular', '2026-04-28 00:14:14'),
(14, 'active', 'non_functional', 'regular', '2026-04-28 00:18:13'),
(15, 'active', 'functional', 'diesel', '2026-05-04 15:20:24'),
(16, 'active', 'functional', 'diesel', '2026-05-04 20:01:01'),
(17, 'active', 'non_functional', 'regular', '2026-05-04 20:47:02'),
(18, 'active', 'non_functional', 'regular', '2026-05-05 05:14:27'),
(19, 'active', 'non_functional', 'regular', '2026-05-05 05:19:51'),
(20, 'active', 'non_functional', 'regular', '2026-05-05 05:28:45'),
(21, 'active', 'non_functional', 'regular', '2026-05-05 05:42:44'),
(22, 'active', 'non_functional', 'regular', '2026-05-05 19:37:39'),
(23, 'active', 'non_functional', 'regular', '2026-05-05 19:48:58'),
(24, 'active', 'functional', 'diesel', '2026-05-06 20:10:24');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `head_active_status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `deactivated_by` bigint UNSIGNED DEFAULT NULL,
  `deactivation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` tinyint NOT NULL DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `password_expires_at` timestamp NULL DEFAULT NULL,
  `account_locked_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `department_id`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `role`, `head_active_status`, `status`, `created_at`, `updated_at`, `last_login_at`, `deactivated_at`, `deactivated_by`, `deactivation_reason`, `password_changed_at`, `failed_login_attempts`, `locked_until`, `password_expires_at`, `account_locked_until`) VALUES
(1, 1, 'Super', NULL, 'Admin', 'superadmin@fcms.com', '$2y$12$BMh20sr735fBsLFc9P90/eBPBrUI0BERA6XTlyeoIn9Hnl5hRCAXC', 'superadmin', NULL, 'active', '2026-04-16 01:59:41', '2026-05-08 03:22:05', '2026-05-08 03:22:05', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(2, 5, 'GSO', NULL, 'Staff', 'gso@fcms.com', '$2y$12$p2SjHglQqIvAXJNWiJCQPO6uROUHuTqbeD46DKgJ.B23ieb6OWJAa', 'gso_staff', NULL, 'active', '2026-04-16 01:59:41', '2026-05-08 05:16:55', '2026-05-08 05:16:55', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(3, 3, 'Ian', NULL, 'Ubuab', 'iubaub6@gmail.com', '$2y$12$I0Ou.QFlgFPLPF5tC9EhyezVGoWIxV8pplsyq2QC3FGErJug1HDhO', 'dept_office', NULL, 'active', '2026-04-16 01:59:41', '2026-05-08 06:10:53', '2026-05-08 06:10:53', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(4, 3, 'Nilo', NULL, 'abo', 'driver1@mail.com', '$2y$12$KpgVXOBtngHJ07eyX4.Kk.XGOfDS1ODEJ5b1tOxXf1EMUGmbqLKuu', 'driver', NULL, 'active', '2026-04-16 01:59:41', '2026-05-08 00:06:26', '2026-05-08 00:06:26', NULL, NULL, NULL, '2026-04-17 03:28:04', 0, NULL, NULL, NULL),
(5, 4, 'RHU', NULL, 'Staff', 'rhu@mail.com', '$2y$12$y6bGjw3/9pCvB1ttVipAROMQrbyTIYhV1w1sBMUd4aQ5mK61ZbR86', 'dept_office', NULL, 'active', '2026-04-16 01:59:41', '2026-05-06 22:57:40', '2026-05-06 22:57:40', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(6, 4, 'RHU', NULL, 'Driver', 'rhudriver@mail.com', '$2y$12$aaL6aB1uQJQ9Spw4iEuoWe9SUvStKKymo98OC3pkwyDMgQ0zZnrzC', 'driver', NULL, 'active', '2026-04-16 01:59:41', '2026-05-07 23:40:30', '2026-05-07 23:40:30', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(7, 4, 'RHU', NULL, 'Head', 'rhuhead@mail.com', '$2y$12$aV5tZheFVicbPqjmYo/7vumL2gv.JC/ROt6ehGDpw8bp4oQWRDSGK', 'head_of_office', 'active', 'active', '2026-04-16 01:59:41', '2026-05-06 22:58:55', '2026-05-06 22:58:55', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(8, 5, 'test', NULL, 'teasd', 'test3@mail.com', '$2y$12$8DNOYFy4wI/kXfObiI/sM.9e6fjKAJVerKq7Z8rwdnoeqlucyp/KO', 'dept_office', NULL, 'active', '2026-04-16 02:37:36', '2026-04-16 02:37:36', NULL, NULL, NULL, NULL, '2026-04-16 02:37:36', 0, NULL, NULL, NULL),
(9, 3, 'eng', 'd', 'Head', 'enghead@mail.com', '$2y$12$mfO1dz7hBp1XoaBNZP3JyeuM5J94tnv6sL8Mm02LEy60xr3lDPGKS', 'head_of_office', 'active', 'active', '2026-04-16 23:13:31', '2026-05-08 04:53:40', '2026-05-08 04:53:40', NULL, NULL, NULL, '2026-04-16 23:13:31', 0, NULL, NULL, NULL),
(10, 1, 'Mo', NULL, 'Staff', 'mostaff@mail.com', '$2y$12$vS0IgfyybghmMpfOhivx6.dd/3Mioa62ae18lDLBKlehZxoxS7A2e', 'mayors_office', NULL, 'active', '2026-04-17 01:30:06', '2026-05-08 06:11:31', '2026-05-08 06:11:31', NULL, NULL, NULL, '2026-04-17 01:30:06', 0, NULL, NULL, NULL),
(12, 5, 'Angelo', NULL, 'Cairel', 'angelocairel@gmail.com', '$2y$12$QVy.jIp3p63CSR5wt5/cLu7YzbDVJdLZimjEvR2iNrqlI7UbfcPn.', 'driver', NULL, 'active', '2026-04-22 18:19:07', '2026-05-06 18:10:19', '2026-04-22 18:19:53', NULL, NULL, NULL, '2026-05-02 01:42:28', 0, NULL, NULL, NULL),
(13, 3, 'angkol', NULL, 'wali', 'engdriver@mail.com', '$2y$12$HAUiqyDW8IAlTpGNbslWGuqlZYww1tmgmVtMDtd4jlX7EZ4KGBb3K', 'driver', NULL, 'active', '2026-05-04 13:10:12', '2026-05-04 13:10:12', NULL, NULL, NULL, NULL, '2026-05-04 13:10:12', 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_esignature`
--

CREATE TABLE `user_esignature` (
  `esig_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `signature_image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `enrolled_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `superseded_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_esignature`
--

INSERT INTO `user_esignature` (`esig_id`, `user_id`, `signature_image`, `signature_hash`, `is_active`, `enrolled_at`, `enrolled_ip`, `superseded_at`) VALUES
(1, 9, 'signatures/signature_9_1776774821.png', '5a6133a19ca8a0f77b5ee0049c34ae8c2f818136758b54cd49485b30e8a14154', 0, '2026-04-21 04:33:42', '127.0.0.1', '2026-04-22 20:02:17'),
(2, 7, 'signatures/signature_7_1776827239.png', '5a6133a19ca8a0f77b5ee0049c34ae8c2f818136758b54cd49485b30e8a14154', 1, '2026-04-21 19:07:19', '127.0.0.1', NULL),
(3, 9, 'signatures/signature_9_1776916937.png', '5a6133a19ca8a0f77b5ee0049c34ae8c2f818136758b54cd49485b30e8a14154', 1, '2026-04-22 20:02:17', '127.0.0.1', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `vehicle_id` bigint UNSIGNED NOT NULL,
  `department_id` bigint UNSIGNED NOT NULL,
  `vehicle_model` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plate_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fuel_type` enum('regular','premium','diesel') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `odometer_status` enum('functional','non_functional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'functional',
  `maintenance_flag` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `deactivated_by` bigint UNSIGNED DEFAULT NULL,
  `deactivation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`vehicle_id`, `department_id`, `vehicle_model`, `plate_number`, `fuel_type`, `status`, `odometer_status`, `maintenance_flag`, `created_at`, `updated_at`, `deactivated_at`, `deactivated_by`, `deactivation_reason`, `deleted_at`, `deleted_by`) VALUES
(1, 3, 'Donsal Coaster', 'HIJ-2565', 'regular', 'active', 'non_functional', 1, '2026-04-16 01:59:41', '2026-05-06 18:26:07', NULL, NULL, NULL, NULL, NULL),
(2, 4, 'Ambulance', 'SJA-2805', 'diesel', 'active', 'functional', 0, '2026-04-16 01:59:41', '2026-04-30 22:18:35', NULL, NULL, NULL, NULL, NULL),
(3, 5, 'Patrol Car', 'AED-2562', 'diesel', 'active', 'functional', 0, '2026-04-16 01:59:41', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 3, 'Ford Raptor', 'PSA-3123', 'diesel', 'active', 'functional', 0, '2026-04-16 06:30:01', '2026-04-16 06:30:01', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_odometer_status`
--

CREATE TABLE `vehicle_odometer_status` (
  `status_id` bigint UNSIGNED NOT NULL,
  `vehicle_id` bigint UNSIGNED NOT NULL,
  `status` enum('functional','non_functional') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_by` bigint UNSIGNED NOT NULL,
  `reported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_active_trips_gps`
-- (See below for the actual view)
--
CREATE TABLE `v_active_trips_gps` (
`trip_ticket_id` bigint unsigned
,`trip_ticket_number` varchar(20)
,`department_id` bigint unsigned
,`department_name` varchar(150)
,`driver_id` bigint unsigned
,`driver_name` varchar(102)
,`vehicle_id` bigint unsigned
,`vehicle_model` varchar(120)
,`plate_number` varchar(20)
,`destination` varchar(255)
,`purpose` text
,`gps_tracking_started_at` timestamp
,`trip_elapsed_minutes` int unsigned
,`last_latitude` decimal(10,7)
,`last_longitude` decimal(10,7)
,`last_speed_kmh` decimal(6,2)
,`last_ping_at` timestamp
,`has_mock_location_flag` tinyint(1)
,`gps_total_km` decimal(8,2)
,`minutes_since_last_ping` bigint
,`is_gps_stale` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_remaining_budget`
-- (See below for the actual view)
--
CREATE TABLE `v_remaining_budget` (
`period_id` bigint unsigned
,`department_id` bigint unsigned
,`department_name` varchar(150)
,`department_code` varchar(20)
,`week_start` date
,`week_end` date
,`allocated_amount` decimal(12,2)
,`total_spent_amount` decimal(34,2)
,`remaining_amount` decimal(35,2)
,`utilization_percentage` decimal(40,2)
,`is_over_budget` int
,`is_critical_low_warning` int
,`is_low_warning` int
,`status` enum('active','closed')
,`created_at` timestamp
,`closed_at` timestamp
,`days_remaining_in_period` int
,`avg_daily_spend` decimal(35,2)
,`projected_week_total` decimal(36,2)
);

-- --------------------------------------------------------

--
-- Structure for view `v_active_trips_gps`
--
DROP TABLE IF EXISTS `v_active_trips_gps`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY INVOKER VIEW `v_active_trips_gps`  AS SELECT `tt`.`trip_ticket_id` AS `trip_ticket_id`, `tt`.`trip_ticket_number` AS `trip_ticket_number`, `tt`.`department_id` AS `department_id`, `d`.`department_name` AS `department_name`, `tt`.`driver_id` AS `driver_id`, concat(`u`.`last_name`,', ',`u`.`first_name`) AS `driver_name`, `tt`.`vehicle_id` AS `vehicle_id`, `v`.`vehicle_model` AS `vehicle_model`, `v`.`plate_number` AS `plate_number`, `tt`.`destination` AS `destination`, `tt`.`purpose` AS `purpose`, `fl`.`gps_tracking_started_at` AS `gps_tracking_started_at`, `fl`.`trip_elapsed_minutes` AS `trip_elapsed_minutes`, `gp`.`latitude` AS `last_latitude`, `gp`.`longitude` AS `last_longitude`, `gp`.`speed_kmh` AS `last_speed_kmh`, `gp`.`received_at` AS `last_ping_at`, `gp`.`has_mock_location_flag` AS `has_mock_location_flag`, `gdr`.`gps_total_km` AS `gps_total_km`, timestampdiff(MINUTE,`gp`.`received_at`,now()) AS `minutes_since_last_ping`, (case when (timestampdiff(MINUTE,`gp`.`received_at`,now()) > 5) then 1 else 0 end) AS `is_gps_stale` FROM ((((((((`trip_ticket` `tt` join `departments` `d` on((`tt`.`department_id` = `d`.`department_id`))) join `drivers` `dr` on((`tt`.`driver_id` = `dr`.`driver_id`))) join `users` `u` on((`dr`.`user_id` = `u`.`user_id`))) join `vehicles` `v` on((`tt`.`vehicle_id` = `v`.`vehicle_id`))) left join `gas_slip` `gs` on((`gs`.`trip_ticket_id` = `tt`.`trip_ticket_id`))) left join `fuel_log` `fl` on((`fl`.`gas_slip_id` = `gs`.`gas_slip_id`))) left join (select distinct `gp1`.`trip_ticket_id` AS `trip_ticket_id`,`gp1`.`latitude` AS `latitude`,`gp1`.`longitude` AS `longitude`,`gp1`.`speed_kmh` AS `speed_kmh`,`gp1`.`received_at` AS `received_at`,`gp1`.`has_mock_location_flag` AS `has_mock_location_flag` from `gps_ping` `gp1` where (`gp1`.`received_at` = (select max(`gp2`.`received_at`) from `gps_ping` `gp2` where (`gp2`.`trip_ticket_id` = `gp1`.`trip_ticket_id`)))) `gp` on((`tt`.`trip_ticket_id` = `gp`.`trip_ticket_id`))) left join `gps_distance_result` `gdr` on((`tt`.`trip_ticket_id` = `gdr`.`trip_ticket_id`))) WHERE (`tt`.`status` = 'in_transit')  ;

-- --------------------------------------------------------

--
-- Structure for view `v_remaining_budget`
--
DROP TABLE IF EXISTS `v_remaining_budget`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY INVOKER VIEW `v_remaining_budget`  AS SELECT `p`.`period_id` AS `period_id`, `p`.`department_id` AS `department_id`, `d`.`department_name` AS `department_name`, `d`.`department_code` AS `department_code`, `p`.`week_start` AS `week_start`, `p`.`week_end` AS `week_end`, `p`.`allocated_amount` AS `allocated_amount`, coalesce(sum(`fi`.`amount_released`),0) AS `total_spent_amount`, (`p`.`allocated_amount` - coalesce(sum(`fi`.`amount_released`),0)) AS `remaining_amount`, round(((coalesce(sum(`fi`.`amount_released`),0) / nullif(`p`.`allocated_amount`,0)) * 100),2) AS `utilization_percentage`, (case when (coalesce(sum(`fi`.`amount_released`),0) > `p`.`allocated_amount`) then 1 else 0 end) AS `is_over_budget`, (case when ((((`p`.`allocated_amount` - coalesce(sum(`fi`.`amount_released`),0)) / nullif(`p`.`allocated_amount`,0)) * 100) < 10) then 1 else 0 end) AS `is_critical_low_warning`, (case when ((((`p`.`allocated_amount` - coalesce(sum(`fi`.`amount_released`),0)) / nullif(`p`.`allocated_amount`,0)) * 100) < 20) then 1 else 0 end) AS `is_low_warning`, `p`.`status` AS `status`, `p`.`created_at` AS `created_at`, `p`.`closed_at` AS `closed_at`, (to_days(`p`.`week_end`) - to_days(curdate())) AS `days_remaining_in_period`, round((coalesce(sum(`fi`.`amount_released`),0) / nullif((to_days(curdate()) - to_days(`p`.`week_start`)),0)),2) AS `avg_daily_spend`, round(((coalesce(sum(`fi`.`amount_released`),0) / nullif((to_days(curdate()) - to_days(`p`.`week_start`)),0)) * 7),2) AS `projected_week_total` FROM ((`dept_budget_period` `p` join `departments` `d` on((`d`.`department_id` = `p`.`department_id`))) left join `fund_issuance` `fi` on((`fi`.`period_id` = `p`.`period_id`))) GROUP BY `p`.`period_id`, `p`.`department_id`, `d`.`department_name`, `d`.`department_code`, `p`.`week_start`, `p`.`week_end`, `p`.`allocated_amount`, `p`.`status`, `p`.`created_at`, `p`.`closed_at``closed_at`  ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `audit_log_user_id_foreign` (`user_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`department_id`),
  ADD UNIQUE KEY `departments_department_code_unique` (`department_code`);

--
-- Indexes for table `department_request`
--
ALTER TABLE `department_request`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `department_request_department_id_foreign` (`department_id`),
  ADD KEY `department_request_submitted_by_foreign` (`submitted_by`),
  ADD KEY `department_request_affected_vehicle_id_foreign` (`affected_vehicle_id`),
  ADD KEY `department_request_affected_driver_id_foreign` (`affected_driver_id`),
  ADD KEY `department_request_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `dept_budget_period`
--
ALTER TABLE `dept_budget_period`
  ADD PRIMARY KEY (`period_id`),
  ADD KEY `dept_budget_period_department_id_foreign` (`department_id`);

--
-- Indexes for table `dept_budget_policy`
--
ALTER TABLE `dept_budget_policy`
  ADD PRIMARY KEY (`policy_id`),
  ADD KEY `dept_budget_policy_department_id_foreign` (`department_id`);

--
-- Indexes for table `dept_crud_request`
--
ALTER TABLE `dept_crud_request`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `dept_crud_request_department_id_foreign` (`department_id`),
  ADD KEY `dept_crud_request_submitted_by_foreign` (`submitted_by`),
  ADD KEY `dept_crud_request_affected_vehicle_id_foreign` (`affected_vehicle_id`),
  ADD KEY `dept_crud_request_affected_driver_id_foreign` (`affected_driver_id`),
  ADD KEY `dept_crud_request_affected_user_id_foreign` (`affected_user_id`),
  ADD KEY `dept_crud_request_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`driver_id`),
  ADD KEY `drivers_user_id_foreign` (`user_id`),
  ADD KEY `idx_drivers_deactivated_by` (`deactivated_by`);

--
-- Indexes for table `event_run_log`
--
ALTER TABLE `event_run_log`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `file_storage`
--
ALTER TABLE `file_storage`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `file_storage_uploaded_by_foreign` (`uploaded_by`),
  ADD KEY `file_storage_deleted_by_foreign` (`deleted_by`);

--
-- Indexes for table `fuel_log`
--
ALTER TABLE `fuel_log`
  ADD PRIMARY KEY (`fuel_log_id`),
  ADD KEY `fuel_log_gas_slip_id_foreign` (`gas_slip_id`);

--
-- Indexes for table `fund_issuance`
--
ALTER TABLE `fund_issuance`
  ADD PRIMARY KEY (`issuance_id`),
  ADD KEY `fund_issuance_gas_slip_id_foreign` (`gas_slip_id`),
  ADD KEY `fund_issuance_period_id_foreign` (`period_id`),
  ADD KEY `idx_fund_issuance_issued_by` (`issued_by`),
  ADD KEY `idx_fund_issuance_acknowledged_by` (`acknowledged_by`);

--
-- Indexes for table `gas_slip`
--
ALTER TABLE `gas_slip`
  ADD PRIMARY KEY (`gas_slip_id`),
  ADD KEY `gas_slip_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `gas_slip_created_by_foreign` (`created_by`),
  ADD KEY `idx_gas_slip_reconciled_by` (`reconciled_by`),
  ADD KEY `idx_gas_slip_receipt_acknowledged_by` (`receipt_acknowledged_by`);

--
-- Indexes for table `gps_distance_result`
--
ALTER TABLE `gps_distance_result`
  ADD PRIMARY KEY (`result_id`),
  ADD KEY `gps_distance_result_trip_ticket_id_foreign` (`trip_ticket_id`);

--
-- Indexes for table `gps_ping`
--
ALTER TABLE `gps_ping`
  ADD PRIMARY KEY (`ping_id`),
  ADD KEY `idx_gps_trip_time` (`trip_ticket_id`,`received_at` DESC);

--
-- Indexes for table `gso_verification`
--
ALTER TABLE `gso_verification`
  ADD PRIMARY KEY (`verification_id`),
  ADD KEY `gso_verification_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `gso_verification_gso_verified_by_foreign` (`gso_verified_by`);

--
-- Indexes for table `head_approval`
--
ALTER TABLE `head_approval`
  ADD PRIMARY KEY (`approval_id`),
  ADD KEY `head_approval_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `head_approval_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `lookup_request_types`
--
ALTER TABLE `lookup_request_types`
  ADD PRIMARY KEY (`type_code`);

--
-- Indexes for table `lookup_state_transitions`
--
ALTER TABLE `lookup_state_transitions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lookup_trip_status`
--
ALTER TABLE `lookup_trip_status`
  ADD PRIMARY KEY (`status_code`);

--
-- Indexes for table `lookup_user_roles`
--
ALTER TABLE `lookup_user_roles`
  ADD PRIMARY KEY (`role_code`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mo_review`
--
ALTER TABLE `mo_review`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `mo_review_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `mo_review_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `notification_recipient_user_id_foreign` (`recipient_user_id`),
  ADD KEY `idx_notification_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_notification_created` (`created_at`);

--
-- Indexes for table `oic_delegation_log`
--
ALTER TABLE `oic_delegation_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `oic_delegation_log_department_id_foreign` (`department_id`),
  ADD KEY `oic_delegation_log_head_of_office_id_foreign` (`head_of_office_id`),
  ADD KEY `oic_delegation_log_oic_user_id_foreign` (`oic_user_id`);

--
-- Indexes for table `oic_designation`
--
ALTER TABLE `oic_designation`
  ADD PRIMARY KEY (`designation_id`),
  ADD KEY `oic_designation_department_id_foreign` (`department_id`),
  ADD KEY `oic_designation_head_of_office_id_foreign` (`head_of_office_id`),
  ADD KEY `oic_designation_oic_user_id_foreign` (`oic_user_id`);

--
-- Indexes for table `password_history`
--
ALTER TABLE `password_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_user_password_history` (`user_id`,`created_at`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `system_setting`
--
ALTER TABLE `system_setting`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `system_setting_setting_key_unique` (`setting_key`),
  ADD KEY `system_setting_updated_by_foreign` (`updated_by`);

--
-- Indexes for table `trip_ticket`
--
ALTER TABLE `trip_ticket`
  ADD PRIMARY KEY (`trip_ticket_id`),
  ADD UNIQUE KEY `trip_ticket_trip_ticket_number_unique` (`trip_ticket_number`),
  ADD KEY `trip_ticket_submitted_by_foreign` (`submitted_by`),
  ADD KEY `trip_ticket_created_by_mo_user_id_foreign` (`created_by_mo_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_submitted_at` (`submitted_at`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_driver_id` (`driver_id`),
  ADD KEY `idx_vehicle_id` (`vehicle_id`),
  ADD KEY `idx_dept_status` (`department_id`,`status`),
  ADD KEY `idx_status_date` (`status`,`trip_date`);

--
-- Indexes for table `trip_ticket_cancellation`
--
ALTER TABLE `trip_ticket_cancellation`
  ADD PRIMARY KEY (`cancellation_id`),
  ADD KEY `trip_ticket_cancellation_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `idx_trip_ticket_cancellation_cancelled_by` (`cancelled_by`),
  ADD KEY `idx_trip_ticket_cancellation_fund_returned_by` (`fund_returned_by`);

--
-- Indexes for table `trip_ticket_esignature`
--
ALTER TABLE `trip_ticket_esignature`
  ADD PRIMARY KEY (`esig_record_id`),
  ADD KEY `trip_ticket_esignature_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `trip_ticket_esignature_head_approval_id_foreign` (`head_approval_id`),
  ADD KEY `trip_ticket_esignature_user_id_foreign` (`user_id`),
  ADD KEY `trip_ticket_esignature_esig_id_foreign` (`esig_id`);

--
-- Indexes for table `trip_ticket_return`
--
ALTER TABLE `trip_ticket_return`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `trip_ticket_return_trip_ticket_id_foreign` (`trip_ticket_id`),
  ADD KEY `trip_ticket_return_actioned_by_foreign` (`actioned_by`);

--
-- Indexes for table `trip_ticket_vehicle_snapshot`
--
ALTER TABLE `trip_ticket_vehicle_snapshot`
  ADD KEY `trip_ticket_vehicle_snapshot_trip_ticket_id_foreign` (`trip_ticket_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_department_id_foreign` (`department_id`);

--
-- Indexes for table `user_esignature`
--
ALTER TABLE `user_esignature`
  ADD PRIMARY KEY (`esig_id`),
  ADD KEY `user_esignature_user_id_foreign` (`user_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`vehicle_id`),
  ADD UNIQUE KEY `vehicles_plate_number_unique` (`plate_number`),
  ADD KEY `vehicles_department_id_foreign` (`department_id`),
  ADD KEY `idx_vehicles_deactivated_by` (`deactivated_by`);

--
-- Indexes for table `vehicle_odometer_status`
--
ALTER TABLE `vehicle_odometer_status`
  ADD PRIMARY KEY (`status_id`),
  ADD KEY `vehicle_odometer_status_vehicle_id_foreign` (`vehicle_id`),
  ADD KEY `vehicle_odometer_status_reported_by_foreign` (`reported_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `log_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `department_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `department_request`
--
ALTER TABLE `department_request`
  MODIFY `request_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dept_budget_period`
--
ALTER TABLE `dept_budget_period`
  MODIFY `period_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dept_budget_policy`
--
ALTER TABLE `dept_budget_policy`
  MODIFY `policy_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dept_crud_request`
--
ALTER TABLE `dept_crud_request`
  MODIFY `request_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `driver_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `event_run_log`
--
ALTER TABLE `event_run_log`
  MODIFY `log_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `file_storage`
--
ALTER TABLE `file_storage`
  MODIFY `file_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fuel_log`
--
ALTER TABLE `fuel_log`
  MODIFY `fuel_log_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fund_issuance`
--
ALTER TABLE `fund_issuance`
  MODIFY `issuance_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gas_slip`
--
ALTER TABLE `gas_slip`
  MODIFY `gas_slip_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `gps_distance_result`
--
ALTER TABLE `gps_distance_result`
  MODIFY `result_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gps_ping`
--
ALTER TABLE `gps_ping`
  MODIFY `ping_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `gso_verification`
--
ALTER TABLE `gso_verification`
  MODIFY `verification_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `head_approval`
--
ALTER TABLE `head_approval`
  MODIFY `approval_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `lookup_state_transitions`
--
ALTER TABLE `lookup_state_transitions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `mo_review`
--
ALTER TABLE `mo_review`
  MODIFY `review_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `notification_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `oic_delegation_log`
--
ALTER TABLE `oic_delegation_log`
  MODIFY `log_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `oic_designation`
--
ALTER TABLE `oic_designation`
  MODIFY `designation_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `password_history`
--
ALTER TABLE `password_history`
  MODIFY `history_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=250;

--
-- AUTO_INCREMENT for table `system_setting`
--
ALTER TABLE `system_setting`
  MODIFY `setting_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `trip_ticket`
--
ALTER TABLE `trip_ticket`
  MODIFY `trip_ticket_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `trip_ticket_cancellation`
--
ALTER TABLE `trip_ticket_cancellation`
  MODIFY `cancellation_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_ticket_esignature`
--
ALTER TABLE `trip_ticket_esignature`
  MODIFY `esig_record_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trip_ticket_return`
--
ALTER TABLE `trip_ticket_return`
  MODIFY `return_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user_esignature`
--
ALTER TABLE `user_esignature`
  MODIFY `esig_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `vehicle_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `vehicle_odometer_status`
--
ALTER TABLE `vehicle_odometer_status`
  MODIFY `status_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `department_request`
--
ALTER TABLE `department_request`
  ADD CONSTRAINT `department_request_affected_driver_id_foreign` FOREIGN KEY (`affected_driver_id`) REFERENCES `drivers` (`driver_id`),
  ADD CONSTRAINT `department_request_affected_vehicle_id_foreign` FOREIGN KEY (`affected_vehicle_id`) REFERENCES `vehicles` (`vehicle_id`),
  ADD CONSTRAINT `department_request_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `department_request_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `department_request_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `dept_budget_period`
--
ALTER TABLE `dept_budget_period`
  ADD CONSTRAINT `dept_budget_period_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `dept_budget_policy`
--
ALTER TABLE `dept_budget_policy`
  ADD CONSTRAINT `dept_budget_policy_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `dept_crud_request`
--
ALTER TABLE `dept_crud_request`
  ADD CONSTRAINT `dept_crud_request_affected_driver_id_foreign` FOREIGN KEY (`affected_driver_id`) REFERENCES `drivers` (`driver_id`),
  ADD CONSTRAINT `dept_crud_request_affected_user_id_foreign` FOREIGN KEY (`affected_user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `dept_crud_request_affected_vehicle_id_foreign` FOREIGN KEY (`affected_vehicle_id`) REFERENCES `vehicles` (`vehicle_id`),
  ADD CONSTRAINT `dept_crud_request_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `dept_crud_request_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `dept_crud_request_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `drivers`
--
ALTER TABLE `drivers`
  ADD CONSTRAINT `drivers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `file_storage`
--
ALTER TABLE `file_storage`
  ADD CONSTRAINT `file_storage_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `file_storage_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `fuel_log`
--
ALTER TABLE `fuel_log`
  ADD CONSTRAINT `fuel_log_gas_slip_id_foreign` FOREIGN KEY (`gas_slip_id`) REFERENCES `gas_slip` (`gas_slip_id`);

--
-- Constraints for table `fund_issuance`
--
ALTER TABLE `fund_issuance`
  ADD CONSTRAINT `fund_issuance_acknowledged_by_foreign` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fund_issuance_gas_slip_id_foreign` FOREIGN KEY (`gas_slip_id`) REFERENCES `gas_slip` (`gas_slip_id`),
  ADD CONSTRAINT `fund_issuance_issued_by_foreign` FOREIGN KEY (`issued_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fund_issuance_period_id_foreign` FOREIGN KEY (`period_id`) REFERENCES `dept_budget_period` (`period_id`);

--
-- Constraints for table `gas_slip`
--
ALTER TABLE `gas_slip`
  ADD CONSTRAINT `gas_slip_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `gas_slip_receipt_acknowledged_by_foreign` FOREIGN KEY (`receipt_acknowledged_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `gas_slip_reconciled_by_foreign` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `gas_slip_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `gps_distance_result`
--
ALTER TABLE `gps_distance_result`
  ADD CONSTRAINT `gps_distance_result_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `gps_ping`
--
ALTER TABLE `gps_ping`
  ADD CONSTRAINT `gps_ping_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `gso_verification`
--
ALTER TABLE `gso_verification`
  ADD CONSTRAINT `gso_verification_gso_verified_by_foreign` FOREIGN KEY (`gso_verified_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `gso_verification_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `head_approval`
--
ALTER TABLE `head_approval`
  ADD CONSTRAINT `head_approval_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `head_approval_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `mo_review`
--
ALTER TABLE `mo_review`
  ADD CONSTRAINT `mo_review_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `mo_review_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_recipient_user_id_foreign` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `oic_delegation_log`
--
ALTER TABLE `oic_delegation_log`
  ADD CONSTRAINT `oic_delegation_log_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `oic_delegation_log_head_of_office_id_foreign` FOREIGN KEY (`head_of_office_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `oic_delegation_log_oic_user_id_foreign` FOREIGN KEY (`oic_user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `oic_designation`
--
ALTER TABLE `oic_designation`
  ADD CONSTRAINT `oic_designation_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `oic_designation_head_of_office_id_foreign` FOREIGN KEY (`head_of_office_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `oic_designation_oic_user_id_foreign` FOREIGN KEY (`oic_user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `password_history`
--
ALTER TABLE `password_history`
  ADD CONSTRAINT `password_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `system_setting`
--
ALTER TABLE `system_setting`
  ADD CONSTRAINT `system_setting_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `trip_ticket`
--
ALTER TABLE `trip_ticket`
  ADD CONSTRAINT `trip_ticket_created_by_mo_user_id_foreign` FOREIGN KEY (`created_by_mo_user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `trip_ticket_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  ADD CONSTRAINT `trip_ticket_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`driver_id`),
  ADD CONSTRAINT `trip_ticket_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `trip_ticket_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);

--
-- Constraints for table `trip_ticket_cancellation`
--
ALTER TABLE `trip_ticket_cancellation`
  ADD CONSTRAINT `trip_ticket_cancellation_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `trip_ticket_cancellation_fund_returned_by_foreign` FOREIGN KEY (`fund_returned_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `trip_ticket_cancellation_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `trip_ticket_esignature`
--
ALTER TABLE `trip_ticket_esignature`
  ADD CONSTRAINT `trip_ticket_esignature_esig_id_foreign` FOREIGN KEY (`esig_id`) REFERENCES `user_esignature` (`esig_id`),
  ADD CONSTRAINT `trip_ticket_esignature_head_approval_id_foreign` FOREIGN KEY (`head_approval_id`) REFERENCES `head_approval` (`approval_id`),
  ADD CONSTRAINT `trip_ticket_esignature_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`),
  ADD CONSTRAINT `trip_ticket_esignature_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `trip_ticket_return`
--
ALTER TABLE `trip_ticket_return`
  ADD CONSTRAINT `trip_ticket_return_actioned_by_foreign` FOREIGN KEY (`actioned_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `trip_ticket_return_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `trip_ticket_vehicle_snapshot`
--
ALTER TABLE `trip_ticket_vehicle_snapshot`
  ADD CONSTRAINT `trip_ticket_vehicle_snapshot_trip_ticket_id_foreign` FOREIGN KEY (`trip_ticket_id`) REFERENCES `trip_ticket` (`trip_ticket_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `user_esignature`
--
ALTER TABLE `user_esignature`
  ADD CONSTRAINT `user_esignature_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`);

--
-- Constraints for table `vehicle_odometer_status`
--
ALTER TABLE `vehicle_odometer_status`
  ADD CONSTRAINT `vehicle_odometer_status_reported_by_foreign` FOREIGN KEY (`reported_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `vehicle_odometer_status_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
