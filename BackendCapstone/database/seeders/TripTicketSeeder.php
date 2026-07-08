<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TripTicketSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('trip_ticket')->truncate();
        DB::table('gas_slip')->truncate();
        DB::table('trip_vehicle_snapshot')->truncate();
        DB::table('trip_ticket_return')->truncate(); // ✅ Added
        DB::table('notifications')->truncate(); // ✅ Optional - clean notifications
        Schema::enableForeignKeyConstraints();

        // ============================================
        // TEST TRIP TICKET (GSO Created)
        // ============================================
        $tripTicketId = DB::table('trip_ticket')->insertGetId([
            'trip_ticket_number' => '2026-06-001',
            'department_id' => 3, // Engineering Office
            'submitted_by' => 1, // GSO Admin
            'driver_id' => 1, // Nilo Botay
            'vehicle_id' => 1, // Donsal Coaster
            'created_by_mo_user_id' => null,
            'submitted_by_staff' => false,
            'submitted_at' => now(),
            'trip_date' => now()->addDays(2),
            'purpose' => 'Official Business Meeting',
            'destination' => 'Cagayan de Oro City Hall',
            'charge_to' => 'ENGR',
            'passenger_name' => 'Ian Ubuab',
            'status' => 'pending_mayors_office',
            'estimated_distance_km' => 35.00,
            'estimated_fuel_liters' => 4.50,
            'has_insufficient_budget' => false,
            'budget_shortage' => 0.00,
            'updated_at' => now(),
            // 'created_at' omitted (auto-set by DB)
        ]);

        // ============================================
        // VEHICLE SNAPSHOT
        // ============================================
        DB::table('trip_vehicle_snapshot')->insert([
            'trip_ticket_id' => $tripTicketId,
            'vehicle_status' => 'active',
            'odometer_status' => 'functional',
            'fuel_type' => 'regular',
            'snapshot_taken_at' => now(),
        ]);

        // ============================================
        // OPTIONAL: Create a second ticket (Staff submitted)
        // ============================================
        $secondTicketId = DB::table('trip_ticket')->insertGetId([
            'trip_ticket_number' => '2026-06-002',
            'department_id' => 4, // RHU
            'submitted_by' => 4, // RHU Staff
            'driver_id' => 2, // RHU Driver
            'vehicle_id' => 2, // Ambulance
            'created_by_mo_user_id' => null,
            'submitted_by_staff' => true,
            'submitted_at' => now(),
            'trip_date' => now()->addDays(3),
            'purpose' => 'Medical Emergency Response',
            'destination' => 'Alubijid Health Center',
            'charge_to' => 'RHU',
            'passenger_name' => 'RHU Staff',
            'status' => 'pending_mayors_office',
            'estimated_distance_km' => 10.00,
            'estimated_fuel_liters' => 1.50,
            'has_insufficient_budget' => false,
            'budget_shortage' => 0.00,
            'updated_at' => now(),
        ]);

        DB::table('trip_vehicle_snapshot')->insert([
            'trip_ticket_id' => $secondTicketId,
            'vehicle_status' => 'active',
            'odometer_status' => 'functional',
            'fuel_type' => 'diesel',
            'snapshot_taken_at' => now(),
        ]);
    }
}