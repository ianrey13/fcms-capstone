<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        if (DB::table('users')->count() === 0) {
            DB::table('users')->insert([
                [
                    'user_id' => 1,
                    'department_id' => 1,
                    'first_name' => 'Super',
                    'middle_name' => null,
                    'last_name' => 'Admin',
                    'email' => 'superadmin@fcms.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'superadmin',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 2,
                    'department_id' => 2,
                    'first_name' => 'GSO',
                    'middle_name' => null,
                    'last_name' => 'Staff',
                    'email' => 'gso@fcms.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'gso_staff',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 3,
                    'department_id' => 3,
                    'first_name' => 'Ian',
                    'middle_name' => null,
                    'last_name' => 'Ubuab',
                    'email' => 'iubaub6@gmail.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'dept_office',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 4,
                    'department_id' => 3,
                    'first_name' => 'Nilo',
                    'middle_name' => null,
                    'last_name' => 'Botay',
                    'email' => 'driver1@mail.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'driver',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 5,
                    'department_id' => 4,
                    'first_name' => 'RHU',
                    'middle_name' => null,
                    'last_name' => 'Staff',
                    'email' => 'rhu@mail.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'dept_office',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 6,
                    'department_id' => 4,
                    'first_name' => 'RHU',
                    'middle_name' => null,
                    'last_name' => 'Driver',
                    'email' => 'rhudriver@mail.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'driver',
                    'head_active_status' => null,
                    'status' => 'active',
                ],
                [
                    'user_id' => 7,
                    'department_id' => 4,
                    'first_name' => 'RHU',
                    'middle_name' => null,
                    'last_name' => 'Head',
                    'email' => 'rhuhead@mail.com',
                    'password_hash' => Hash::make('password'),
                    'role' => 'head_of_office',
                    'head_active_status' => 'active',
                    'status' => 'active',
                ],
            ]);
        }
    }
}