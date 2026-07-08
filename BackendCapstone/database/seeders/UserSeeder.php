<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    public function run()
    {
        Schema::disableForeignKeyConstraints();
        DB::table('users')->truncate();
        Schema::enableForeignKeyConstraints();

        $users = [
            // ============ GSO OFFICE (Superadmin) ============
            [
                'user_id' => 1,
                'department_id' => 2,
                'first_name' => 'GSO',
                'middle_name' => null,
                'last_name' => 'Admin',
                'email' => 'gso@fcms.com',
                'password_hash' => Hash::make('password'),
                'role' => 'gso_office',
                'can_drive' => false,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0001',
            ],
            // ============ MAYOR'S OFFICE ============
            [
                'user_id' => 2,
                'department_id' => 6,
                'first_name' => 'Mayor',
                'middle_name' => null,
                'last_name' => 'Staff',
                'email' => 'mostaff@mail.com',
                'password_hash' => Hash::make('password'),
                'role' => 'mayors_office',
                'can_drive' => false,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0002',
            ],
            // ============ STAFF (Engineering) ============
            [
                'user_id' => 3,
                'department_id' => 3,
                'first_name' => 'Ian',
                'middle_name' => null,
                'last_name' => 'Ubuab',
                'email' => 'iubaub6@gmail.com',
                'password_hash' => Hash::make('password'),
                'role' => 'staff',
                'can_drive' => false,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0003',
            ],
            // ============ STAFF (RHU) ============
            [
                'user_id' => 4,
                'department_id' => 4,
                'first_name' => 'RHU',
                'middle_name' => null,
                'last_name' => 'Staff',
                'email' => 'rhu@mail.com',
                'password_hash' => Hash::make('password'),
                'role' => 'staff',
                'can_drive' => false,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0004',
            ],
            // ============ DRIVER (Engineering) ============
            [
                'user_id' => 5,
                'department_id' => 3,
                'first_name' => 'Nilo',
                'middle_name' => null,
                'last_name' => 'Botay',
                'email' => 'driver1@mail.com',
                'password_hash' => Hash::make('password'),
                'role' => 'driver',
                'can_drive' => true,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0005',
            ],
            // ============ DRIVER (RHU) ============
            [
                'user_id' => 6,
                'department_id' => 4,
                'first_name' => 'RHU',
                'middle_name' => null,
                'last_name' => 'Driver',
                'email' => 'rhudriver@mail.com',
                'password_hash' => Hash::make('password'),
                'role' => 'driver',
                'can_drive' => true,
                'status' => 'active',
                'created_at' => now(),
                'employee_number' => 'EMP-0006',
            ],
        ];

        DB::table('users')->insert($users);
    }
}